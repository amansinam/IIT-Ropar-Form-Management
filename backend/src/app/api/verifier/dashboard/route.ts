// app/api/verifier/dashboard/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { prisma } from '@/lib/prisma';
import { SubmissionStatus } from '../../../../../generated/prisma/enums';

async function getAuthorizedVerifier() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.portal === 'user') return null;
    const verifier = await prisma.verifier.findUnique({
        where: { id: session.user.id },
        select: { id: true, userName: true, email: true, role: true, department: true, mobileNo: true },
    });
    return verifier ? { ...verifier, session: session.user } : null;
}

export async function GET() {
    try {
        const actor = await getAuthorizedVerifier();
        if (!actor) {
            return NextResponse.json({ error: 'Unauthenticated or insufficient permissions' }, { status: 401 });
        }

        const now = new Date();

        // Forms this verifier is assigned to
        const verifierLevels = await prisma.formVerifierLevel.findMany({
            where: { verifierId: actor.id },
            select: { formId: true, level: true, form: { select: { deadline: true } } },
        });
        const assignedFormIds = verifierLevels.map(vl => vl.formId);

        if (assignedFormIds.length === 0) {
            return NextResponse.json({
                success: true,
                data: {
                    verifier: { name: actor.userName, email: actor.email, role: actor.role, department: actor.department },
                    stats: { allSubmissions: 0, accepted: 0, rejected: 0, pending: 0, expired: 0 },
                    weeklyData: buildEmptyWeekly(),
                    recentSubmissions: [],
                },
            });
        }

        // All submissions on assigned forms
        const allSubmissions = await prisma.formSubmissions.findMany({
            where: { formId: { in: assignedFormIds } },
            include: {
                user: { select: { userName: true, email: true } },
                form: { select: { id: true, title: true, deadline: true, verifiersList: { orderBy: { level: 'asc' } } } },
                verificationActions: { select: { level: true, status: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Compute stats
        let accepted = 0, rejected = 0, pending = 0, expired = 0;
        for (const s of allSubmissions) {
            if (s.overallStatus === SubmissionStatus.Approved) accepted++;
            else if (s.overallStatus === SubmissionStatus.Rejected) rejected++;
            else if (s.overallStatus === SubmissionStatus.SentBack) pending++;
            else {
                // Pending — check if expired
                const deadline = new Date(s.form.deadline);
                deadline.setHours(23, 59, 59, 999);
                if (deadline < now) expired++;
                else pending++;
            }
        }

        // Weekly data — last 7 days
        const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const weeklyMap: Record<string, { submissions: number; accepted: number; rejected: number }> = {};
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const key = weekDays[d.getDay()];
            weeklyMap[key] = { submissions: 0, accepted: 0, rejected: 0 };
        }

        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        for (const s of allSubmissions) {
            if (new Date(s.createdAt) >= sevenDaysAgo) {
                const key = weekDays[new Date(s.createdAt).getDay()];
                if (weeklyMap[key]) {
                    weeklyMap[key].submissions++;
                    if (s.overallStatus === SubmissionStatus.Approved) weeklyMap[key].accepted++;
                    if (s.overallStatus === SubmissionStatus.Rejected) weeklyMap[key].rejected++;
                }
            }
        }
        const weeklyData = Object.entries(weeklyMap).map(([day, d]) => ({ day, ...d }));

        // Recent 5 submissions
        const recentSubmissions = allSubmissions.slice(0, 5).map(s => {
            const myLevel = verifierLevels.find(vl => vl.formId === s.formId)?.level ?? null;
            const deadline = new Date(s.form.deadline);
            deadline.setHours(23, 59, 59, 999);
            const isExpired = deadline < now;

            let displayStatus: string;
            if (s.overallStatus === SubmissionStatus.Approved) displayStatus = 'Accepted';
            else if (s.overallStatus === SubmissionStatus.Rejected) displayStatus = 'Rejected';
            else if (s.overallStatus === SubmissionStatus.SentBack) displayStatus = 'Sent Back';
            else if (isExpired) displayStatus = 'Expired';
            else displayStatus = 'Pending';

            return {
                id: s.id,
                studentName: s.user.userName,
                email: s.user.email,
                formTitle: s.form.title,
                formId: s.form.id,
                submissionDate: s.createdAt,
                status: displayStatus,
                currentLevel: s.currentLevel,
                totalLevels: s.form.verifiersList.length,
                myLevel,
            };
        });

        return NextResponse.json({
            success: true,
            data: {
                verifier: { name: actor.userName, email: actor.email, role: actor.role, department: actor.department },
                stats: { allSubmissions: allSubmissions.length, accepted, rejected, pending, expired },
                weeklyData,
                recentSubmissions,
            },
        });
    } catch (error: any) {
        console.error('[Verifier Dashboard GET]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

function buildEmptyWeekly() {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map(day => ({ day, submissions: 0, accepted: 0, rejected: 0 }));
}
