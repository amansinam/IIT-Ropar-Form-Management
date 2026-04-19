// app/api/submissions/resubmit/route.ts
// Allows a user to edit and resubmit a form that was sent back to them.

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { prisma } from '@/lib/prisma';
import { ActorType, LogAction, SubmissionStatus } from '../../../../../generated/prisma/enums';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

interface FieldValue {
    label: string;
    value: string | boolean;
}

async function saveFile(file: File, submissionId: string): Promise<string> {
    const uploadDir = join(process.cwd(), 'public', 'uploads', submissionId);
    if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
    }
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    const filepath = join(uploadDir, filename);
    await writeFile(filepath, buffer);
    return `/uploads/${submissionId}/${filename}`;
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
        }

        const userId = session.user.id;

        // Only regular users can resubmit
        const userExists = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true },
        });

        if (!userExists) {
            return NextResponse.json({ success: false, message: 'User not found.' }, { status: 401 });
        }

        const formDataRaw = await req.formData();
        const submissionIdRaw = formDataRaw.get('submissionId');
        const fieldsRaw = formDataRaw.get('fields');

        if (!submissionIdRaw || !fieldsRaw) {
            return NextResponse.json({ success: false, message: 'submissionId and fields are required.' }, { status: 400 });
        }

        const submissionId = submissionIdRaw.toString();

        // Load the submission — must be owned by this user and in SentBack state
        const submission = await prisma.formSubmissions.findUnique({
            where: { id: submissionId },
            include: {
                form: {
                    include: {
                        verifiersList: { orderBy: { level: 'asc' } },
                    },
                },
            },
        });

        if (!submission) {
            return NextResponse.json({ success: false, message: 'Submission not found.' }, { status: 404 });
        }

        if (submission.userId !== userId) {
            return NextResponse.json({ success: false, message: 'Forbidden: this is not your submission.' }, { status: 403 });
        }

        if (submission.overallStatus !== SubmissionStatus.SentBack) {
            return NextResponse.json({
                success: false,
                message: `This submission cannot be resubmitted (current status: ${submission.overallStatus}).`,
            }, { status: 409 });
        }

        // Check deadline
        if (new Date() > new Date(submission.form.deadline)) {
            return NextResponse.json({ success: false, message: 'The deadline for this form has passed.' }, { status: 403 });
        }

        // Parse new fields
        let fields: Record<string, FieldValue>;
        try {
            fields = JSON.parse(fieldsRaw.toString());
        } catch {
            return NextResponse.json({ success: false, message: 'Invalid fields format.' }, { status: 400 });
        }

        // Handle file uploads
        const fileUrls: Record<string, string> = {};
        for (const [key, value] of formDataRaw.entries()) {
            if (key.startsWith('file_') && value instanceof File && value.size > 0) {
                const fieldId = key.replace('file_', '');
                fileUrls[fieldId] = await saveFile(value, submissionId);
            }
        }

        // Handle signature
        const signatureRaw = formDataRaw.get('signature');
        let signatureUrl: string | null = null;
        if (signatureRaw instanceof File && signatureRaw.size > 0) {
            signatureUrl = await saveFile(signatureRaw, submissionId);
        }

        // Merge file URLs
        const enrichedFields: Record<string, FieldValue> = { ...fields };
        for (const [fieldId, url] of Object.entries(fileUrls)) {
            enrichedFields[fieldId] = { label: fieldId, value: url };
        }
        if (signatureUrl) {
            enrichedFields['__signature__'] = { label: 'Signature', value: signatureUrl };
        }

        // Delete all prior verification actions so the chain restarts fresh
        await prisma.$transaction(async (tx) => {
            await tx.verificationAction.deleteMany({ where: { submissionId } });

            await tx.formSubmissions.update({
                where: { id: submissionId },
                data: {
                    formData: enrichedFields as any,
                    overallStatus: SubmissionStatus.Pending,
                    currentLevel: submission.form.verifiersList[0]?.level ?? 1,
                    updatedAt: new Date(),
                },
            });

            await tx.auditLog.create({
                data: {
                    action: LogAction.SUBMISSION_RESUBMITTED,
                    entity: 'FormSubmissions',
                    entityId: submissionId,
                    actorType: ActorType.User,
                    actorUserId: userId,
                    formId: submission.formId,
                    submissionId,
                    meta: { resubmittedAt: new Date().toISOString() },
                },
            });
        });

        return NextResponse.json({
            success: true,
            message: 'Form resubmitted successfully.',
            data: { submissionId },
        }, { status: 200 });

    } catch (error: any) {
        console.error('[POST /api/submissions/resubmit]', error);
        return NextResponse.json({ success: false, message: error.message ?? 'Internal server error.' }, { status: 500 });
    }
}
