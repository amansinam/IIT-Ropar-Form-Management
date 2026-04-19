import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/options";
import { ActorType, LogAction } from "../../../../../generated/prisma/enums";

const allowedTypes = [
    "text", "number", "date", "file", "checkbox",
    "radio", "select", "textarea", "email", "tel",  // ← "phone" → "tel"
];

const isValidField = (field: any) => {
    if (typeof field.label !== "string") return false;
    if (!allowedTypes.includes(field.type)) return false;
    if (typeof field.required !== "boolean") return false;

    if (["radio", "select", "checkbox"].includes(field.type)) {
        if (!Array.isArray(field.options) || field.options.length === 0) return false;
        if (!field.options.every((opt: any) => typeof opt === "string")) return false;
    }

    return true;
};

const isValidVerifierLevel = (v: any) => {
    if (typeof v.verifierId !== "string") return false;
    if (typeof v.level !== "number" || v.level < 1) return false;
    return true;
};

export async function POST(req: NextRequest) {
    try {
        // ── Auth check ────────────────────────────────────────────────────
        const session = await getServerSession(authOptions);

        if (!session?.user || session.user.role !== "Admin") {
            return NextResponse.json({
                success: false,
                message: "Unauthorized. Only admins can create forms.",
            }, { status: 401 });
        }

        // ── Parse body ────────────────────────────────────────────────────
        const { title, description, deadline, formStatus, fields, verifiers } = await req.json();

        // ── Basic field validation ─────────────────────────────────────────
        if (!title || !description || !deadline || formStatus === undefined || !fields) {
            return NextResponse.json({
                success: false,
                message: "title, description, deadline, formStatus and fields are all required.",
            }, { status: 400 });
        }

        if (typeof title !== "string" || title.trim() === "") {
            return NextResponse.json({
                success: false,
                message: "Title must be a non-empty string.",
            }, { status: 400 });
        }

        if (isNaN(Date.parse(deadline))) {
            return NextResponse.json({
                success: false,
                message: "deadline must be a valid ISO date string.",
            }, { status: 400 });
        }

        if (!Array.isArray(fields) || fields.length === 0) {
            return NextResponse.json({
                success: false,
                message: "fields must be a non-empty array.",
            }, { status: 400 });
        }

        if (!fields.every(isValidField)) {
            return NextResponse.json({
                success: false,
                message: "One or more fields are invalid. Check type, label, required, and options.",
            }, { status: 400 });
        }

        // ── Verifiers validation ──────────────────────────────────────────
        if (!Array.isArray(verifiers) || verifiers.length === 0) {
            return NextResponse.json({
                success: false,
                message: "At least one verifier level is required.",
            }, { status: 400 });
        }

        if (!verifiers.every(isValidVerifierLevel)) {
            return NextResponse.json({
                success: false,
                message: "Each verifier must have a valid verifierId (string) and level (number >= 1).",
            }, { status: 400 });
        }

        // Check for duplicate levels
        const levels = verifiers.map((v: any) => v.level);
        if (new Set(levels).size !== levels.length) {
            return NextResponse.json({
                success: false,
                message: "Each verifier must have a unique level.",
            }, { status: 400 });
        }

        // Check for duplicate verifierIds
        const verifierIds = verifiers.map((v: any) => v.verifierId);
        if (new Set(verifierIds).size !== verifierIds.length) {
            return NextResponse.json({
                success: false,
                message: "The same verifier cannot appear more than once.",
            }, { status: 400 });
        }

        // Verify all verifierIds actually exist in the database
        const existingVerifiers = await prisma.verifier.findMany({
            where: { id: { in: verifierIds } },
            select: { id: true },
        });

        if (existingVerifiers.length !== verifierIds.length) {
            return NextResponse.json({
                success: false,
                message: "One or more verifierIds do not exist in the database.",
            }, { status: 400 });
        }

        // ── Create form + verifier levels + audit log in one transaction ───
        const createdForm = await prisma.$transaction(async (tx) => {

            // 1. Create the form
            const form = await tx.form.create({
                data: {
                    title:       title.trim(),
                    description: description.trim(),
                    deadline:    new Date(deadline),
                    formStatus:  Boolean(formStatus),
                    formFields:  fields,
                },
            });

            // 2. Create ordered verifier levels
            await tx.formVerifierLevel.createMany({
                data: verifiers.map((v: any) => ({
                    formId:     form.id,
                    verifierId: v.verifierId,
                    level:      v.level,
                })),
            });

            // 3. Save audit log
            await tx.auditLog.create({
                data: {
                    action:             LogAction.FORM_CREATED,
                    entity:             "Form",
                    entityId:           String(form.id),
                    actorType:          ActorType.Verifier,   // ✅ admin is a Verifier
                    actorVerifierId:    session.user.id,       // ✅ FK to Verifier table
                    actorUserId:        null,                  // ✅ not a User
                    formId:             form.id,
                    diff: {
                        before: null,
                        after: {
                            title:       form.title,
                            description: form.description,
                            deadline:    form.deadline,
                            formStatus:  form.formStatus,
                            formFields:  form.formFields,
                            verifiers:   verifiers,
                        },
                    },
                    meta: {
                        ip:         req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown",
                        userAgent:  req.headers.get("user-agent") ?? "unknown",
                        adminEmail: session.user.email,
                    },
                },
            });

            // 4. Return form with verifier levels included
            return tx.form.findUnique({
                where: { id: form.id },
                include: {
                    verifiersList: {
                        orderBy: { level: "asc" },
                        include: { verifier: true },
                    },
                },
            });
        });

        return NextResponse.json({
            success: true,
            message: "Form created successfully.",
            data: createdForm,
        }, { status: 201 });

    } catch (error: any) {
        console.error("[POST /api/forms/createForm]", error);
        return NextResponse.json({
            success: false,
            message: error.message ?? "Internal server error.",
        }, { status: 500 });
    }
}