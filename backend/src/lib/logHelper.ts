

// ─── Types ───────────────────────────────────────────────────────────────────

import { ActorType, LogAction } from "../../generated/prisma/enums";
import { prisma } from "./prisma";

interface GetLogsOptions {
  // Pagination
  page?: number;
  limit?: number;

  // Filters
  action?: LogAction;
  actorType?: ActorType;
  actorUserId?: string;
  actorVerifierId?: string;
  entity?: string;
  entityId?: string;
  formId?: number;
  submissionId?: string;

  // Date range
  from?: Date;
  to?: Date;

  // Sorting
  sortOrder?: "asc" | "desc";
}

// ─── Master log fetcher ───────────────────────────────────────────────────────

export async function getAllLogs(options: GetLogsOptions = {}) {
  const {
    page = 1,
    limit = 20,
    action,
    actorType,
    actorUserId,
    actorVerifierId,
    entity,
    entityId,
    formId,
    submissionId,
    from,
    to,
    sortOrder = "desc",
  } = options;

  const skip = (page - 1) * limit;

  const where = {
    ...(action && { action }),
    ...(actorType && { actorType }),
    ...(actorUserId && { actorUserId }),
    ...(actorVerifierId && { actorVerifierId }),
    ...(entity && { entity }),
    ...(entityId && { entityId }),
    ...(formId && { formId }),
    ...(submissionId && { submissionId }),
    ...((from || to) && {
      createdAt: {
        ...(from && { gte: from }),
        ...(to && { lte: to }),
      },
    }),
  };

  const [logs, total] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: sortOrder },
      include: {
        actorUser: {
          select: { id: true, userName: true, email: true },
        },
        actorVerifier: {
          select: { id: true, userName: true, email: true, role: true },
        },
        form: {
          select: { id: true, title: true },
        },
        submission: {
          select: { id: true, overallStatus: true, currentLevel: true },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    data: logs,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  };
}

// ─── Scoped helpers ───────────────────────────────────────────────────────────

/** All logs for a specific form */
export async function getLogsByForm(formId: number, options: GetLogsOptions = {}) {
  return getAllLogs({ ...options, formId });
}

/** All logs for a specific submission */
export async function getLogsBySubmission(submissionId: string, options: GetLogsOptions = {}) {
  return getAllLogs({ ...options, submissionId });
}

/** All logs triggered by a User */
export async function getLogsByUser(actorUserId: string, options: GetLogsOptions = {}) {
  return getAllLogs({ ...options, actorUserId, actorType: ActorType.User });
}

/** All logs triggered by a Verifier */
export async function getLogsByVerifier(actorVerifierId: string, options: GetLogsOptions = {}) {
  return getAllLogs({ ...options, actorVerifierId, actorType: ActorType.Verifier });
}

/** All logs for a specific entity type (e.g. "Form", "FormSubmissions") */
export async function getLogsByEntity(entity: string, entityId?: string, options: GetLogsOptions = {}) {
  return getAllLogs({ ...options, entity, ...(entityId && { entityId }) });
}

/** All logs within a date range */
export async function getLogsByDateRange(from: Date, to: Date, options: GetLogsOptions = {}) {
  return getAllLogs({ ...options, from, to });
}

/** Logs for a specific action type */
export async function getLogsByAction(action: LogAction, options: GetLogsOptions = {}) {
  return getAllLogs({ ...options, action });
}