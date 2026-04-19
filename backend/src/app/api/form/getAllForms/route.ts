import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/options";

export async function GET(req: NextRequest) {
  try {
    // ── Auth check ────────────────────────────────────────────────────
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "Admin") {
      return NextResponse.json({
        success: false,
        message: "Unauthorized. Only admins can view forms.",
      }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;

    // ── Pagination ────────────────────────────────────────────────────
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "10");

    if (isNaN(page) || page < 1) {
      return NextResponse.json({
        success: false,
        message: "Invalid 'page' value.",
      }, { status: 400 });
    }

    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json({
        success: false,
        message: "'limit' must be between 1 and 100.",
      }, { status: 400 });
    }

    // ── Filters ───────────────────────────────────────────────────────
    const search = searchParams.get("search") ?? undefined;
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";
    const formStatusParam = searchParams.get("formStatus");

    // formStatus: "true" → active, "false" → draft, absent → all
    const formStatus =
      formStatusParam === "true" ? true :
        formStatusParam === "false" ? false :
          undefined;

    // ── Date range ────────────────────────────────────────────────────
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    const from = fromParam ? new Date(fromParam) : undefined;
    const to = toParam ? new Date(toParam) : undefined;

    if (from && isNaN(from.getTime())) {
      return NextResponse.json({
        success: false,
        message: "Invalid 'from' date format.",
      }, { status: 400 });
    }

    if (to && isNaN(to.getTime())) {
      return NextResponse.json({
        success: false,
        message: "Invalid 'to' date format.",
      }, { status: 400 });
    }

    if (from && to && from > to) {
      return NextResponse.json({
        success: false,
        message: "'from' date must be before 'to' date.",
      }, { status: 400 });
    }

    // ── Build where clause ─────────────────────────────────────────────
    const where = {
      ...(formStatus !== undefined && { formStatus }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...((from || to) && {
        createdAt: {
          ...(from && { gte: from }),
          ...(to && { lte: to }),
        },
      }),
    };

    const skip = (page - 1) * limit;

    // ── Query ──────────────────────────────────────────────────────────
    const [forms, total] = await prisma.$transaction([
      prisma.form.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: sortOrder },
        select: {
          id: true,
          title: true,
          description: true,
          deadline: true,
          formStatus: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { formSubmissions: true },
          },
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
    console.error("[GET /api/forms/getAllForms]", error);
    return NextResponse.json({
      success: false,
      message: error.message ?? "Internal server error.",
    }, { status: 500 });
  }
}