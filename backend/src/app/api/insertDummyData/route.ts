import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function generateFieldValue(field: any) {
  switch (field.type) {
    case "text":
      return `Sample ${field.label}`;
    case "number":
      return Math.floor(Math.random() * 100);
    case "checkbox":
      return true;
    case "select":
      return field.options?.[0] ?? "Option 1";
    default:
      return "Test Value";
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. FETCH FORMS WITH VERIFIER LEVELS
    const forms = await prisma.form.findMany({
      where: { formStatus: true },
      include: {
        verifiersList: {
          orderBy: { level: "asc" },
          select: { level: true },
        },
      },
    });

    if (!forms.length) {
      return NextResponse.json({
        success: false,
        message: "No forms available",
      });
    }

    const submissionsToCreate: any[] = [];

    // 2. CREATE 50 USERS
    for (let i = 0; i < 50; i++) {
      const email = `seeduser${i}@example.com`;

      const user = await prisma.user.upsert({
        where: { email },
        update: { userName: `Seed User ${i}` },
        create: {
          userName: `Seed User ${i}`,
          email,
        },
      });

      // 3. RANDOM FORM COUNT (1 → total forms)
      const count = Math.floor(Math.random() * forms.length) + 1;

      const shuffled = [...forms].sort(() => 0.5 - Math.random());
      const selectedForms = shuffled.slice(0, count);

      for (const form of selectedForms) {
        const formFields = form.formFields as any[];

        // 4. GENERATE VALID FIELD DATA (IMPORTANT)
        const generatedFields: Record<string, any> = {};

        formFields.forEach((field, index) => {
          generatedFields[field.id ?? `field-${index}`] = {
            label: field.label,
            value: generateFieldValue(field),
          };
        });

        submissionsToCreate.push({
          userId: user.id,
          formId: form.id,
          formData: generatedFields,
          currentLevel: form.verifiersList[0]?.level ?? 1,
          overallStatus: "Pending",
        });
      }
    }

    // 5. BULK INSERT
    await prisma.formSubmissions.createMany({
      data: submissionsToCreate,
    });

    return NextResponse.json({
      success: true,
      message: "Seeded 50 users with realistic submissions",
      users: 50,
      submissions: submissionsToCreate.length,
    });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({
      success: false,
      message: error.message,
    });
  }
}