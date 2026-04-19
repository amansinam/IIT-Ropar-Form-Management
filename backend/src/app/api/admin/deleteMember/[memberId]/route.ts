import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session?.user.role !== "Admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized Request" },
        { status: 401 }
      );
    }

    const { memberId } = await params;

    if (!memberId) {
      return NextResponse.json(
        { success: false, message: "Member ID is required" },
        { status: 400 }
      );
    }

    // Check if the member exists before attempting deletion
    const existing = await prisma.verifier.findFirst({
      where: { id: memberId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Member not found" },
        { status: 404 }
      );
    }

    // Prevent an Admin from deleting themselves
    if (existing.email === session.user.email) {
      return NextResponse.json(
        { success: false, message: "You cannot delete your own account" },
        { status: 403 }
      );
    }

    await prisma.verifier.delete({
      where: { id: memberId },
    });

    return NextResponse.json(
      { success: true, message: "Member deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.log(error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 400 }
    );
  }
}