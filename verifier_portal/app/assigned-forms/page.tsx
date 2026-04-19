'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useRouter } from 'next/navigation';
import {
  FileText, Download, ChevronRight, BarChart2,
  CheckCircle, Clock, XCircle, FileStack,
  Loader2, AlertCircle, RefreshCw,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface AssignedForm {
  id: number;
  formName: string;
  description: string;
  deadline: string;
  createdAt: string;
  status: 'Active' | 'Closed';
  level: number;
  totalSubmissions: number;
  pending: number;
  approved: number;   // ✅ matches schema enum: Approved (not Accepted)
  rejected: number;
  awaitingReview: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(dateStr: string, opts?: Intl.DateTimeFormatOptions) {
  return new Date(dateStr).toLocaleDateString('en-IN', opts ?? {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function completionPct(form: AssignedForm) {
  if (form.totalSubmissions === 0) return 0;
  return Math.round((form.approved / form.totalSubmissions) * 100);
}

function exportCSV(forms: AssignedForm[]) {
  const rows = [
    'Form Name,Level,Total,Pending,Approved,Rejected,Awaiting Review,Status,Deadline',
    ...forms.map((f) =>
      `"${f.formName}",${f.level},${f.totalSubmissions},${f.pending},${f.approved},${f.rejected},${f.awaitingReview},${f.status},${formatDate(f.deadline)}`
    ),
  ].join('\n');
  const blob = new Blob([rows], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'assigned-forms.csv'; a.click();
  URL.revokeObjectURL(url);
}

// ── Stat mini-cell ────────────────────────────────────────────────────────────
function StatCell({
  label, val, color, Icon,
}: {
  label: string; val: number; color: string; Icon: React.ElementType;
}) {
  return (
    <div className="text-center">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center mx-auto mb-1"
        style={{ background: `${color}18` }}>
        <Icon className="w-3.5 h-3.5" style={{ color }} />
      </div>
      <div className="text-lg font-bold leading-none" style={{ color }}>{val}</div>
      <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function AssignedFormsPage() {
  const router = useRouter();
  const [forms, setForms] = useState<AssignedForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchForms = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/verifier/getAssignedForms');
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? `Error ${res.status}`);
      setForms(data.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchForms(); }, []);

  // ── Summary counts ────────────────────────────────────────────────
  const totalForms       = forms.length;
  const activeForms      = forms.filter((f) => f.status === 'Active').length;
  const totalAwaiting    = forms.reduce((s, f) => s + f.awaitingReview, 0);
  const totalSubmissions = forms.reduce((s, f) => s + f.totalSubmissions, 0);

  // ── Loading ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#3B82F6' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading assigned forms…</p>
        </div>
      </DashboardLayout>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────
  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <AlertCircle className="w-10 h-10 text-red-400" />
          <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{error}</p>
          <button onClick={fetchForms} className="btn-outline flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Assigned Forms</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Forms assigned to you for verification
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportCSV(forms)} className="btn-outline flex items-center gap-2">
            <Download className="w-4 h-4 text-green-500" /> Export CSV
          </button>
          <button onClick={fetchForms} className="btn-outline flex items-center gap-2">
            <RefreshCw className="w-4 h-4" style={{ color: 'var(--text-muted)' }} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Summary strip ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Forms',       val: totalForms,       color: '#3B82F6', Icon: FileText    },
          { label: 'Active Forms',      val: activeForms,      color: '#22C55E', Icon: CheckCircle },
          { label: 'Awaiting Review',   val: totalAwaiting,    color: '#F59E0B', Icon: Clock       },
          { label: 'Total Submissions', val: totalSubmissions, color: '#8B5CF6', Icon: FileStack   },
        ].map(({ label, val, color, Icon }) => (
          <div key={label} className="stat-card flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${color}18` }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div>
              <div className="text-xl font-bold leading-none" style={{ color }}>{val}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Empty state ───────────────────────────────────────────────── */}
      {forms.length === 0 && (
        <div className="content-card flex flex-col items-center justify-center py-20 gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: '#EFF6FF' }}>
            <FileText className="w-8 h-8 text-blue-400" />
          </div>
          <p className="font-semibold" style={{ color: 'var(--text)' }}>No forms assigned yet</p>
          <p className="text-sm text-center max-w-xs" style={{ color: 'var(--text-muted)' }}>
            When an admin assigns forms to you for verification, they'll appear here.
          </p>
        </div>
      )}

      {/* ── Cards grid ───────────────────────────────────────────────── */}
      {forms.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
          {forms.map((form) => {
            const pct = completionPct(form);
            const isActive = form.status === 'Active';

            return (
              <div
                key={form.id}
                className="stat-card group cursor-pointer relative overflow-hidden"
                onClick={() => router.push(`/assigned-forms/${form.id}`)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)' }}>
                      <FileText className="w-5 h-5" style={{ color: '#3B82F6' }} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate" style={{ color: 'var(--text)' }}>
                        {form.formName}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Level {form.level} Verifier
                      </p>
                    </div>
                  </div>
                  <span className={`badge shrink-0 ${isActive ? 'badge-accepted' : 'badge-expired'}`}>
                    {form.status}
                  </span>
                </div>

                {/* Awaiting highlight */}
                {form.awaitingReview > 0 && (
                  <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-lg"
                    style={{ background: '#FEF3C720', border: '1px solid #FDE68A' }}>
                    <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="text-xs font-semibold text-amber-700">
                      {form.awaitingReview} submission{form.awaitingReview !== 1 ? 's' : ''} awaiting your review
                    </span>
                  </div>
                )}

                {/* Stats row — ✅ uses approved not accepted */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  <StatCell label="Total"    val={form.totalSubmissions} color="#3B82F6" Icon={FileStack}   />
                  <StatCell label="Approved" val={form.approved}         color="#22C55E" Icon={CheckCircle} />
                  <StatCell label="Pending"  val={form.pending}          color="#F59E0B" Icon={Clock}       />
                  <StatCell label="Rejected" val={form.rejected}         color="#EF4444" Icon={XCircle}     />
                </div>

                {/* Progress bar — based on approved */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                    <span>Approved</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: 'var(--border)' }}>
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        background: 'linear-gradient(90deg, #22C55E, #14B8A6)',
                      }} />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t"
                  style={{ borderColor: 'var(--border)' }}>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Deadline:{' '}
                    <strong style={{ color: 'var(--text)' }}>
                      {formatDate(form.deadline, { day: '2-digit', month: 'short' })}
                    </strong>
                  </span>
                  <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#3B82F6' }}>
                    Open Dashboard
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>

                {/* Hover accent */}
                <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: 'linear-gradient(90deg, #3B82F6, #14B8A6)' }} />
              </div>
            );
          })}
        </div>
      )}

      {/* ── Summary table ────────────────────────────────────────────── */}
      {forms.length > 0 && (
        <div className="content-card">
          <div className="px-6 py-4 border-b flex items-center justify-between"
            style={{ borderColor: 'var(--border)' }}>
            <h3 className="font-bold text-base flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <BarChart2 style={{ color: '#3B82F6', width: 18, height: 18 }} />
              Forms Summary Table
            </h3>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {forms.length} form{forms.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Form Name</th>
                  <th>Level</th>
                  <th>Total</th>
                  <th>Awaiting</th>
                  <th>Approved</th>
                  <th>Rejected</th>
                  <th>Status</th>
                  <th>Deadline</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {forms.map((f) => (
                  <tr key={f.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: '#EFF6FF' }}>
                          <FileText className="w-4 h-4 text-blue-500" />
                        </div>
                        <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                          {f.formName}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: '#EFF6FF', color: '#3B82F6' }}>
                        L{f.level}
                      </span>
                    </td>
                    <td>
                      <span className="font-bold" style={{ color: '#3B82F6' }}>{f.totalSubmissions}</span>
                    </td>
                    <td>
                      <span className="font-bold"
                        style={{ color: f.awaitingReview > 0 ? '#F59E0B' : 'var(--text-muted)' }}>
                        {f.awaitingReview}
                      </span>
                    </td>
                    <td>
                      <span className="font-bold" style={{ color: '#22C55E' }}>{f.approved}</span>
                    </td>
                    <td>
                      <span className="font-bold" style={{ color: '#EF4444' }}>{f.rejected}</span>
                    </td>
                    <td>
                      <span className={`badge ${f.status === 'Active' ? 'badge-accepted' : 'badge-expired'}`}>
                        {f.status}
                      </span>
                    </td>
                    <td className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {formatDate(f.deadline)}
                    </td>
                    <td>
                      <button
                        onClick={() => router.push(`/assigned-forms/${f.id}`)}
                        className="btn-primary flex items-center gap-1.5"
                        style={{ padding: '6px 12px', fontSize: 12 }}
                      >
                        <BarChart2 className="w-3.5 h-3.5" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}