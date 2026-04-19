import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { ActorType, LogAction, Role } from "../../../../../generated/prisma/enums";
import { authOptions } from "../../auth/[...nextauth]/options";

export async function POST(req: NextRequest) {
    try {

        // ── Auth check ────────────────────────────────────────────────────
        const session = await getServerSession(authOptions);

        if (!session || session.user?.role !== "Admin") {
            return NextResponse.json({
                success: false,
                message: "Admin is not logged in"
            }, { status: 401 });
        }

        // ── Parse body ────────────────────────────────────────────────────
        const { memberName, email, mobileNo, department, role } = await req.json();

        // ── Validation ────────────────────────────────────────────────────
        if (!memberName || !email || !mobileNo || !department || !role) {
            return NextResponse.json({
                success: false,
                message: "All fields are required"
            }, { status: 400 });
        }

        if (!/\S+@\S+\.\S+/.test(email)) {
            return NextResponse.json({
                success: false,
                message: "Invalid email format."
            }, { status: 400 });
        }

        const validRoles = Object.values(Role);
        if (!validRoles.includes(role as Role)) {
            return NextResponse.json({
                success: false,
                message: `Role must be one of: ${validRoles.join(", ")}.`
            }, { status: 400 });
        }

        // ── Duplicate check ───────────────────────────────────────────────
        const isUserExist = await prisma.verifier.findFirst({
            where: { email }
        });

        if (isUserExist) {
            return NextResponse.json({
                success: false,
                message: "A verifier already exists with this email."
            }, { status: 409 });
        }

        // ── Create verifier + audit log in one transaction ─────────────────
        const registeredUser = await prisma.$transaction(async (tx) => {

            // 1. Create the verifier
            const verifier = await tx.verifier.create({
                data: {
                    userName: memberName,
                    email,
                    mobileNo,
                    role: role as Role,
                    department,
                },
            });

            // 2. Save audit log
            await tx.auditLog.create({
                data: {
                    action: LogAction.VERIFIER_CREATED,
                    entity: "Verifier",
                    entityId: verifier.id,
                    actorType: ActorType.User,       // change to Verifier
                    actorVerifierId: session.user.id,       // ✅ admin is a Verifier
                    actorUserId: null,                  // ✅ not a User
                    diff: {
                        before: null,
                        after: {
                            userName: verifier.userName,
                            email: verifier.email,
                            mobileNo: verifier.mobileNo,
                            role: verifier.role,
                            department: verifier.department,
                        },
                    },
                    meta: {
                        ip: req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown",
                        userAgent: req.headers.get("user-agent") ?? "unknown",
                        adminEmail: session.user.email,
                    },
                },
            });

            return verifier;
        });

        return NextResponse.json({
            success: true,
            message: "Verifier registered successfully.",
            data: registeredUser,
        }, { status: 201 });

    } catch (error: any) {
        console.error("[POST /api/verifiers]", error);
        return NextResponse.json({
            success: false,
            message: error.message ?? "Internal server error.",
        }, { status: 500 });
    }
}