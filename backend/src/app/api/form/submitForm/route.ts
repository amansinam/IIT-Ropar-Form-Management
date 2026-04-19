import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { authOptions } from "../../auth/[...nextauth]/options";

// ── Types ─────────────────────────────────────────────────────────────────────
interface FieldValue {
    label: string;
    value: string | boolean;
}

interface FileFieldValue {
    label: string;
    value: string;
    url: string;
}

type EnrichedFieldValue = FieldValue | FileFieldValue;

// ── File upload helper ────────────────────────────────────────────────────────
async function saveFile(file: File, submissionId: string): Promise<string> {
    const uploadDir = join(process.cwd(), "public", "uploads", submissionId);

    if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    const filepath = join(uploadDir, filename);

    await writeFile(filepath, buffer);

    return `/uploads/${submissionId}/${filename}`;
}

// ── Route ─────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
    try {
        // ── Auth ────────────────────────────────────────────────────────
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({
                success: false,
                message: "Unauthorized. Please sign in.",
            }, { status: 401 });
        }

        const userId = session.user.id;

        if (!userId) {
            return NextResponse.json({
                success: false,
                message: "Session is missing user ID. Please sign in again.",
            }, { status: 401 });
        }

        // ✅ Verify the user actually exists in the DB before doing anything else
        const userExists = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true },
        });

        if (!userExists) {
            console.error(`[submitForm] userId from session not found in DB: "${userId}"`);
            return NextResponse.json({
                success: false,
                message: "Your session references an unknown user. Please sign out and sign in again.",
            }, { status: 401 });
        }

        // ── Parse multipart form data ────────────────────────────────────
        const formDataRaw = await req.formData();

        const formIdRaw = formDataRaw.get("formId");
        const fieldsRaw = formDataRaw.get("fields");
        const signatureRaw = formDataRaw.get("signature");

        // ── Validate inputs ──────────────────────────────────────────────
        if (!formIdRaw || !fieldsRaw) {
            return NextResponse.json({
                success: false,
                message: "formId and fields are required.",
            }, { status: 400 });
        }

        const formId = parseInt(formIdRaw.toString());

        if (isNaN(formId)) {
            return NextResponse.json({
                success: false,
                message: "Invalid form ID.",
            }, { status: 400 });
        }

        // ── Check form exists and is active ─────────────────────────────
        const form = await prisma.form.findUnique({
            where: { id: formId },
            select: {
                id: true,
                title: true,
                formStatus: true,
                deadline: true,
                formFields: true,
                verifiersList: {
                    orderBy: { level: "asc" },
                    select: { level: true },
                },
            },
        });

        if (!form) {
            return NextResponse.json({
                success: false,
                message: "Form not found.",
            }, { status: 404 });
        }

        if (!form.formStatus) {
            return NextResponse.json({
                success: false,
                message: "This form is currently inactive.",
            }, { status: 403 });
        }

        if (new Date() > new Date(form.deadline)) {
            return NextResponse.json({
                success: false,
                message: "The deadline for this form has passed.",
            }, { status: 403 });
        }


        // ── Parse fields JSON ────────────────────────────────────────────
        let fields: Record<string, FieldValue>;
        try {
            fields = JSON.parse(fieldsRaw.toString());
        } catch {
            return NextResponse.json({
                success: false,
                message: "Invalid fields format. Expected JSON.",
            }, { status: 400 });
        }

        // ── Validate required fields ─────────────────────────────────────
        const formFields = form.formFields as Array<{
            id: string;
            label: string;
            required: boolean;
            type: string;
        }>;

        const findSubmittedValue = (
            f: { id: string; label: string },
            index: number
        ): string | boolean | undefined => {
            if (fields[f.id] !== undefined) return fields[f.id].value;

            const indexKey = `field-${index}`;
            if (fields[indexKey] !== undefined) return fields[indexKey].value;

            const byLabel = Object.values(fields).find(
                (entry) => entry.label === f.label
            );
            return byLabel?.value;
        };

        const missingRequired = formFields
            .filter((f) => f.required && f.type !== "file")
            .filter((f, i) => {
                const val = findSubmittedValue(f, i);
                if (val === undefined || val === null) return true;
                if (typeof val === "boolean") return false;
                return String(val).trim() === "";
            })
            .map((f) => f.label);

        if (missingRequired.length > 0) {
            return NextResponse.json({
                success: false,
                message: `Missing required fields: ${missingRequired.join(", ")}`,
            }, { status: 400 });
        }

        // ── Create submission record first (need ID for file paths) ──────
        const submission = await prisma.formSubmissions.create({
            data: {
                userId,
                formId,
                formData: fields as any,
                currentLevel: form.verifiersList[0]?.level ?? 1,
                overallStatus: "Pending",
            },
        });

        // ── Handle file uploads ──────────────────────────────────────────
        const fileUrls: Record<string, string> = {};

        for (const [key, value] of formDataRaw.entries()) {
            if (key.startsWith("file_") && value instanceof File && value.size > 0) {
                const fieldId = key.replace("file_", "");
                const url = await saveFile(value, submission.id);
                fileUrls[fieldId] = url;
            }
        }

        let signatureUrl: string | null = null;
        if (signatureRaw instanceof File && signatureRaw.size > 0) {
            signatureUrl = await saveFile(signatureRaw, submission.id);
        }

        // ── Merge file URLs into formData and update ─────────────────────
        const enrichedFields: Record<string, EnrichedFieldValue> = { ...fields };

        for (const [fieldId, url] of Object.entries(fileUrls)) {
            const matchedField =
                formFields.find((f) => f.id === fieldId) ??
                formFields.find((_, i) => `field-${i}` === fieldId);

            enrichedFields[fieldId] = {
                label: matchedField?.label ?? fieldId,
                value: url,
                url,
            };
        }

        if (signatureUrl) {
            enrichedFields["__signature__"] = {
                label: "Signature",
                value: signatureUrl,
                url: signatureUrl,
            };
        }

        const updatedSubmission = await prisma.formSubmissions.update({
            where: { id: submission.id },
            data: {
                formData: enrichedFields as any,
            },
        });

        return NextResponse.json({
            success: true,
            message: "Form submitted successfully.",
            data: {
                submissionId: updatedSubmission.id,
                overallStatus: updatedSubmission.overallStatus,
                currentLevel: updatedSubmission.currentLevel,
            },
        }, { status: 201 });

    } catch (error: any) {
        console.error("[POST /api/form/submitForm]", error);
        return NextResponse.json({
            success: false,
            message: error.message ?? "Internal server error.",
        }, { status: 500 });
    }
}