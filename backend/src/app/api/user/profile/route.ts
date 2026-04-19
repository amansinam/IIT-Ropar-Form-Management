import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/options";

export async function GET() {
    try {
        // ── Auth ──────────────────────────────────────────────────────────
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({
                success: false,
                message: "Unauthorized. Please sign in.",
            }, { status: 401 });
        }

        const userId = session.user.id ?? "";
        const userRole = session.user.role || "User";

        // ── Fetch user profile ────────────────────────────────────────────
        let user;

        if (userRole === "Admin" || userRole === "Verifier") {
            // Fetch from Verifier table
            user = await prisma.verifier.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    userName: true,
                    email: true,
                    role: true,
                    department: true,
                },
            });
        } else {
            // Fetch from User table
            user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    userName: true,
                    email: true,
                },
            });
        }

        if (!user) {
            return NextResponse.json({
                success: false,
                message: "User not found.",
            }, { status: 404 });
        }

        // ── Get submission statistics ─────────────────────────────────────
        let stats = {
            total_submitted: 0,
            pending: 0,
            approved: 0,
        };

        if (userRole === "User") {
            // Get stats for regular users
            const submissions = await prisma.formSubmissions.groupBy({
                by: ["overallStatus"],
                where: { userId },
                _count: { overallStatus: true },
            });

            const statMap = Object.fromEntries(
                submissions.map((s) => [s.overallStatus, s._count.overallStatus])
            );

            stats = {
                total_submitted: submissions.reduce((sum, s) => sum + s._count.overallStatus, 0),
                pending: statMap["Pending"] ?? 0,
                approved: statMap["Approved"] ?? 0,
            };
        }

        // ── Build response ────────────────────────────────────────────────
        return NextResponse.json({
            success: true,
            message: "Profile fetched successfully.",
            data: {
                name: user.userName,
                email: user.email,
                role: userRole === "User" ? "Student" : userRole,
                department: "department" in user ? user.department : "N/A",
                employee_code: userId.substring(0, 8).toUpperCase(),
                stats: {
                    total_submitted: stats.total_submitted,
                    pending: stats.pending,
                    approved: stats.approved,
                },
            },
        }, { status: 200 });

    } catch (error: any) {
        console.error("[GET /api/user/profile]", error);
        return NextResponse.json({
            success: false,
            message: error.message ?? "Internal server error.",
        }, { status: 500 });
    }
}
