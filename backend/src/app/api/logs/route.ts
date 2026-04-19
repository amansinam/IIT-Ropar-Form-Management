// app/api/logs/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getAllLogs } from "@/lib/logHelper"
import { ActorType, LogAction } from "../../../../generated/prisma/enums";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;

    // ── Pagination ────────────────────────────────────────
    const page  = parseInt(searchParams.get("page")  ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");

    // ── Enum filters (validated) ──────────────────────────
    const actionParam    = searchParams.get("action");
    const actorTypeParam = searchParams.get("actorType");

    const action    = actionParam    && actionParam    in LogAction  ? (actionParam    as LogAction)  : undefined;
    const actorType = actorTypeParam && actorTypeParam in ActorType  ? (actorTypeParam as ActorType)  : undefined;

    // ── String filters ────────────────────────────────────
    const actorUserId     = searchParams.get("actorUserId")     ?? undefined;
    const actorVerifierId = searchParams.get("actorVerifierId") ?? undefined;
    const entity          = searchParams.get("entity")          ?? undefined;
    const entityId        = searchParams.get("entityId")        ?? undefined;
    const submissionId    = searchParams.get("submissionId")    ?? undefined;

    // ── Numeric filters ───────────────────────────────────
    const formIdParam = searchParams.get("formId");
    const formId      = formIdParam ? parseInt(formIdParam) : undefined;

    // ── Date range ────────────────────────────────────────
    const fromParam = searchParams.get("from");
    const toParam   = searchParams.get("to");
    const from      = fromParam ? new Date(fromParam) : undefined;
    const to        = toParam   ? new Date(toParam)   : undefined;

    // ── Validate dates ────────────────────────────────────
    if (from && isNaN(from.getTime())) {
      return NextResponse.json({ error: "Invalid 'from' date format" }, { status: 400 });
    }
    if (to && isNaN(to.getTime())) {
      return NextResponse.json({ error: "Invalid 'to' date format" }, { status: 400 });
    }
    if (from && to && from > to) {
      return NextResponse.json({ error: "'from' date must be before 'to' date" }, { status: 400 });
    }

    // ── Validate pagination ───────────────────────────────
    if (isNaN(page) || page < 1) {
      return NextResponse.json({ error: "Invalid 'page' value" }, { status: 400 });
    }
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json({ error: "'limit' must be between 1 and 100" }, { status: 400 });
    }

    // ── Sort ──────────────────────────────────────────────
    const sortOrderParam = searchParams.get("sortOrder");
    const sortOrder      = sortOrderParam === "asc" ? "asc" : "desc";

    // ── Fetch ─────────────────────────────────────────────
    const result = await getAllLogs({
      page,
      limit,
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
      sortOrder,
    });

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error("[GET /api/logs] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}