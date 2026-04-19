import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../../auth/[...nextauth]/options";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    // ── Auth check ────────────────────────────────────────────────────
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({
        success: false,
        message: "Unauthorized. Please sign in.",
      }, { status: 401 });
    }

    // ── Param check ───────────────────────────────────────────────────
    const { formId } = await params;
    const id = parseInt(formId);

    if (!formId || isNaN(id)) {
      return NextResponse.json({
        success: false,
        message: "Invalid form ID.",
      }, { status: 400 });
    }

    // ── Pagination query params ───────────────────────────────────────
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '20'));
    const skip = (page - 1) * limit;

    // ── Query ─────────────────────────────────────────────────────────
    const form = await prisma.form.findUnique({
      where: { id },
      include: {
        verifiersList: {
          orderBy: { level: "asc" },
          include: {
            verifier: {
              select: {
                id:         true,
                userName:   true,
                email:      true,
                role:       true,
                department: true,
                mobileNo:   true,
              },
            },
          },
        },
        formSubmissions: {
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
          select: {
            id:           true,
            overallStatus: true,
            currentLevel:  true,
            createdAt:     true,
            updatedAt:     true,
            user: {
              select: {
                id:       true,
                userName: true,
                email:    true,
              },
            },
          },
        },
        _count: {
          select: { formSubmissions: true },
        },
      },
    });

    if (!form) {
      return NextResponse.json({
        success: false,
        message: "Form not found.",
      }, { status: 404 });
    }

    // ── Role-based field filtering ─────────────────────────────────────
    // Regular users only see active forms
    if (session.user.role === "User" && !form.formStatus) {
      return NextResponse.json({
        success: false,
        message: "Form not found.",
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Form fetched successfully.",
      data:    form,
    }, { status: 200 });

  } catch (error: any) {
    console.error("[GET /api/forms/getForm/:formId]", error);
    return NextResponse.json({
      success: false,
      message: error.message ?? "Internal server error.",
    }, { status: 500 });
  }
}