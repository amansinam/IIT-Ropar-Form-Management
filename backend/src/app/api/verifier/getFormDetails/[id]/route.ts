// app/api/forms/[id]/dashboard/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { SubmissionStatus } from '../../../../../../generated/prisma/enums';
import { prisma } from '@/lib/prisma';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const formId = parseInt(id, 10);

    if (isNaN(formId)) {
        return NextResponse.json({ error: 'Invalid form ID' }, { status: 400 });
    }

    try {
        // ── 1. Fetch form with verifier chain ──────────────────────────────────
        const form = await prisma.form.findUnique({
            where: { id: formId },
            include: {
                verifiersList: {
                    orderBy: { level: 'asc' },
                    include: {
                        verifier: {
                            select: { id: true, userName: true, role: true, department: true },
                        },
                    },
                },
            },
        });

        if (!form) {
            return NextResponse.json({ error: 'Form not found' }, { status: 404 });
        }

        // ── 2. Fetch all submissions for this form ─────────────────────────────
        const submissions = await prisma.formSubmissions.findMany({
            where: { formId },
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: { id: true, userName: true, email: true },
                },
                verificationActions: {
                    orderBy: { level: 'asc' },
                    include: {
                        verifier: { select: { userName: true, role: true } },
                    },
                },
            },
        });

        // ── 3. Compute stats ───────────────────────────────────────────────────
        const now = new Date();
        const isExpired = form.deadline < now;

        let accepted = 0;
        let pending = 0;
        let rejected = 0;
        let expired = 0;

        const mappedSubmissions = submissions.map((sub: any) => {
            // Resolve current verifier name from the chain using currentLevel
            const currentVerifierEntry = form.verifiersList.find(
                (vl: any) => vl.level === sub.currentLevel
            );
            const currentVerifier = currentVerifierEntry?.verifier?.userName ?? 'N/A';

            // Derive display status
            let displayStatus: 'Accepted' | 'Pending' | 'Rejected' | 'Expired';

            if (sub.overallStatus === SubmissionStatus.Approved) {
                displayStatus = 'Accepted';
                accepted++;
            } else if (sub.overallStatus === SubmissionStatus.Rejected) {
                displayStatus = 'Rejected';
                rejected++;
            } else if (isExpired) {
                displayStatus = 'Expired';
                expired++;
            } else {
                displayStatus = 'Pending';
                pending++;
            }

            return {
                id: sub.id,
                studentName: sub.user.userName,
                email: sub.user.email,
                submissionDate: sub.createdAt,
                status: displayStatus,
                currentLevel: sub.currentLevel,
                currentVerifier,
                overallStatus: sub.overallStatus,
            };
        });

        // ── 4. Build response ──────────────────────────────────────────────────
        return NextResponse.json({
            form: {
                id: form.id,
                title: form.title,
                description: form.description,
                deadline: form.deadline,
                formStatus: form.formStatus,
                isExpired,
            },
            stats: {
                total: submissions.length,
                accepted,
                pending,
                rejected,
                expired,
            },
            submissions: mappedSubmissions,
        });
    } catch (error) {
        console.error('[FormDashboard] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}