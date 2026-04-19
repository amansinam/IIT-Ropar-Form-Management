import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/options";

export async function GET(req: NextRequest) {
    try {
        // ── Auth check — any logged-in user ───────────────────────────────
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({
                success: false,
                message: "Unauthorized. Please sign in.",
            }, { status: 401 });
        }

        const { searchParams } = req.nextUrl;

        // ── Pagination ────────────────────────────────────────────────────
        const page = parseInt(searchParams.get("page") ?? "1");
        const limit = parseInt(searchParams.get("limit") ?? "10");

        // ── Search ────────────────────────────────────────────────────────
        const search = searchParams.get("search") ?? undefined;

        // ── Where clause — ONLY active forms ─────────────────────────────
        const where = {
            formStatus: true,                          // hard-coded — users never see drafts
            ...(search && {
                OR: [
                    { title: { contains: search, mode: "insensitive" as const } },
                    { description: { contains: search, mode: "insensitive" as const } },
                ],
            }),
        };

        const skip = (page - 1) * limit;

        // ── Query — minimal fields only, no admin metadata ─────────────────
        const [forms, total] = await prisma.$transaction([
            prisma.form.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    deadline: true,
                    createdAt: true,
                    // formStatus intentionally omitted — all results are active
                    // updatedAt, _count intentionally omitted — not needed for users
                },
            }),
            prisma.form.count({ where }),
        ]);

        return NextResponse.json({
            success: true,
            message: "Forms fetched successfully.",
            data: forms,
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
        console.error("[GET /api/form/getPublicForms]", error);
        return NextResponse.json({
            success: false,
            message: error.message ?? "Internal server error.",
        }, { status: 500 });
    }
}