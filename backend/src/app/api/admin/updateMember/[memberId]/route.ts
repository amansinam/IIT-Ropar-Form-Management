import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { ActorType, LogAction, Role } from "../../../../../../generated/prisma/enums";
import { authOptions } from "../../../auth/[...nextauth]/options";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "Admin") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { memberId } = await params;
    const existing = await prisma.verifier.findUnique({ where: { id: memberId } });
    if (!existing) {
      return NextResponse.json({ success: false, message: "Member not found" }, { status: 404 });
    }

    const body = await req.json();
    const { memberName, mobileNo, department, role } = body;

    if (role) {
      const validRoles = Object.values(Role);
      if (!validRoles.includes(role as Role)) {
        return NextResponse.json({
          success: false,
          message: `Invalid role. Must be one of: ${validRoles.join(", ")}`,
        }, { status: 400 });
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const verifier = await tx.verifier.update({
        where: { id: memberId },
        data: {
          ...(memberName && { userName: memberName }),
          ...(mobileNo  && { mobileNo }),
          ...(department && { department }),
          ...(role      && { role: role as Role }),
        },
      });

      await tx.auditLog.create({
        data: {
          action: LogAction.VERIFIER_UPDATED,
          entity: "Verifier",
          entityId: memberId,
          actorType: ActorType.Verifier,
          actorVerifierId: session.user.id,
          diff: {
            before: {
              userName: existing.userName,
              mobileNo: existing.mobileNo,
              department: existing.department,
              role: existing.role,
            },
            after: {
              userName: verifier.userName,
              mobileNo: verifier.mobileNo,
              department: verifier.department,
              role: verifier.role,
            },
          },
          meta: { adminEmail: session.user.email },
        },
      });

      return verifier;
    });

    return NextResponse.json({
      success: true,
      message: "Member updated successfully.",
      data: updated,
    });
  } catch (error: any) {
    console.error("[PATCH /api/admin/updateMember]", error);
    return NextResponse.json({
      success: false,
      message: error.message ?? "Internal server error",
    }, { status: 500 });
  }
}
