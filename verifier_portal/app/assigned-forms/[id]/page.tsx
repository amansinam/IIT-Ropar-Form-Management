'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import {
  CheckCircle,
  XCircle,
  Clock,
  FileStack,
  AlertTriangle,
  Eye,
  Download,
  ArrowRight,
  Loader2,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type SubmissionStatus = 'Accepted' | 'Pending' | 'Rejected' | 'Expired';

interface Submission {
  id: string;
  studentName: string;
  email: string;
  submissionDate: string;
  status: SubmissionStatus;
  currentLevel: number;
  currentVerifier: string;
  overallStatus: string;
}

interface FormMeta {
  id: number;
  title: string;
  description: string;
  deadline: string;
  formStatus: boolean;
  isExpired: boolean;
}

interface Stats {
  total: number;
  accepted: number;
  pending: number;
  rejected: number;
  expired: number;
}

interface DashboardData {
  form: FormMeta;
  stats: Stats;
  submissions: Submission[];
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FormDashboardPage() {
  const { id } = useParams<{ id: string }>();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/verifier/getFormDetails/${id}`);

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to fetch dashboard data');
        }

        const json: DashboardData = await res.json();
        setData(json);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [id]);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--text-muted)' }} />
          <span className="ml-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            Loading dashboard...
          </span>
        </div>
      </DashboardLayout>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <AlertTriangle className="w-8 h-8 text-red-400" />
          <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
            {error ?? 'No data found'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-outline text-sm"
          >
            Retry
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const { form, stats, submissions } = data;

  // ── Stat card config ───────────────────────────────────────────────────────
  const statCards = [
    { label: 'Total', value: stats.total, icon: FileStack, color: '#3B82F6', bg: '#EFF6FF' },
    { label: 'Accepted', value: stats.accepted, icon: CheckCircle, color: '#22C55E', bg: '#F0FDF4' },
    { label: 'Pending', value: stats.pending, icon: Clock, color: '#F59E0B', bg: '#FFFBEB' },
    { label: 'Rejected', value: stats.rejected, icon: XCircle, color: '#EF4444', bg: '#FFF5F5' },
    { label: 'Expired', value: stats.expired, icon: AlertTriangle, color: '#94A3B8', bg: '#F8FAFC' },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/assigned-forms"
              className="text-sm"
              style={{ color: 'var(--text-muted)', textDecoration: 'none' }}
            >
              Assigned Forms
            </Link>
            <span style={{ color: 'var(--text-muted)' }}>/</span>
            <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
              {form.title}
            </span>
          </div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
            {form.title}
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {form.description} · Deadline:{' '}
            {new Date(form.deadline).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
            {form.isExpired && (
              <span className="ml-2 text-xs font-semibold text-red-400">(Expired)</span>
            )}
          </p>
        </div>

        <div className="export-group">
          <button className="btn-outline">
            <Download className="w-4 h-4 text-green-500" /> Export CSV
          </button>
          <button className="btn-outline">
            <Download className="w-4 h-4 text-red-400" /> Export PDF
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="stat-card cursor-default"
            onClick={() =>
              label !== 'Total'
                ? (window.location.href = `/all-submissions?form=${encodeURIComponent(form.title)}&status=${label}`)
                : null
            }
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ background: bg }}
            >
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div className="text-3xl font-bold mb-1" style={{ color: 'var(--text)' }}>
              {value}
            </div>
            <div className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Submissions Table */}
      <div className="content-card">
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <div>
            <h3 className="font-bold text-base" style={{ color: 'var(--text)' }}>
              Submissions for this Form
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Filtered by: {form.title}
            </p>
          </div>
          <Link
            href={`/all-submissions?form=${encodeURIComponent(form.title)}`}
            className="flex items-center gap-1.5 text-sm font-semibold"
            style={{ color: '#3B82F6', textDecoration: 'none' }}
          >
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Submission Date</th>
                <th>Status</th>
                <th>Current Verifier</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {submissions.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-8"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    No submissions found for this form.
                  </td>
                </tr>
              ) : (
                submissions.map((s) => (
                  <tr key={s.id}>
                    {/* Student Name + Avatar */}
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                          style={{
                            background: `hsl(${s.studentName.charCodeAt(0) * 7},60%,50%)`,
                          }}
                        >
                          {s.studentName
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </div>
                        <div>
                          <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                            {s.studentName}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {s.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Submission Date */}
                    <td className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {new Date(s.submissionDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Status Badge */}
                    <td>
                      <span className={`badge badge-${s.status.toLowerCase()}`}>
                        {s.status}
                      </span>
                    </td>

                    {/* Current Verifier */}
                    <td className="text-sm" style={{ color: 'var(--text)' }}>
                      {s.currentVerifier}
                    </td>

                    {/* Actions */}
                    <td>
                      <Link
                        href={`/form-details/${s.id}`}
                        className="flex items-center gap-1.5 text-sm font-semibold"
                        style={{ color: '#3B82F6', textDecoration: 'none' }}
                      >
                        <Eye className="w-3.5 h-3.5" /> View Details
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}