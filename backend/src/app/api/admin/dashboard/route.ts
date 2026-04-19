// app/api/admin/dashboard/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== 'Admin') {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const now = new Date();

        // Run all queries in parallel
        const [
            totalUsers,
            totalForms,
            submissionsByStatus,
            recentSubmissions,
            weeklyData,
            recentForms,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.form.count(),
            prisma.formSubmissions.groupBy({
                by: ['overallStatus'],
                _count: { overallStatus: true },
            }),
            prisma.formSubmissions.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { id: true, userName: true, email: true } },
                    form: { select: { id: true, title: true } },
                },
            }),
            // Last 7 days submissions count per day
            prisma.$queryRaw<{ day: string; count: bigint }[]>`
                SELECT TO_CHAR("createdAt" AT TIME ZONE 'UTC', 'Dy') as day,
                       COUNT(*) as count
                FROM "FormSubmissions"
                WHERE "createdAt" >= NOW() - INTERVAL '7 days'
                GROUP BY TO_CHAR("createdAt" AT TIME ZONE 'UTC', 'Dy'),
                         DATE_TRUNC('day', "createdAt" AT TIME ZONE 'UTC')
                ORDER BY DATE_TRUNC('day', "createdAt" AT TIME ZONE 'UTC')
            `,
            prisma.form.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: { _count: { select: { formSubmissions: true } } },
            }),
        ]);

        const statusMap = Object.fromEntries(
            submissionsByStatus.map((s) => [s.overallStatus, s._count.overallStatus])
        );
        const totalSubmissions = submissionsByStatus.reduce((sum, s) => sum + s._count.overallStatus, 0);

        return NextResponse.json({
            success: true,
            data: {
                stats: {
                    totalUsers,
                    totalForms,
                    totalSubmissions,
                    pending: statusMap['Pending'] ?? 0,
                    approved: statusMap['Approved'] ?? 0,
                    rejected: statusMap['Rejected'] ?? 0,
                    sentBack: statusMap['SentBack'] ?? 0,
                },
                recentSubmissions: recentSubmissions.map((s) => ({
                    id: s.id,
                    userName: s.user.userName,
                    userEmail: s.user.email,
                    formTitle: s.form.title,
                    formId: s.form.id,
                    status: s.overallStatus,
                    currentLevel: s.currentLevel,
                    createdAt: s.createdAt,
                })),
                weeklyData: weeklyData.map((d) => ({
                    day: d.day,
                    submissions: Number(d.count),
                })),
                recentForms: recentForms.map((f) => ({
                    id: f.id,
                    title: f.title,
                    status: f.formStatus,
                    deadline: f.deadline,
                    submissionsCount: f._count.formSubmissions,
                    createdAt: f.createdAt,
                })),
            },
        });
    } catch (error: any) {
        console.error('[Admin Dashboard GET]', error);
        return NextResponse.json({ success: false, message: error.message ?? 'Internal server error' }, { status: 500 });
    }
}
