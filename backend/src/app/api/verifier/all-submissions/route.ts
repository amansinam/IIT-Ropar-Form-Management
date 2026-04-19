// app/api/verifier/all-submissions/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { prisma } from '@/lib/prisma';
import { SubmissionStatus } from '../../../../../generated/prisma/enums';

// ─── Auth helper ──────────────────────────────────────────────────────────────
async function getAuthorizedVerifier(): Promise<{ id: string; portal: string } | null> {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.portal) return null;
    if (session.user.portal === 'user') return null;

    const verifier = await prisma.verifier.findUnique({
        where: { id: session.user.id },
        select: { id: true },
    });

    if (!verifier) return null;
    return { id: session.user.id, portal: session.user.portal };
}

// ─── GET /api/verifier/all-submissions ────────────────────────────────────────
// Returns all submissions for forms where this verifier is in the chain.
// Query params:
//   status   → 'Pending' | 'Approved' | 'Rejected' | 'Expired' | 'All'
//   formId   → number (filter by specific form)
//   search   → string (student name or email)
//   startDate → ISO date string
//   endDate   → ISO date string
export async function GET(req: NextRequest) {
    const actor = await getAuthorizedVerifier();
    if (!actor) {
        return NextResponse.json({ error: 'Unauthenticated or insufficient permissions' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get('status') ?? 'All';
    const formIdParam = searchParams.get('formId');
    const search = searchParams.get('search') ?? '';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    try {
        // 1. Find all formIds this verifier is assigned to
        const verifierLevels = await prisma.formVerifierLevel.findMany({
            where: { verifierId: actor.id },
            select: { formId: true, level: true },
        });

        if (verifierLevels.length === 0) {
            return NextResponse.json({ submissions: [], stats: buildEmptyStats() });
        }

        const assignedFormIds = verifierLevels.map((vl) => vl.formId);

        // 2. Build status filter
        // Note: 'Expired' is a derived display status (deadline passed + still Pending),
        // not a DB enum — we fetch Pending and derive it in JS
        const statusFilter: SubmissionStatus[] | undefined =
            statusParam === 'All' || statusParam === 'Expired'
                ? undefined // fetch all, derive Expired in JS
                : statusParam === 'Pending'
                    ? [SubmissionStatus.Pending]
                    : statusParam === 'Accepted'
                        ? [SubmissionStatus.Approved]
                        : statusParam === 'Rejected'
                            ? [SubmissionStatus.Rejected]
                            : undefined;

        // 3. Build date filter on createdAt
        const createdAtFilter: { gte?: Date; lte?: Date } = {};
        if (startDate) createdAtFilter.gte = new Date(startDate);
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            createdAtFilter.lte = end;
        }

        // 4. Fetch submissions
        const submissions = await prisma.formSubmissions.findMany({
            where: {
                formId: formIdParam ? Number(formIdParam) : { in: assignedFormIds },
                ...(formIdParam ? {} : { formId: { in: assignedFormIds } }),
                ...(statusFilter ? { overallStatus: { in: statusFilter } } : {}),
                ...(Object.keys(createdAtFilter).length ? { createdAt: createdAtFilter } : {}),
                ...(search
                    ? {
                        user: {
                            OR: [
                                { userName: { contains: search, mode: 'insensitive' } },
                                { email: { contains: search, mode: 'insensitive' } },
                            ],
                        },
                    }
                    : {}),
            },
            include: {
                user: {
                    select: { id: true, userName: true, email: true },
                },
                form: {
                    select: {
                        id: true,
                        title: true,
                        deadline: true,
                        verifiersList: {
                            orderBy: { level: 'asc' },
                            include: {
                                verifier: {
                                    select: { id: true, userName: true, role: true },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        const now = new Date();

        // 5. Map to response shape + derive display status
        const mapped = submissions.map((s) => {
            const deadlineEndOfDay = new Date(s.form.deadline);
            deadlineEndOfDay.setHours(23, 59, 59, 999);
            const isExpired = deadlineEndOfDay < now;

            let displayStatus: 'Accepted' | 'Pending' | 'Rejected' | 'Expired';
            if (s.overallStatus === SubmissionStatus.Approved) {
                displayStatus = 'Accepted';
            } else if (s.overallStatus === SubmissionStatus.Rejected) {
                displayStatus = 'Rejected';
            } else if (isExpired) {
                displayStatus = 'Expired';
            } else {
                displayStatus = 'Pending';
            }

            // Current verifier (by currentLevel)
            const currentVerifierEntry = s.form.verifiersList.find(
                (vl) => vl.level === s.currentLevel
            );

            return {
                id: s.id,
                studentName: s.user.userName,
                email: s.user.email,
                formId: s.form.id,
                formTitle: s.form.title,
                submissionDate: s.createdAt,
                deadline: s.form.deadline,
                isExpired,
                status: displayStatus,
                overallStatus: s.overallStatus,
                currentLevel: s.currentLevel,
                totalLevels: s.form.verifiersList.length,
                currentVerifier: currentVerifierEntry?.verifier.userName ?? '—',
                currentVerifierRole: currentVerifierEntry?.verifier.role ?? '—',
            };
        });

        // 6. Apply derived Expired filter if requested
        const result =
            statusParam === 'Expired'
                ? mapped.filter((s) => s.status === 'Expired')
                : mapped;

        // 7. Build stats from the full unfiltered set for this verifier
        const allForStats = mapped; // already all statuses when no status filter
        const stats = {
            total: allForStats.length,
            pending: allForStats.filter((s) => s.status === 'Pending').length,
            accepted: allForStats.filter((s) => s.status === 'Accepted').length,
            rejected: allForStats.filter((s) => s.status === 'Rejected').length,
            expired: allForStats.filter((s) => s.status === 'Expired').length,
        };

        // 8. Distinct form list for the form filter dropdown
        const formOptions = Array.from(
            new Map(
                submissions.map((s) => [s.form.id, { id: s.form.id, title: s.form.title }])
            ).values()
        );

        return NextResponse.json({ submissions: result, stats, formOptions });
    } catch (error) {
        console.error('[AllSubmissions GET] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

function buildEmptyStats() {
    return { total: 0, pending: 0, accepted: 0, rejected: 0, expired: 0 };
}