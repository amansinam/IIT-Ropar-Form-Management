// src/app/api/verifier/getAssignedForms/route.ts

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/options";

export async function GET(req: NextRequest) {
  try {
    // ── Auth ────────────────────────────────────────────────────────
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    if (session.user.portal !== "verifier" && session.user.portal !== "admin") {
      return NextResponse.json(
        { success: false, message: "Access denied. Verifier role required." },
        { status: 403 }
      );
    }

    const verifierId = session.user.id;

    if (!verifierId) {
      return NextResponse.json(
        { success: false, message: "Session is missing user ID." },
        { status: 401 }
      );
    }

    // ── Fetch all FormVerifierLevel entries assigned to this verifier ──
    const assignedLevels = await prisma.formVerifierLevel.findMany({
      where: { verifierId },
      select: {
        level: true,
        form: {
          select: {
            id: true,
            title: true,
            description: true,
            deadline: true,
            formStatus: true,
            createdAt: true,
            formSubmissions: {
              select: {
                overallStatus: true,
                currentLevel: true,
              },
            },
          },
        },
      },
    });

    // ── Shape the response ──────────────────────────────────────────
    const forms = assignedLevels.map(({ level, form }) => {
      const submissions = form.formSubmissions;

      const totalSubmissions = submissions.length;

      // Submissions currently waiting at this verifier's level
      const awaitingReview = submissions.filter(
        (s) => s.currentLevel === level && s.overallStatus === "Pending"
      ).length;

      // ✅ Correct enum values from schema: Pending | Approved | Rejected
      const pending = submissions.filter(
        (s) => s.overallStatus === "Pending"
      ).length;

      const approved = submissions.filter(
        (s) => s.overallStatus === "Approved"
      ).length;

      const rejected = submissions.filter(
        (s) => s.overallStatus === "Rejected"
      ).length;

      const isExpired = new Date() > new Date(form.deadline);
      const status: "Active" | "Closed" =
        form.formStatus && !isExpired ? "Active" : "Closed";

      return {
        id: form.id,
        formName: form.title,
        description: form.description,
        deadline: form.deadline,
        createdAt: form.createdAt,
        status,
        level,
        totalSubmissions,
        pending,
        approved,
        rejected,
        awaitingReview,
      };
    });

    // Sort: active first, then by soonest deadline
    forms.sort((a, b) => {
      if (a.status !== b.status) return a.status === "Active" ? -1 : 1;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });

    return NextResponse.json(
      { success: true, data: forms },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("[GET /api/verifier/getAssignedForms]", error);
    return NextResponse.json(
      { success: false, message: error.message ?? "Internal server error." },
      { status: 500 }
    );
  }
}