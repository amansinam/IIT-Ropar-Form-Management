// app/api/submissions/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { prisma } from '@/lib/prisma';
import { ActorType, LogAction, SubmissionStatus } from '../../../../../generated/prisma/enums';


// ─── Auth helpers ─────────────────────────────────────────────────────────────

// GET auth: verifier, admin, OR the student who owns the submission
// Returns { actorId, portal } or null if unauthenticated
async function getSessionActor(): Promise<{
    actorId: string;
    portal: string;
} | null> {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.portal) return null;
    return { actorId: session.user.id, portal: session.user.portal };
}

// POST auth: verifier/admin only — re-confirms existence in Verifier table
async function getAuthorizedVerifierId(): Promise<string | null> {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return null;

    // Block regular users immediately
    if (session.user.portal === 'user') return null;

    // Re-confirm verifier still exists in DB (guards against post-login deletion)
    const verifier = await prisma.verifier.findUnique({
        where: { id: session.user.id },
        select: { id: true },
    });

    return verifier?.id ?? null;
}

// ─── GET /api/submissions/:id ─────────────────────────────────────────────────
// Accessible by: the student who submitted, any verifier in the chain, admin
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: submissionId } = await params;

    // 1. Must be signed in as anyone (user, verifier, admin)
    const actor = await getSessionActor();
    if (!actor) {
        return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    try {
        // 2. Load submission with everything needed
        const submission = await prisma.formSubmissions.findUnique({
            where: { id: submissionId },
            include: {
                user: {
                    select: { id: true, userName: true, email: true },
                },
                form: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        deadline: true,
                        formFields: true,
                        verifiersList: {
                            orderBy: { level: 'asc' },
                            include: {
                                verifier: {
                                    select: { id: true, userName: true, role: true, department: true },
                                },
                            },
                        },
                    },
                },
                verificationActions: {
                    orderBy: { level: 'asc' },
                    include: {
                        verifier: { select: { id: true, userName: true, role: true } },
                    },
                },
            },
        });

        if (!submission) {
            return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
        }

        // 3. Authorization check per portal
        //    - user    → must be the owner of this submission
        //    - verifier → must be in the verifier chain for this form
        //    - admin   → always allowed
        if (actor.portal === 'user') {
            if (submission.userId !== actor.actorId) {
                return NextResponse.json(
                    { error: 'Forbidden: this is not your submission' },
                    { status: 403 }
                );
            }
        } else if (actor.portal === 'verifier') {
            const inChain = submission.form.verifiersList.some(
                (vl) => vl.verifier.id === actor.actorId
            );
            if (!inChain) {
                return NextResponse.json(
                    { error: 'Forbidden: you are not a verifier for this form' },
                    { status: 403 }
                );
            }
        }
        // admin falls through — no extra check needed

        // 4. Build verifierContext (only meaningful for verifier/admin; null for users)
        const verifierLevelEntry =
            actor.portal !== 'user'
                ? submission.form.verifiersList.find((vl) => vl.verifier.id === actor.actorId)
                : undefined;

        const totalLevels = submission.form.verifiersList.length;
        const isCurrentVerifier = verifierLevelEntry?.level === submission.currentLevel;
        const isLastVerifier = verifierLevelEntry?.level === totalLevels;

        // 5. Build workflow timeline
        const workflow = submission.form.verifiersList.map((vl) => {
            const action = submission.verificationActions.find((a) => a.level === vl.level);

            let status: 'Completed' | 'Current' | 'Pending' | 'SentBack';
            if (action) {
                if (action.status === SubmissionStatus.SentBack) {
                    status = 'SentBack';
                } else {
                    status = 'Completed';
                }
            } else if (vl.level === submission.currentLevel && submission.overallStatus !== SubmissionStatus.SentBack) {
                status = 'Current';
            } else {
                status = 'Pending';
            }

            return {
                level: vl.level,
                verifierId: vl.verifier.id,
                verifierName: vl.verifier.userName,
                role: vl.verifier.role,
                department: vl.verifier.department,
                status,
                actionStatus: action?.status ?? null,
                remark: action?.remark ?? null,
                date: action?.actionAt ?? null,
            };
        });

        // 6. Derive display status
        const now = new Date();

        // For display: deadline passed (end of day)
        const deadlineEndOfDay = new Date(submission.form.deadline);
        deadlineEndOfDay.setHours(23, 59, 59, 999);
        const isExpired = deadlineEndOfDay < now;

        // For user portal: can they still submit/edit? No — deadline has passed
        // For verifier/admin: always allowed to act regardless of deadline
        const isFormClosedForUser = isExpired;

        let displayStatus: 'Accepted' | 'Pending' | 'Rejected' | 'Expired' | 'SentBack';
        if (submission.overallStatus === SubmissionStatus.Approved) {
            displayStatus = 'Accepted';
        } else if (submission.overallStatus === SubmissionStatus.Rejected) {
            displayStatus = 'Rejected';
        } else if (submission.overallStatus === SubmissionStatus.SentBack) {
            displayStatus = 'SentBack';
        } else if (isExpired) {
            displayStatus = 'Expired';
        } else {
            displayStatus = 'Pending';
        }

        // 7. Parse formData + formFields into display pairs
        //
        //    formFields (stored in Form.formFields) defines the schema:
        //      [{ name: "studentName", label: "Student Name", type: "text" }, ...]
        //
        //    formData (stored in FormSubmissions.formData) holds the answers:
        //      { "studentName": "John Doe", ... }
        //
        //    Prisma returns Json fields as already-parsed objects in most cases,
        //    but can return a JSON string in edge cases — we handle both safely.

        const rawFormFields = submission.form.formFields;
        const rawFormData = submission.formData;

        const formFields: Array<{ name: string; label: string; type: string }> =
            Array.isArray(rawFormFields)
                ? (rawFormFields as Array<{ name: string; label: string; type: string }>)
                : typeof rawFormFields === 'string'
                    ? JSON.parse(rawFormFields)
                    : [];


        const formData: Record<string, string> =
            rawFormData !== null &&
                typeof rawFormData === 'object' &&
                !Array.isArray(rawFormData)
                ? (rawFormData as Record<string, string>)
                : typeof rawFormData === 'string'
                    ? JSON.parse(rawFormData)
                    : {};


        const fields = formFields.map((f, index) => ({
            label: f.label,
            value: (formData[`field-${index}`] as unknown as { label: string; value: string })?.value ?? '—',
            type: f.type,
        }));

        return NextResponse.json({
            submission: {
                id: submission.id,
                status: displayStatus,
                overallStatus: submission.overallStatus,
                currentLevel: submission.currentLevel,
                totalLevels,
                submissionDate: submission.createdAt,
            },
            student: {
                id: submission.user.id,
                name: submission.user.userName,
                email: submission.user.email,
            },
            form: {
                id: submission.form.id,
                title: submission.form.title,
                description: submission.form.description,
                deadline: submission.form.deadline,
                isExpired,
                isClosedForUser: isFormClosedForUser
            },
            fields,
            workflow,
            // null for regular users — frontend hides action buttons when this is null
            // After — always return a verifierContext object, never null
            verifierContext: {
                verifierId: verifierLevelEntry?.verifier.id ?? null,
                level: verifierLevelEntry?.level ?? null,
                isCurrentVerifier: verifierLevelEntry ? isCurrentVerifier : false,
                isLastVerifier: verifierLevelEntry ? isLastVerifier : false,
                canAct: verifierLevelEntry
                    ? isCurrentVerifier && submission.overallStatus === SubmissionStatus.Pending
                    : false,
                nextVerifier: verifierLevelEntry
                    ? workflow.find(
                        (w) => w.status === 'Pending' && w.level > (verifierLevelEntry.level ?? 0)
                    ) ?? null
                    : null,
            },
        });
    } catch (error) {
        console.error('[SubmissionDetails GET] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: submissionId } = await params;
 
    // 1. Verifier-only auth
    const verifierId = await getAuthorizedVerifierId();
    if (!verifierId) {
        return NextResponse.json(
            { error: 'Unauthenticated or insufficient permissions' },
            { status: 401 }
        );
    }
 
    const body = await req.json() as { action?: string; remark?: string };
    const { action, remark } = body;
 
    if (!action || !['approve', 'reject', 'sendback'].includes(action)) {
        return NextResponse.json(
            { error: 'Invalid action. Must be approve | reject | sendback' },
            { status: 400 }
        );
    }
 
    if ((action === 'reject' || action === 'sendback') && !remark?.trim()) {
        return NextResponse.json(
            { error: 'A remark is required when rejecting or sending back' },
            { status: 400 }
        );
    }
 
    try {
        // 2. Load submission + verifier chain
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
            return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
        }
 
        // 3. Submission must still be actionable
        if (submission.overallStatus !== SubmissionStatus.Pending) {
            return NextResponse.json(
                {
                    error: `Submission is already ${submission.overallStatus.toLowerCase()} and cannot be acted upon`,
                },
                { status: 409 }
            );
        }
 
        // 4. Verifier must be in the chain for this specific form
        const verifierLevelEntry = submission.form.verifiersList.find(
            (vl) => vl.verifierId === verifierId
        );
 
        if (!verifierLevelEntry) {
            return NextResponse.json(
                { error: 'Forbidden: you are not a verifier for this form' },
                { status: 403 }
            );
        }
 
        // 5. Must be their turn
        if (verifierLevelEntry.level !== submission.currentLevel) {
            return NextResponse.json(
                {
                    error: `Not your turn. Current level is ${submission.currentLevel}, your level is ${verifierLevelEntry.level}`,
                },
                { status: 403 }
            );
        }
 
        const totalLevels = submission.form.verifiersList.length;
        const isLastVerifier = verifierLevelEntry.level === totalLevels;
 
        // 6. Apply action + write audit log in a single transaction
        await prisma.$transaction(async (tx) => {
            if (action === 'approve') {
                await tx.verificationAction.upsert({
                    where: {
                        submissionId_level: { submissionId, level: verifierLevelEntry.level },
                    },
                    create: {
                        submissionId,
                        verifierId,
                        level: verifierLevelEntry.level,
                        status: SubmissionStatus.Approved,
                        remark: remark?.trim() || null,
                    },
                    update: {
                        verifierId,
                        status: SubmissionStatus.Approved,
                        remark: remark?.trim() || null,
                    },
                });
 
                await tx.formSubmissions.update({
                    where: { id: submissionId },
                    data: isLastVerifier
                        ? { overallStatus: SubmissionStatus.Approved }
                        : { currentLevel: submission.currentLevel + 1 },
                });
 
                await tx.auditLog.create({
                    data: {
                        action: LogAction.VERIFICATION_APPROVED,
                        entity: 'FormSubmissions',
                        entityId: submissionId,
                        actorType: ActorType.Verifier,
                        actorVerifierId: verifierId,
                        formId: submission.formId,
                        submissionId,
                        meta: {
                            level: verifierLevelEntry.level,
                            isLastVerifier,
                            ...(remark?.trim() ? { remark: remark.trim() } : {}),
                        },
                    },
                });
 
            } else if (action === 'reject') {
                await tx.verificationAction.upsert({
                    where: {
                        submissionId_level: { submissionId, level: verifierLevelEntry.level },
                    },
                    create: {
                        submissionId,
                        verifierId,
                        level: verifierLevelEntry.level,
                        status: SubmissionStatus.Rejected,
                        remark: remark!.trim(),
                    },
                    update: {
                        verifierId,
                        status: SubmissionStatus.Rejected,
                        remark: remark!.trim(),
                    },
                });
 
                await tx.formSubmissions.update({
                    where: { id: submissionId },
                    data: { overallStatus: SubmissionStatus.Rejected },
                });
 
                await tx.auditLog.create({
                    data: {
                        action: LogAction.VERIFICATION_REJECTED,
                        entity: 'FormSubmissions',
                        entityId: submissionId,
                        actorType: ActorType.Verifier,
                        actorVerifierId: verifierId,
                        formId: submission.formId,
                        submissionId,
                        meta: {
                            level: verifierLevelEntry.level,
                            remark: remark!.trim(),
                        },
                    },
                });
 
            } else if (action === 'sendback') {
                const isFirstVerifier = verifierLevelEntry.level === 1;

                if (isFirstVerifier) {
                    // Level-1 sendback → form goes back to the user to edit & resubmit
                    await tx.formSubmissions.update({
                        where: { id: submissionId },
                        data: {
                            overallStatus: SubmissionStatus.SentBack,
                            currentLevel: 1,
                        },
                    });
                } else {
                    // Higher-level sendback → go to previous verifier level
                    await tx.formSubmissions.update({
                        where: { id: submissionId },
                        data: { currentLevel: verifierLevelEntry.level - 1 },
                    });
                }

                await tx.verificationAction.upsert({
                    where: {
                        submissionId_level: { submissionId, level: verifierLevelEntry.level },
                    },
                    create: {
                        submissionId,
                        verifierId,
                        level: verifierLevelEntry.level,
                        status: SubmissionStatus.SentBack,
                        remark: `[SENT BACK] ${remark!.trim()}`,
                    },
                    update: {
                        status: SubmissionStatus.SentBack,
                        remark: `[SENT BACK] ${remark!.trim()}`,
                    },
                });

                await tx.auditLog.create({
                    data: {
                        action: LogAction.VERIFICATION_REMARKED,
                        entity: 'FormSubmissions',
                        entityId: submissionId,
                        actorType: ActorType.Verifier,
                        actorVerifierId: verifierId,
                        formId: submission.formId,
                        submissionId,
                        meta: {
                            level: verifierLevelEntry.level,
                            isFirstVerifier,
                            sentBackToUser: isFirstVerifier,
                            remark: remark!.trim(),
                        },
                    },
                });
            }
        });
 
        return NextResponse.json({ success: true, action });
    } catch (error) {
        console.error('[SubmissionDetails POST] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}