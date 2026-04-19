import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft, FileText, Mail, ShieldCheck, User,
  Clock, CheckCircle2, XCircle, AlertTriangle, ChevronRight,
} from 'lucide-react';
import { cookies, headers } from 'next/headers';

// ── Types ──────────────────────────────────────────────────────────────────────

interface WorkflowStep {
  level: number;
  verifierId: string;
  verifierName: string;
  role: string;
  department: string;
  status: 'Completed' | 'Current' | 'Pending';
  actionStatus: string | null;
  remark: string | null;
  date: string | null;
}

interface Field {
  label: string;
  value: string;
  type: string;
}

interface SubmissionDetailResponse {
  submission: {
    id: string;
    status: 'Accepted' | 'Pending' | 'Rejected' | 'Expired';
    overallStatus: string;
    currentLevel: number;
    totalLevels: number;
    submissionDate: string;
  };
  student: {
    id: string;
    name: string;
    email: string;
  };
  form: {
    id: number;
    title: string;
    description: string;
    deadline: string;
    isExpired: boolean;
    isClosedForUser: boolean;
  };
  fields: Field[];
  workflow: WorkflowStep[];
  verifierContext: {
    verifierId: string | null;
    level: number | null;
    isCurrentVerifier: boolean;
    isLastVerifier: boolean;
    canAct: boolean;
    nextVerifier: WorkflowStep | null;
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const statusStyles: Record<string, string> = {
  Accepted: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Pending:  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  Expired:  'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const statusIcon: Record<string, React.ReactNode> = {
  Accepted: <CheckCircle2 size={16} />,
  Pending:  <Clock size={16} />,
  Rejected: <XCircle size={16} />,
  Expired:  <AlertTriangle size={16} />,
};

const workflowDot: Record<WorkflowStep['status'], string> = {
  Completed: 'bg-green-500',
  Current:   'bg-amber-400 ring-2 ring-amber-200 dark:ring-amber-900',
  Pending:   'bg-gray-200 dark:bg-gray-700',
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

// ── Data fetch (server-side, cookies forwarded for session) ────────────────────

async function getSubmissionDetails(
  submissionId: string,
): Promise<SubmissionDetailResponse | null> {
  try {
    const cookieStore = await cookies();
    const headerStore  = await headers();

    const res = await fetch(
      `${process.env.NEXTAUTH_URL}/api/submissions/${submissionId}`,
      {
        cache: 'no-store',
        headers: {
          Cookie: cookieStore.toString(),
          'x-forwarded-for': headerStore.get('x-forwarded-for') ?? '',
        },
      },
    );

    if (!res.ok) return null;
    return res.json() as Promise<SubmissionDetailResponse>;
  } catch {
    return null;
  }
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function SubmissionDetailsPage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const { submissionId } = await params;
  const data = await getSubmissionDetails(submissionId);

  if (!data) notFound();

  const { submission, student, form, fields, workflow } = data;

  return (
    <div className="space-y-6" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <Link
            href="/forms/all"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#1E3A8A] dark:text-blue-400 mb-3"
          >
            <ArrowLeft size={16} />
            Back to all submitted forms
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {student.name}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {form.title} — submission details
          </p>
        </div>

        <span
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold ${statusStyles[submission.status]}`}
        >
          {statusIcon[submission.status]}
          {submission.status}
        </span>
      </div>

      {/* ── Expired banner ── */}
      {form.isExpired && submission.status !== 'Accepted' && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl text-sm text-amber-700 dark:text-amber-300">
          <AlertTriangle size={16} className="shrink-0" />
          The deadline for this form has passed ({formatDate(form.deadline)}).
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left column: summary ── */}
        <div className="lg:col-span-1 space-y-6">

          {/* Summary card */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Submission Summary
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                <User size={16} className="text-[#1E3A8A] shrink-0" />
                <span>{student.name}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                <Mail size={16} className="text-[#1E3A8A] shrink-0" />
                <span className="break-all">{student.email}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                <FileText size={16} className="text-[#1E3A8A] shrink-0" />
                <span>{form.title}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>
                <strong className="text-gray-900 dark:text-white">Submitted:</strong>{' '}
                {formatDate(submission.submissionDate)}
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">Deadline:</strong>{' '}
                {formatDate(form.deadline)}
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">Verifier Level:</strong>{' '}
                {submission.currentLevel} / {submission.totalLevels}
              </p>
            </div>
          </div>

          {/* Workflow timeline card */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">
              Verification Workflow
            </h2>

            <ol className="relative space-y-0">
              {workflow.map((step, idx) => (
                <li key={step.level} className="flex gap-4">
                  {/* Spine */}
                  <div className="flex flex-col items-center">
                    <span
                      className={`w-3 h-3 rounded-full mt-1 shrink-0 ${workflowDot[step.status]}`}
                    />
                    {idx < workflow.length - 1 && (
                      <span className="w-px flex-1 bg-gray-100 dark:bg-gray-800 my-1" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="pb-5">
                    <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight">
                      {step.verifierName}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {step.role}
                      {step.department ? ` · ${step.department}` : ''}
                    </p>

                    {step.status === 'Completed' && (
                      <span className="inline-flex items-center gap-1 mt-1.5 text-xs font-medium text-green-600 dark:text-green-400">
                        <CheckCircle2 size={11} />
                        {step.actionStatus === 'Approved' ? 'Approved' : step.actionStatus}
                        {step.date ? ` · ${formatDate(step.date)}` : ''}
                      </span>
                    )}

                    {step.status === 'Current' && (
                      <span className="inline-flex items-center gap-1 mt-1.5 text-xs font-medium text-amber-500">
                        <Clock size={11} /> Awaiting action
                      </span>
                    )}

                    {step.status === 'Pending' && (
                      <span className="inline-flex items-center gap-1 mt-1.5 text-xs text-gray-400">
                        <ChevronRight size={11} /> Not yet reached
                      </span>
                    )}

                    {step.remark && (
                      <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 italic">
                        "{step.remark}"
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* ── Right column: form responses ── */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Form Responses
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {fields.length} field{fields.length !== 1 ? 's' : ''} submitted
              </p>
            </div>
            <Link
              href={`/forms/available/${form.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-[#1E3A8A] dark:bg-blue-900/30 dark:text-blue-300 text-sm font-semibold"
            >
              Open Form Dashboard
            </Link>
          </div>

          {fields.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-12">
              No fields found for this submission.
            </p>
          ) : (
            <div className="space-y-4">
              {fields.map((field) => (
                <div
                  key={field.label}
                  className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/40 p-4"
                >
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                    {field.label}
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {field.value || '—'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}