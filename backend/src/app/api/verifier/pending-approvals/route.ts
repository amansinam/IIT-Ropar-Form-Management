// app/api/verifier/pending-approvals/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { prisma } from '@/lib/prisma';
import { SubmissionStatus } from '../../../../../generated/prisma/enums';

// ─── Auth helper ──────────────────────────────────────────────────────────────
async function getAuthorizedVerifier(): Promise<{ id: string; portal: string } | null> {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return null;
    if (session.user.portal === 'user') return null;

    const verifier = await prisma.verifier.findUnique({
        where: { id: session.user.id },
        select: { id: true },
    });

    if (!verifier) return null;
    if (!session?.user?.id || !session.user.portal) return null;
    return { id: session.user.id, portal: session.user.portal };
}

// ─── GET /api/verifier/pending-approvals ──────────────────────────────────────
// Returns all pending submissions where it is currently this verifier's turn
export async function GET(req: NextRequest) {
    const actor = await getAuthorizedVerifier();
    if (!actor) {
        return NextResponse.json({ error: 'Unauthenticated or insufficient permissions' }, { status: 401 });
    }

    try {
        // Find all FormVerifierLevel entries for this verifier
        // then load submissions where currentLevel === verifier's level for that form
        const verifierLevels = await prisma.formVerifierLevel.findMany({
            where: { verifierId: actor.id },
            select: { formId: true, level: true },
        });

        if (verifierLevels.length === 0) {
            return NextResponse.json({ submissions: [] });
        }

        // Build a query that matches: formId + currentLevel = this verifier's level on that form
        const submissions = await prisma.formSubmissions.findMany({
            where: {
                overallStatus: SubmissionStatus.Pending,
                OR: verifierLevels.map(({ formId, level }) => ({
                    formId,
                    currentLevel: level,
                })),
            },
            include: {
                user: {
                    select: { id: true, userName: true, email: true },
                },
                form: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
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
            orderBy: { createdAt: 'asc' },
        });

        const now = new Date();

        const result = submissions.map((s) => {
            const deadlineEndOfDay = new Date(s.form.deadline);
            deadlineEndOfDay.setHours(23, 59, 59, 999);
            const isExpired = deadlineEndOfDay < now;

            // Find this verifier's level entry for this form
            const myLevelEntry = s.form.verifiersList.find(
                (vl) => vl.verifier.id === actor.id
            );

            // Find who the current verifier is (by currentLevel)
            const currentVerifierEntry = s.form.verifiersList.find(
                (vl) => vl.level === s.currentLevel
            );

            return {
                id: s.id,
                studentName: s.user.userName,
                email: s.user.email,
                submissionDate: s.createdAt,
                formId: s.form.id,
                formTitle: s.form.title,
                deadline: s.form.deadline,
                isExpired,
                currentLevel: s.currentLevel,
                totalLevels: s.form.verifiersList.length,
                currentVerifier: currentVerifierEntry?.verifier.userName ?? '—',
                currentVerifierRole: currentVerifierEntry?.verifier.role ?? '—',
                myLevel: myLevelEntry?.level ?? null,
                // canAct: it's this verifier's turn (deadline doesn't block verifier actions)
                canAct: myLevelEntry?.level === s.currentLevel,
            };
        });

        // Stats
        const stats = {
            total: result.length,
            canActNow: result.filter((s) => s.canAct).length,
            expired: result.filter((s) => s.isExpired).length,
            urgent: result.filter((s) => {
                if (s.isExpired) return false;
                const deadline = new Date(s.deadline);
                const diffMs = deadline.getTime() - now.getTime();
                return diffMs > 0 && diffMs < 86400000 * 2; // within 2 days
            }).length,
        };

        return NextResponse.json({ submissions: result, stats });
    } catch (error) {
        console.error('[PendingApprovals GET] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}