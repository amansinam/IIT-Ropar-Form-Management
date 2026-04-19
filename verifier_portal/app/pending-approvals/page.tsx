'use client';
import { useState, useMemo, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search, CheckCircle, XCircle, CornerDownLeft, Eye, Download,
  ChevronDown, X, Filter, Loader2, AlertTriangle, Clock, Zap,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PendingSubmission {
  id: string;
  studentName: string;
  email: string;
  submissionDate: string;
  formId: number;
  formTitle: string;
  deadline: string;
  isExpired: boolean;
  currentLevel: number;
  totalLevels: number;
  currentVerifier: string;
  currentVerifierRole: string;
  myLevel: number | null;
  canAct: boolean;
}

interface Stats {
  total: number;
  canActNow: number;
  expired: number;
  urgent: number;
}

// ─── Modals ───────────────────────────────────────────────────────────────────

function RejectModal({ onClose, onSubmit, loading }: {
  onClose: () => void;
  onSubmit: (r: string) => void;
  loading: boolean;
}) {
  const [reason, setReason] = useState('');
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#FEE2E2' }}>
            <XCircle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Reject Form</h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>This will be shared with the student.</p>
          </div>
        </div>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={4}
          placeholder="Enter rejection reason (required)..."
          className="form-input resize-none mb-4"
          disabled={loading}
        />
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="btn-outline" disabled={loading}>Cancel</button>
          <button
            onClick={() => reason.trim() && onSubmit(reason)}
            className="btn-danger"
            disabled={!reason.trim() || loading}
            style={{ opacity: reason.trim() && !loading ? 1 : 0.5 }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
            Confirm Reject
          </button>
        </div>
      </div>
    </div>
  );
}

function SendBackModal({ onClose, onSubmit, loading }: {
  onClose: () => void;
  onSubmit: (r: string) => void;
  loading: boolean;
}) {
  const [reason, setReason] = useState('');
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#FFFBEB' }}>
            <CornerDownLeft className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Send Back for Correction</h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>The student will be asked to make corrections.</p>
          </div>
        </div>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={4}
          placeholder="Describe required corrections (required)..."
          className="form-input resize-none mb-4"
          disabled={loading}
        />
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="btn-outline" disabled={loading}>Cancel</button>
          <button
            onClick={() => reason.trim() && onSubmit(reason)}
            className="btn-warning"
            disabled={!reason.trim() || loading}
            style={{ opacity: reason.trim() && !loading ? 1 : 0.5 }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CornerDownLeft className="w-4 h-4" />}
            Send Back
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const DEADLINE_OPTIONS = ['All', 'Today', 'Tomorrow', 'This Week', 'Expired'];

export default function PendingApprovalsPage() {
  const router = useRouter();

  const [submissions, setSubmissions] = useState<PendingSubmission[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, canActNow: 0, expired: 0, urgent: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [deadlineFilter, setDeadlineFilter] = useState('All');
  const [selected, setSelected] = useState<string[]>([]);

  // Per-row action state: { submissionId: 'approve' | 'reject' | 'sendback' | null }
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [sendBackModal, setSendBackModal] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; color: string } | null>(null);

  // ── Fetch ───────────────────────────────────────────────────────────────────
  const fetchPending = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/verifier/pending-approvals');
      if (res.status === 401) { router.push('/login'); return; }
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Failed to load pending approvals');
      }
      const json = await res.json();
      setSubmissions(json.submissions);
      setStats(json.stats);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  // ── Filter ──────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    const weekEnd = new Date(today); weekEnd.setDate(today.getDate() + 7);

    return submissions.filter(s => {
      const matchSearch = !search ||
        s.studentName.toLowerCase().includes(search.toLowerCase()) ||
        s.formTitle.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase());

      const deadline = new Date(s.deadline); deadline.setHours(0, 0, 0, 0);
      const matchDeadline =
        deadlineFilter === 'All' ||
        (deadlineFilter === 'Today' && deadline.getTime() === today.getTime()) ||
        (deadlineFilter === 'Tomorrow' && deadline.getTime() === tomorrow.getTime()) ||
        (deadlineFilter === 'This Week' && deadline >= today && deadline <= weekEnd) ||
        (deadlineFilter === 'Expired' && deadline < today);

      return matchSearch && matchDeadline;
    });
  }, [submissions, search, deadlineFilter]);

  const allSelected = filtered.length > 0 && filtered.every(s => selected.includes(s.id));
  const toggleSelect = (id: string) =>
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const toggleAll = () => setSelected(allSelected ? [] : filtered.map(s => s.id));

  // ── Toast ───────────────────────────────────────────────────────────────────
  const showToast = (msg: string, color = '#22C55E') => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Action caller ───────────────────────────────────────────────────────────
  const callAction = async (
    submissionId: string,
    action: 'approve' | 'reject' | 'sendback',
    remark?: string
  ) => {
    setActionLoading(prev => ({ ...prev, [submissionId]: true }));
    try {
      const res = await fetch(`/api/submissions/${submissionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, remark }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Action failed');

      if (action === 'approve') showToast('Form approved and forwarded.');
      else if (action === 'reject') showToast('Form rejected. Student notified.', '#EF4444');
      else showToast('Form sent back for correction.', '#F59E0B');

      // Remove from list optimistically
      setSubmissions(prev => prev.filter(s => s.id !== submissionId));
      setSelected(prev => prev.filter(id => id !== submissionId));
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Action failed', '#EF4444');
    } finally {
      setActionLoading(prev => ({ ...prev, [submissionId]: false }));
    }
  };

  const handleApprove = (id: string) => callAction(id, 'approve');
  const handleReject = (remark: string) => {
    if (!rejectModal) return;
    const id = rejectModal;
    setRejectModal(null);
    callAction(id, 'reject', remark);
  };
  const handleSendBack = (remark: string) => {
    if (!sendBackModal) return;
    const id = sendBackModal;
    setSendBackModal(null);
    callAction(id, 'sendback', remark);
  };

  // ── Bulk actions (approve only — reject needs a remark per submission) ──────
  const handleBulkApprove = async () => {
    const actable = selected.filter(id => {
      const s = submissions.find(s => s.id === id);
      return s?.canAct;
    });
    await Promise.all(actable.map(id => callAction(id, 'approve')));
    setSelected([]);
  };

  // ── Export CSV ──────────────────────────────────────────────────────────────
  const exportCSV = () => {
    const csv = [
      'Student,Email,Form,Submitted,Current Verifier,Deadline',
      ...filtered.map(s =>
        `${s.studentName},${s.email},${s.formTitle},${new Date(s.submissionDate).toLocaleDateString()},${s.currentVerifier},${new Date(s.deadline).toLocaleDateString()}`
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'pending-approvals.csv'; a.click();
  };

  // ── Loading state ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--text-muted)' }} />
          <span className="ml-2 text-sm" style={{ color: 'var(--text-muted)' }}>Loading pending approvals...</span>
        </div>
      </DashboardLayout>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────────
  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <AlertTriangle className="w-8 h-8 text-red-400" />
          <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{error}</p>
          <button onClick={fetchPending} className="btn-outline text-sm">Retry</button>
        </div>
      </DashboardLayout>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-semibold shadow-lg"
          style={{ background: `linear-gradient(135deg, ${toast.color}, ${toast.color}cc)` }}
        >
          ✓ {toast.msg}
        </div>
      )}

      {/* Modals */}
      {rejectModal && (
        <RejectModal
          onClose={() => setRejectModal(null)}
          onSubmit={handleReject}
          loading={!!actionLoading[rejectModal]}
        />
      )}
      {sendBackModal && (
        <SendBackModal
          onClose={() => setSendBackModal(null)}
          onSubmit={handleSendBack}
          loading={!!actionLoading[sendBackModal]}
        />
      )}

      {/* Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Pending Approvals</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {stats.canActNow} form{stats.canActNow !== 1 ? 's' : ''} awaiting your action
            {stats.urgent > 0 && (
              <span className="ml-2 text-xs font-semibold text-amber-500">
                · {stats.urgent} urgent
              </span>
            )}
          </p>
        </div>
        <div className="export-group">
          <button onClick={exportCSV} className="btn-outline">
            <Download className="w-4 h-4 text-green-500" /> Export CSV
          </button>
          <button className="btn-outline">
            <Download className="w-4 h-4 text-red-400" /> Export PDF
          </button>
        </div>
      </div>

      {/* Mini stat strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total Pending', value: stats.total, color: '#3B82F6', bg: '#EFF6FF' },
          { label: 'Act Now', value: stats.canActNow, color: '#22C55E', bg: '#F0FDF4', icon: Zap },
          { label: 'Urgent (≤2d)', value: stats.urgent, color: '#F59E0B', bg: '#FFFBEB', icon: Clock },
          { label: 'Past Deadline', value: stats.expired, color: '#EF4444', bg: '#FFF5F5', icon: AlertTriangle },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className="content-card p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: bg }}>
              {Icon
                ? <Icon className="w-4 h-4" style={{ color }} />
                : <CheckCircle className="w-4 h-4" style={{ color }} />}
            </div>
            <div>
              <p className="text-xl font-bold leading-none mb-0.5" style={{ color: 'var(--text)' }}>{value}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="content-card mb-5">
        <div className="p-4 flex flex-wrap gap-3 items-end">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            {/* <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} /> */}
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by student, form, or email..."
              className="form-input pl-9"
            />
          </div>

          {/* Deadline */}
          <div className="relative min-w-36">
            <select
              value={deadlineFilter}
              onChange={e => setDeadlineFilter(e.target.value)}
              className="form-input appearance-none pr-8 cursor-pointer"
            >
              {DEADLINE_OPTIONS.map(d => <option key={d}>{d}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: 'var(--text-muted)' }} />
          </div>

          {/* Clear */}
          {(search || deadlineFilter !== 'All') && (
            <button
              onClick={() => { setSearch(''); setDeadlineFilter('All'); }}
              className="btn-outline flex items-center gap-1.5"
            >
              <X className="w-4 h-4" /> Clear
            </button>
          )}
        </div>

        {/* Bulk actions */}
        {selected.length > 0 && (
          <div className="px-4 pb-4 flex items-center gap-3 flex-wrap">
            <span className="text-sm font-semibold px-3 py-1.5 rounded-lg"
              style={{ background: '#EFF6FF', color: '#1D4ED8' }}>
              {selected.length} selected
            </span>
            <button onClick={handleBulkApprove} className="btn-success" style={{ padding: '7px 14px' }}>
              <CheckCircle className="w-4 h-4" /> Approve Selected
            </button>
            <button onClick={() => setSelected([])} className="btn-outline" style={{ padding: '7px 14px' }}>
              <X className="w-4 h-4" /> Deselect
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="content-card">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 44 }}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded accent-blue-500 cursor-pointer"
                  />
                </th>
                <th>Student</th>
                <th>Form</th>
                <th>Submitted</th>
                <th>Current Verifier</th>
                <th>Deadline</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <Filter className="w-10 h-10" style={{ color: 'var(--text-muted)' }} />
                      <p className="font-semibold" style={{ color: 'var(--text)' }}>No pending forms found</p>
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        {search || deadlineFilter !== 'All' ? 'Try adjusting your filters' : 'You\'re all caught up!'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(s => {
                  const now = new Date();
                  const deadline = new Date(s.deadline);
                  const diffMs = deadline.getTime() - now.getTime();
                  const isUrgent = !s.isExpired && diffMs > 0 && diffMs < 86400000 * 2;
                  const isActLoading = !!actionLoading[s.id];

                  return (
                    <tr key={s.id}>
                      {/* Checkbox */}
                      <td>
                        <input
                          type="checkbox"
                          checked={selected.includes(s.id)}
                          onChange={() => toggleSelect(s.id)}
                          className="w-4 h-4 rounded accent-blue-500 cursor-pointer"
                        />
                      </td>

                      {/* Student */}
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                            style={{ background: `hsl(${s.studentName.charCodeAt(0) * 7},60%,50%)` }}
                          >
                            {s.studentName.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{s.studentName}</p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Form */}
                      <td>
                        <p className="font-medium text-sm" style={{ color: 'var(--text)' }}>{s.formTitle}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          Level {s.currentLevel} of {s.totalLevels}
                        </p>
                      </td>

                      {/* Submitted date */}
                      <td className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        {new Date(s.submissionDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </td>

                      {/* Current verifier */}
                      <td>
                        <p className="text-sm" style={{ color: 'var(--text)' }}>{s.currentVerifier}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.currentVerifierRole}</p>
                      </td>

                      {/* Deadline badge */}
                      <td>
                        <span className={`badge ${s.isExpired ? 'badge-rejected' : isUrgent ? 'badge-pending' : 'badge-accepted'}`}>
                          {s.isExpired
                            ? '⚠ Overdue'
                            : new Date(s.deadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </span>
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="flex items-center gap-1.5">
                          {/* View */}
                          <Link
                            href={`/form-details/${s.id}`}
                            title="View Details"
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                            style={{ background: '#EFF6FF', color: '#3B82F6', textDecoration: 'none' }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#DBEAFE'}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#EFF6FF'}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>

                          {/* Only show action buttons if it's this verifier's turn */}
                          {s.canAct && (
                            <>
                              {/* Approve */}
                              <button
                                onClick={() => handleApprove(s.id)}
                                disabled={isActLoading}
                                title="Approve"
                                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                                style={{ background: '#F0FDF4', color: '#22C55E', border: 'none', cursor: 'pointer' }}
                                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#DCFCE7'}
                                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = '#F0FDF4'}
                              >
                                {isActLoading
                                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  : <CheckCircle className="w-3.5 h-3.5" />}
                              </button>

                              {/* Reject */}
                              <button
                                onClick={() => setRejectModal(s.id)}
                                disabled={isActLoading}
                                title="Reject"
                                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                                style={{ background: '#FFF5F5', color: '#EF4444', border: 'none', cursor: 'pointer' }}
                                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#FEE2E2'}
                                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = '#FFF5F5'}
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>

                              {/* Send Back */}
                              <button
                                onClick={() => setSendBackModal(s.id)}
                                disabled={isActLoading}
                                title="Send Back"
                                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                                style={{ background: '#FFFBEB', color: '#F59E0B', border: 'none', cursor: 'pointer' }}
                                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#FEF3C7'}
                                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = '#FFFBEB'}
                              >
                                <CornerDownLeft className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}