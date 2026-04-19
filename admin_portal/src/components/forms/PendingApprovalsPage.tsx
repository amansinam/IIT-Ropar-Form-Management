'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Search, Filter, CheckCircle, XCircle, Eye, Clock, X, Check, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

interface PendingApprovalsPageProps {
  initialVerifier?: string;
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function DetailPanel({
  submission,
  onClose,
  onApprove,
  onReject,
  actionLoading,
}: {
  submission: PendingSubmission;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  actionLoading: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-end p-4"
      style={{ backdropFilter: 'blur(4px)', background: 'rgba(0,0,0,0.3)' }}
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 w-full max-w-lg h-full max-h-screen overflow-y-auto rounded-2xl shadow-2xl p-6 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-gray-900 dark:text-white font-bold">Form Details</h3>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Student info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
          <p className="text-xs font-semibold text-[#1E3A8A] dark:text-blue-300 uppercase tracking-wide mb-3">Student Information</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1E3A8A] text-white font-semibold text-sm flex items-center justify-center">
              {submission.studentName.split(' ').map((n) => n[0]).join('')}
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{submission.studentName}</p>
              <p className="text-gray-500 dark:text-gray-400 text-xs">{submission.email}</p>
            </div>
          </div>
        </div>

        {/* Submission data */}
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Submission Details</p>
          <div className="space-y-3">
            {[
              { label: 'Form',              value: submission.formTitle },
              { label: 'Date Submitted',    value: new Date(submission.submissionDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) },
              { label: 'Deadline',          value: new Date(submission.deadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) },
              { label: 'Current Verifier',  value: `${submission.currentVerifier} (${submission.currentVerifierRole})` },
              { label: 'Progress',          value: `Level ${submission.currentLevel} of ${submission.totalLevels}` },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-start py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-xs text-gray-500 dark:text-gray-400">{item.label}</span>
                <span className="text-xs font-medium text-gray-800 dark:text-white text-right max-w-xs">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Full details link */}
        <Link
          href={`/form-details/${submission.id}`}
          className="flex items-center justify-center gap-2 w-full py-2 text-sm font-semibold rounded-xl transition-colors"
          style={{ background: '#EFF6FF', color: '#1E3A8A', textDecoration: 'none' }}
        >
          <Eye size={15} /> View Full Submission
        </Link>

        {/* Actions */}
        {submission.canAct && (
          <div className="flex gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={() => { onApprove(submission.id); onClose(); }}
              disabled={actionLoading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
              Approve
            </button>
            <button
              onClick={() => { onReject(submission.id); onClose(); }}
              disabled={actionLoading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              <XCircle size={16} /> Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function PendingApprovalsPage({ initialVerifier = 'All' }: PendingApprovalsPageProps) {
  const router = useRouter();

  const [submissions, setSubmissions]   = useState<PendingSubmission[]>([]);
  const [stats, setStats]               = useState<Stats | null>(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);

  const [selected, setSelected]         = useState<Set<string>>(new Set());
  const [search, setSearch]             = useState('');
  const [verifierFilter, setVerifierFilter] = useState(initialVerifier);
  const [formFilter, setFormFilter]     = useState('All');
  const [dateFilter, setDateFilter]     = useState('');

  const [viewDetail, setViewDetail]     = useState<PendingSubmission | null>(null);
  const [rejectModal, setRejectModal]   = useState<string | 'bulk' | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  // ── Sync initialVerifier prop ──────────────────────────────────────────────
  useEffect(() => { setVerifierFilter(initialVerifier); }, [initialVerifier]);

  // ── Fetch ──────────────────────────────────────────────────────────────────
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

  // ── Derived filter options from live data ──────────────────────────────────
  const verifierOptions = useMemo(() =>
    ['All', ...Array.from(new Set(submissions.map((s) => s.currentVerifier)))],
    [submissions]
  );
  const formOptions = useMemo(() =>
    ['All', ...Array.from(new Set(submissions.map((s) => s.formTitle)))],
    [submissions]
  );

  // ── Client-side filter (search, verifier, form, date) ──────────────────────
  const filtered = useMemo(() => submissions.filter((s) => {
    const matchSearch =
      !search ||
      s.studentName.toLowerCase().includes(search.toLowerCase()) ||
      s.formTitle.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());
    const matchVerifier = verifierFilter === 'All' || s.currentVerifier === verifierFilter;
    const matchForm     = formFilter === 'All' || s.formTitle === formFilter;
    const matchDate     = !dateFilter || new Date(s.submissionDate).toISOString().startsWith(dateFilter);
    return matchSearch && matchVerifier && matchForm && matchDate;
  }), [submissions, search, verifierFilter, formFilter, dateFilter]);

  // ── Selection helpers ──────────────────────────────────────────────────────
  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };
  const toggleAll = () =>
    setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map((s) => s.id)));

  // ── Action caller ──────────────────────────────────────────────────────────
  const callAction = async (
    submissionId: string,
    action: 'approve' | 'reject' | 'sendback',
    remark?: string
  ) => {
    setActionLoading((prev) => ({ ...prev, [submissionId]: true }));
    try {
      const res = await fetch(`/api/submissions/${submissionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, remark }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Action failed');

      // Optimistically remove from list
      setSubmissions((prev) => prev.filter((s) => s.id !== submissionId));
      setSelected((prev) => { const next = new Set(prev); next.delete(submissionId); return next; });

      if (action === 'approve') toast.success('Form approved and forwarded.');
      else if (action === 'reject') toast.error('Form rejected. Student notified.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setActionLoading((prev) => ({ ...prev, [submissionId]: false }));
    }
  };

  const approveOne = (id: string) => callAction(id, 'approve');

  const confirmReject = async () => {
    if (!rejectReason.trim()) { toast.error('Please provide a reason for rejection'); return; }

    if (rejectModal === 'bulk') {
      const actable = [...selected].filter((id) => submissions.find((s) => s.id === id)?.canAct);
      await Promise.all(actable.map((id) => callAction(id, 'reject', rejectReason)));
      toast.error(`${actable.length} form(s) rejected`);
    } else if (rejectModal) {
      await callAction(rejectModal, 'reject', rejectReason);
    }
    setRejectModal(null);
    setRejectReason('');
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Loading pending approvals...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertTriangle className="w-8 h-8 text-red-400" />
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{error}</p>
        <button onClick={fetchPending} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Retry</button>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <div>
        <h1 className="text-gray-900 dark:text-white font-bold text-2xl" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Pending Approvals
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          {stats?.canActNow ?? 0} submission{stats?.canActNow !== 1 ? 's' : ''} awaiting your action
          {(stats?.urgent ?? 0) > 0 && (
            <span className="ml-2 text-amber-500 font-semibold text-xs">· {stats!.urgent} urgent</span>
          )}
        </p>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="bg-[#1E3A8A] text-white rounded-xl px-5 py-3 flex items-center justify-between">
          <p className="text-sm font-medium">{selected.size} submission(s) selected</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const actable = [...selected].filter((id) => submissions.find((s) => s.id === id)?.canAct);
                Promise.all(actable.map((id) => callAction(id, 'approve')));
                setSelected(new Set());
              }}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <CheckCircle size={14} /> Approve Selected
            </button>
            <button
              onClick={() => setRejectModal('bulk')}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <XCircle size={14} /> Reject Selected
            </button>
            <button onClick={() => setSelected(new Set())} className="p-1 hover:bg-white/20 rounded transition-colors">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800 space-y-3"
        style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by student, form, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={14} className="text-gray-400" />
            <select
              value={verifierFilter}
              onChange={(e) => setVerifierFilter(e.target.value)}
              className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none dark:text-white"
            >
              {verifierOptions.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>

          <select
            value={formFilter}
            onChange={(e) => setFormFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none dark:text-white"
          >
            {formOptions.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none dark:text-white"
          />

          {(search || verifierFilter !== 'All' || formFilter !== 'All' || dateFilter) && (
            <button
              onClick={() => { setSearch(''); setVerifierFilter('All'); setFormFilter('All'); setDateFilter(''); }}
              className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X size={13} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden"
        style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                <th className="px-6 py-3.5 w-12">
                  <input
                    type="checkbox"
                    checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={toggleAll}
                    className="w-4 h-4 text-[#1E3A8A] rounded border-gray-300 cursor-pointer"
                  />
                </th>
                {['Student', 'Form', 'Submitted', 'Current Verifier', 'Deadline', 'Actions'].map((h) => (
                  <th key={h} className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <CheckCircle size={32} className="text-green-400 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">No pending approvals</p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                      {search || verifierFilter !== 'All' || formFilter !== 'All' || dateFilter
                        ? 'No submissions match your filters.'
                        : "You're all caught up!"}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((s) => {
                  const now = new Date();
                  const deadline = new Date(s.deadline);
                  const isUrgent = !s.isExpired && deadline.getTime() - now.getTime() < 86400000 * 2;
                  const isActLoading = !!actionLoading[s.id];

                  return (
                    <tr
                      key={s.id}
                      className={`border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors ${selected.has(s.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                    >
                      <td className="px-6 py-4 w-12">
                        <input
                          type="checkbox"
                          checked={selected.has(s.id)}
                          onChange={() => toggleSelect(s.id)}
                          className="w-4 h-4 text-[#1E3A8A] rounded border-gray-300 cursor-pointer"
                        />
                      </td>

                      {/* Student */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold flex items-center justify-center">
                            {s.studentName.split(' ').map((n) => n[0]).join('')}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{s.studentName}</p>
                            <p className="text-xs text-gray-400">{s.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Form */}
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600 dark:text-gray-300">{s.formTitle}</p>
                        <p className="text-xs text-gray-400">Level {s.currentLevel}/{s.totalLevels}</p>
                      </td>

                      {/* Submitted */}
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {new Date(s.submissionDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </td>

                      {/* Current Verifier */}
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1.5 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-full font-medium w-fit">
                          <Clock size={11} /> {s.currentVerifier}
                        </span>
                      </td>

                      {/* Deadline */}
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          s.isExpired
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                            : isUrgent
                              ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                              : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                        }`}>
                          {s.isExpired ? '⚠ Overdue' : deadline.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setViewDetail(s)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#1E3A8A] dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors font-medium"
                          >
                            <Eye size={12} /> View
                          </button>
                          {s.canAct && (
                            <>
                              <button
                                onClick={() => approveOne(s.id)}
                                disabled={isActLoading}
                                className="p-1.5 text-green-600 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50"
                                title="Approve"
                              >
                                {isActLoading
                                  ? <Loader2 size={14} className="animate-spin" />
                                  : <CheckCircle size={14} />}
                              </button>
                              <button
                                onClick={() => setRejectModal(s.id)}
                                disabled={isActLoading}
                                className="p-1.5 text-red-500 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                                title="Reject"
                              >
                                <XCircle size={14} />
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

      {/* Detail panel */}
      {viewDetail && (
        <DetailPanel
          submission={viewDetail}
          onClose={() => setViewDetail(null)}
          onApprove={approveOne}
          onReject={(id) => setRejectModal(id)}
          actionLoading={!!actionLoading[viewDetail.id]}
        />
      )}

      {/* Reject modal */}
      {rejectModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backdropFilter: 'blur(4px)', background: 'rgba(0,0,0,0.4)' }}
        >
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center mb-4">
              <XCircle size={22} className="text-red-500" />
            </div>
            <h3 className="text-gray-900 dark:text-white font-bold mb-1">
              Reject Submission{rejectModal === 'bulk' ? 's' : ''}
            </h3>
            {rejectModal === 'bulk' && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                This reason will be applied to all {selected.size} selected submission(s).
              </p>
            )}
            <div className="mt-4 mb-5">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Reason for Rejection *
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Provide a clear reason for rejection..."
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300 bg-gray-50 dark:bg-gray-800 dark:text-white resize-none h-24"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setRejectModal(null); setRejectReason(''); }}
                className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmReject}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}