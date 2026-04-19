import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/options";

export async function GET(req: NextRequest) {
    try {
        // ── Auth ──────────────────────────────────────────────────────────
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({
                success: false,
                message: "Unauthorized. Please sign in.",
            }, { status: 401 });
        }

        const userId = session.user.id;

        // ── Pagination ────────────────────────────────────────────────────
        const { searchParams } = req.nextUrl;
        const page = parseInt(searchParams.get("page") ?? "1");
        const limit = parseInt(searchParams.get("limit") ?? "5");
        const skip = (page - 1) * limit;

        // ── Query ─────────────────────────────────────────────────────────
        const [submissions, total] = await prisma.$transaction([
            prisma.formSubmissions.findMany({
                where: { userId },
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    overallStatus: true,
                    currentLevel: true,
                    createdAt: true,
                    updatedAt: true,

                    // Form info
                    form: {
                        select: {
                            id: true,
                            title: true,
                            // Full verifier chain for progress display
                            verifiersList: {
                                orderBy: { level: "asc" },
                                select: {
                                    level: true,
                                    verifier: {
                                        select: {
                                            userName: true,
                                            role: true,
                                            department: true,
                                        },
                                    },
                                },
                            },
                        },
                    },

                    // Individual verification actions so far
                    verificationActions: {
                        orderBy: { level: "asc" },
                        select: {
                            level: true,
                            status: true,
                            remark: true,
                            actionAt: true,
                            verifier: {
                                select: {
                                    userName: true,
                                    role: true,
                                    department: true,
                                },
                            },
                        },
                    },
                },
            }),

            prisma.formSubmissions.count({ where: { userId } }),
        ]);

        // ── Stats (all-time, not paginated) ───────────────────────────────
        const allSubmissions = await prisma.formSubmissions.groupBy({
            by: ["overallStatus"],
            where: { userId },
            _count: { overallStatus: true },
        });

        const statMap = Object.fromEntries(
            allSubmissions.map((s) => [s.overallStatus, s._count.overallStatus])
        );

        return NextResponse.json({
            success: true,
            message: "Submissions fetched successfully.",
            stats: {
                total: total,
                pending: statMap["Pending"] ?? 0,
                approved: statMap["Approved"] ?? 0,
                rejected: statMap["Rejected"] ?? 0,
                sentBack: statMap["SentBack"] ?? 0,
            },
            data: submissions,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page * limit < total,
                hasPrevPage: page > 1,
            },
        }, { status: 200 });

    } catch (error: any) {
        console.error("[GET /api/submissions/getMySubmissions]", error);
        return NextResponse.json({
            success: false,
            message: error.message ?? "Internal server error.",
        }, { status: 500 });
    }
}