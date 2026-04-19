// app/api/verifier/activity/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { prisma } from '@/lib/prisma';
import { LogAction } from '../../../../../generated/prisma/enums';

// ─── Auth helper ──────────────────────────────────────────────────────────────
async function getAuthorizedVerifier(): Promise<{ id: string } | null> {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.portal) return null;
    if (session.user.portal === 'user') return null;

    const verifier = await prisma.verifier.findUnique({
        where: { id: session.user.id },
        select: { id: true },
    });

    return verifier ? { id: session.user.id } : null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Map LogAction → activity type used by the frontend
function deriveType(action: LogAction): 'approved' | 'rejected' | 'submitted' | 'sent-back' | 'other' {
    switch (action) {
        case LogAction.VERIFICATION_APPROVED: return 'approved';
        case LogAction.VERIFICATION_REJECTED: return 'rejected';
        case LogAction.SUBMISSION_CREATED:    return 'submitted';
        case LogAction.VERIFICATION_REMARKED: return 'sent-back';
        default:                              return 'other';
    }
}

// Map type → icon key expected by the frontend iconMap
function deriveIcon(type: string): string {
    switch (type) {
        case 'approved':  return 'check';
        case 'rejected':  return 'x';
        case 'submitted': return 'file';
        case 'sent-back': return 'refresh';
        default:          return 'clock';
    }
}

// Build a human-readable message from the log entry
function buildMessage(
    action: LogAction,
    actorName: string,
    entityLabel: string,
    meta: Record<string, string> | null
): string {
    const remark = meta?.remark ? ` — "${meta.remark}"` : '';
    switch (action) {
        case LogAction.VERIFICATION_APPROVED:
            return `${actorName} approved submission for ${entityLabel}${remark}`;
        case LogAction.VERIFICATION_REJECTED:
            return `${actorName} rejected submission for ${entityLabel}${remark}`;
        case LogAction.VERIFICATION_REMARKED:
            return `${actorName} sent back submission for ${entityLabel}${remark}`;
        case LogAction.SUBMISSION_CREATED:
            return `New submission received for ${entityLabel}`;
        case LogAction.SUBMISSION_UPDATED:
            return `Submission updated for ${entityLabel}`;
        case LogAction.SUBMISSION_DELETED:
            return `Submission deleted for ${entityLabel}`;
        case LogAction.FORM_CREATED:
            return `Form "${entityLabel}" was created`;
        case LogAction.FORM_UPDATED:
            return `Form "${entityLabel}" was updated`;
        case LogAction.FORM_STATUS_TOGGLED:
            return `Form "${entityLabel}" status was toggled`;
        default:
            return `${actorName} performed action on ${entityLabel}`;
    }
}

// ─── GET /api/verifier/activity ───────────────────────────────────────────────
// Returns recent audit log entries scoped to this verifier:
//   - verification actions they personally performed
//   - submissions on forms they are assigned to
// Query params:
//   limit  → number of entries (default 50, max 100)
//   cursor → createdAt ISO string for pagination (older than this)
export async function GET(req: NextRequest) {
    const actor = await getAuthorizedVerifier();
    if (!actor) {
        return NextResponse.json({ error: 'Unauthenticated or insufficient permissions' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get('limit') ?? 50), 100);
    const cursor = searchParams.get('cursor');

    try {
        // 1. Forms this verifier is assigned to
        const assignedForms = await prisma.formVerifierLevel.findMany({
            where: { verifierId: actor.id },
            select: { formId: true },
        });
        const assignedFormIds = assignedForms.map((f) => f.formId);

        // 2. Fetch audit logs scoped to this verifier
        const logs = await prisma.auditLog.findMany({
            where: {
                OR: [
                    // Actions this verifier personally performed
                    { actorVerifierId: actor.id },
                    // Submission-related events on forms they're assigned to
                    {
                        formId: assignedFormIds.length > 0
                            ? { in: assignedFormIds }
                            : undefined,
                        action: {
                            in: [
                                LogAction.SUBMISSION_CREATED,
                                LogAction.SUBMISSION_UPDATED,
                                LogAction.VERIFICATION_APPROVED,
                                LogAction.VERIFICATION_REJECTED,
                                LogAction.VERIFICATION_REMARKED,
                            ],
                        },
                    },
                ],
                ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
            },
            include: {
                actorVerifier: { select: { id: true, userName: true, role: true } },
                actorUser:     { select: { id: true, userName: true } },
                form:          { select: { id: true, title: true } },
                submission:    { select: { id: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });

        // 3. Map to frontend shape
        const activity = logs.map((log) => {
            const actorName =
                log.actorVerifier?.userName ??
                log.actorUser?.userName ??
                'System';

            const entityLabel = log.form?.title ?? log.entity ?? 'Unknown';

            const meta =
                log.meta !== null && typeof log.meta === 'object' && !Array.isArray(log.meta)
                    ? (log.meta as Record<string, string>)
                    : null;

            const type = deriveType(log.action);
            const icon = deriveIcon(type);

            return {
                id: log.id,
                type,
                icon,
                message: buildMessage(log.action, actorName, entityLabel, meta),
                action: log.action,
                actor: {
                    id: log.actorVerifier?.id ?? log.actorUser?.id ?? null,
                    name: actorName,
                    role: log.actorVerifier?.role ?? null,
                },
                formId: log.form?.id ?? null,
                formTitle: log.form?.title ?? null,
                submissionId: log.submission?.id ?? null,
                time: log.createdAt,
            };
        });

        // 4. Stats — count from all time for this verifier (not just this page)
        const [totalActions, approvals, rejections, sentBacks] = await Promise.all([
            prisma.auditLog.count({
                where: { actorVerifierId: actor.id },
            }),
            prisma.auditLog.count({
                where: { actorVerifierId: actor.id, action: LogAction.VERIFICATION_APPROVED },
            }),
            prisma.auditLog.count({
                where: { actorVerifierId: actor.id, action: LogAction.VERIFICATION_REJECTED },
            }),
            prisma.auditLog.count({
                where: { actorVerifierId: actor.id, action: LogAction.VERIFICATION_REMARKED },
            }),
        ]);

        // 5. Next cursor for pagination
        const nextCursor =
            logs.length === limit
                ? logs[logs.length - 1].createdAt.toISOString()
                : null;

        return NextResponse.json({
            activity,
            stats: { totalActions, approvals, rejections, sentBacks },
            nextCursor,
        });
    } catch (error) {
        console.error('[Activity GET] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}