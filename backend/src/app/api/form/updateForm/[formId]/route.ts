import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../../auth/[...nextauth]/options";
import { ActorType, LogAction } from "../../../../../../generated/prisma/enums";

// ─── Validators ───────────────────────────────────────────────────────────────

const allowedTypes = [
  "text", "number", "date", "file", "checkbox",
  "radio", "select", "textarea", "email", "tel",
];

const isValidField = (field: any) => {
  if (typeof field.label    !== "string")  return false;
  if (!allowedTypes.includes(field.type))  return false;
  if (typeof field.required !== "boolean") return false;
  if (["radio", "select", "checkbox"].includes(field.type)) {
    if (!Array.isArray(field.options) || field.options.length === 0) return false;
    if (!field.options.every((opt: any) => typeof opt === "string")) return false;
  }
  return true;
};

const isValidVerifierLevel = (v: any) => {
  if (typeof v.verifierId !== "string")              return false;
  if (typeof v.level !== "number" || v.level < 1)   return false;
  return true;
};

// ─── PATCH /api/forms/updateForm/[formId] ─────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    // ── Auth check ──────────────────────────────────────────────────────
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "Admin") {
      return NextResponse.json({
        success: false,
        message: "Unauthorized. Only admins can update forms.",
      }, { status: 401 });
    }

    // ── Param check ─────────────────────────────────────────────────────
    const { formId } = await params;
    const id = parseInt(formId);

    if (!formId || isNaN(id)) {
      return NextResponse.json({
        success: false,
        message: "Invalid form ID.",
      }, { status: 400 });
    }

    // ── Check form exists ───────────────────────────────────────────────
    const existingForm = await prisma.form.findUnique({
      where: { id },
      include: {
        verifiersList: true,
      },
    });

    if (!existingForm) {
      return NextResponse.json({
        success: false,
        message: "Form not found.",
      }, { status: 404 });
    }

    // ── Parse body ──────────────────────────────────────────────────────
    const { title, description, deadline, formStatus, fields, verifiers } = await req.json();

    // ── Validate title ──────────────────────────────────────────────────
    if (title !== undefined) {
      if (typeof title !== "string" || title.trim() === "") {
        return NextResponse.json({
          success: false,
          message: "Title must be a non-empty string.",
        }, { status: 400 });
      }
    }

    // ── Validate deadline ───────────────────────────────────────────────
    if (deadline !== undefined && isNaN(Date.parse(deadline))) {
      return NextResponse.json({
        success: false,
        message: "deadline must be a valid ISO date string.",
      }, { status: 400 });
    }

    // ── Validate fields ─────────────────────────────────────────────────
    if (fields !== undefined) {
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
    }

    // ── Validate verifiers ──────────────────────────────────────────────
    if (verifiers !== undefined) {
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

      // Verify all verifierIds exist in DB
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
    }

    // ── Update form + verifier levels + audit log in one transaction ────
    const updatedForm = await prisma.$transaction(async (tx) => {

      // 1. Update form core fields
      const form = await tx.form.update({
        where: { id },
        data: {
          ...(title       !== undefined && { title:       title.trim()        }),
          ...(description !== undefined && { description: description.trim()  }),
          ...(deadline    !== undefined && { deadline:    new Date(deadline)   }),
          ...(formStatus  !== undefined && { formStatus:  Boolean(formStatus)  }),
          ...(fields      !== undefined && { formFields:  fields               }),
        },
      });

      // 2. Replace verifier levels if provided
      if (verifiers !== undefined) {
        // Delete all existing levels for this form
        await tx.formVerifierLevel.deleteMany({
          where: { formId: id },
        });

        // Re-create with new order
        await tx.formVerifierLevel.createMany({
          data: verifiers.map((v: any) => ({
            formId:     id,
            verifierId: v.verifierId,
            level:      v.level,
          })),
        });
      }

      // 3. Save audit log
      await tx.auditLog.create({
        data: {
          action:          LogAction.FORM_UPDATED,
          entity:          "Form",
          entityId:        String(id),
          actorType:       ActorType.Verifier,    // admin lives in Verifier table
          actorVerifierId: session.user.id,
          actorUserId:     null,
          formId:          id,
          diff: {
            before: {
              title:       existingForm.title,
              description: existingForm.description,
              deadline:    existingForm.deadline,
              formStatus:  existingForm.formStatus,
              formFields:  existingForm.formFields,
              verifiers:   existingForm.verifiersList,
            },
            after: {
              title:       title       ?? existingForm.title,
              description: description ?? existingForm.description,
              deadline:    deadline    ?? existingForm.deadline,
              formStatus:  formStatus  ?? existingForm.formStatus,
              formFields:  fields      ?? existingForm.formFields,
              verifiers:   verifiers   ?? existingForm.verifiersList,
            },
          },
          meta: {
            ip:         req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown",
            userAgent:  req.headers.get("user-agent") ?? "unknown",
            adminEmail: session.user.email,
          },
        },
      });

      // 4. Return updated form with verifier levels
      return tx.form.findUnique({
        where: { id },
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
      message: "Form updated successfully.",
      data:    updatedForm,
    }, { status: 200 });

  } catch (error: any) {
    console.error("[PATCH /api/forms/updateForm/:formId]", error);
    return NextResponse.json({
      success: false,
      message: error.message ?? "Internal server error.",
    }, { status: 500 });
  }
}