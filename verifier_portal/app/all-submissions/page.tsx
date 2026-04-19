'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import {
  Search, Eye, Download, ChevronDown, Filter,
  Loader2, AlertTriangle, CheckCircle, XCircle, Clock, FileStack,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type DisplayStatus = 'Accepted' | 'Pending' | 'Rejected' | 'Expired';

interface Submission {
  id: string;
  studentName: string;
  email: string;
  formId: number;
  formTitle: string;
  submissionDate: string;
  deadline: string;
  isExpired: boolean;
  status: DisplayStatus;
  overallStatus: string;
  currentLevel: number;
  totalLevels: number;
  currentVerifier: string;
  currentVerifierRole: string;
}

interface Stats {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
  expired: number;
}

interface FormOption {
  id: number;
  title: string;
}

interface ApiResponse {
  submissions: Submission[];
  stats: Stats;
  formOptions: FormOption[];
}

const EMPTY_STATS: Stats = {
  total: 0,
  pending: 0,
  accepted: 0,
  rejected: 0,
  expired: 0,
};

function normalizeApiResponse(payload: Partial<ApiResponse> | null | undefined): ApiResponse {
  return {
    submissions: Array.isArray(payload?.submissions) ? payload.submissions : [],
    stats: payload?.stats ? { ...EMPTY_STATS, ...payload.stats } : { ...EMPTY_STATS },
    formOptions: Array.isArray(payload?.formOptions) ? payload.formOptions : [],
  };
}

// ─── Status tab config ────────────────────────────────────────────────────────

const STATUS_TABS: { label: string; key: string; color: string }[] = [
  { label: 'All',      key: 'All',      color: '#3B82F6' },
  { label: 'Pending',  key: 'Pending',  color: '#F59E0B' },
  { label: 'Accepted', key: 'Accepted', color: '#22C55E' },
  { label: 'Rejected', key: 'Rejected', color: '#EF4444' },
  { label: 'Expired',  key: 'Expired',  color: '#94A3B8' },
];

// ─── Inner component (uses useSearchParams) ───────────────────────────────────

function SubmissionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialise from URL query params (links from dashboard stat cards pass these)
  const [status, setStatus]         = useState(searchParams.get('status') ?? 'All');
  const [formId, setFormId]         = useState(searchParams.get('formId') ?? '');
  const [search, setSearch]         = useState(searchParams.get('search') ?? '');
  const [startDate, setStartDate]   = useState('');
  const [endDate, setEndDate]       = useState('');

  const [data, setData]             = useState<ApiResponse | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (status && status !== 'All') params.set('status', status);
      if (formId)    params.set('formId', formId);
      if (search)    params.set('search', search);
      if (startDate) params.set('startDate', startDate);
      if (endDate)   params.set('endDate', endDate);

      const res = await fetch(`/api/verifier/all-submissions?${params.toString()}`);
      if (res.status === 401) { router.push('/login'); return; }
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Failed to load submissions');
      }

      const json = await res.json();
      setData(normalizeApiResponse(json));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [status, formId, search, startDate, endDate, router]);

  // Debounce search + re-fetch whenever filters change
  useEffect(() => {
    const timer = setTimeout(() => { fetchSubmissions(); }, search ? 350 : 0);
    return () => clearTimeout(timer);
  }, [fetchSubmissions, search]);

  // ── Export CSV ────────────────────────────────────────────────────────────
  const exportCSV = () => {
    if (!data) return;
    const csv = [
      'Student,Email,Form,Submitted,Status,Current Verifier,Level',
      ...data.submissions.map(s =>
        `"${s.studentName}","${s.email}","${s.formTitle}",` +
        `"${new Date(s.submissionDate).toLocaleDateString()}",` +
        `"${s.status}","${s.currentVerifier}","${s.currentLevel}/${s.totalLevels}"`
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'submissions.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    if (!data || data.submissions.length === 0) { return; }
    const tableRows = data.submissions.map(s => `
      <tr>
        <td>${s.studentName}</td>
        <td>${s.email}</td>
        <td>${s.formTitle}</td>
        <td>${s.status}</td>
        <td>${s.currentLevel}/${s.totalLevels}</td>
        <td>${new Date(s.submissionDate).toLocaleDateString('en-IN')}</td>
      </tr>
    `).join('');
    const html = `<!DOCTYPE html><html><head><title>Submissions Report</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 24px; }
        h1 { font-size: 18px; margin-bottom: 4px; }
        p  { color: #666; font-size: 13px; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { background: #1E3A8A; color: white; padding: 8px; text-align: left; }
        td { padding: 7px 8px; border-bottom: 1px solid #e5e7eb; }
        tr:nth-child(even) td { background: #f9fafb; }
      </style>
    </head><body>
      <h1>Submissions Report</h1>
      <p>${data.submissions.length} records · Exported ${new Date().toLocaleDateString('en-IN')}</p>
      <table>
        <thead><tr><th>Student</th><th>Email</th><th>Form</th><th>Status</th><th>Level</th><th>Date</th></tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
    </body></html>`;
    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); win.focus(); setTimeout(() => win.print(), 500); }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--text-muted)' }} />
        <span className="ml-2 text-sm" style={{ color: 'var(--text-muted)' }}>Loading submissions...</span>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertTriangle className="w-8 h-8 text-red-400" />
        <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{error ?? 'No data found'}</p>
        <button onClick={fetchSubmissions} className="btn-outline text-sm">Retry</button>
      </div>
    );
  }

  const submissions = Array.isArray(data.submissions) ? data.submissions : [];
  const stats = data.stats ? { ...EMPTY_STATS, ...data.stats } : EMPTY_STATS;
  const formOptions = Array.isArray(data.formOptions) ? data.formOptions : [];
  const hasFilters = search || status !== 'All' || formId || startDate || endDate;

  const statCards = [
    { key: 'total',    label: 'Total',    value: stats.total,    icon: FileStack,    color: '#3B82F6', bg: '#EFF6FF' },
    { key: 'pending',  label: 'Pending',  value: stats.pending,  icon: Clock,        color: '#F59E0B', bg: '#FFFBEB' },
    { key: 'accepted', label: 'Accepted', value: stats.accepted, icon: CheckCircle,  color: '#22C55E', bg: '#F0FDF4' },
    { key: 'rejected', label: 'Rejected', value: stats.rejected, icon: XCircle,      color: '#EF4444', bg: '#FFF5F5' },
    { key: 'expired',  label: 'Expired',  value: stats.expired,  icon: AlertTriangle,color: '#94A3B8', bg: '#F8FAFC' },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>All Submissions</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {submissions.length} of {stats.total} submissions shown
          </p>
        </div>
        <div className="export-group">
          <button onClick={exportCSV} className="btn-outline">
            <Download className="w-4 h-4 text-green-500" /> Export CSV
          </button>
          <button onClick={exportPDF} className="btn-outline">
            <Download className="w-4 h-4 text-red-400" /> Export PDF
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
        {statCards.map(({ key, label, value, icon: Icon, color, bg }) => (
          <div
            key={key}
            className="content-card p-4 cursor-pointer transition-all hover:shadow-md"
            onClick={() => setStatus(key === 'total' ? 'All' : label)}
            style={{ outline: status === (key === 'total' ? 'All' : label) ? `2px solid ${color}` : 'none' }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2" style={{ background: bg }}>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{value}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Status tabs + form/dept dropdowns */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 items-center">
        {STATUS_TABS.map(({ label, key, color }) => {
          const count = key === 'All' ? stats.total
            : key === 'Pending'  ? stats.pending
            : key === 'Accepted' ? stats.accepted
            : key === 'Rejected' ? stats.rejected
            : stats.expired;
          const active = status === key;
          return (
            <button
              key={key}
              onClick={() => setStatus(key)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap"
              style={{
                background: active ? `${color}18` : 'var(--card)',
                color: active ? color : 'var(--text-muted)',
                border: `1px solid ${active ? color + '40' : 'var(--border)'}`,
                cursor: 'pointer',
              }}
            >
              {label}
              <span
                className="px-1.5 py-0.5 rounded-md text-xs"
                style={{
                  background: active ? color + '25' : 'var(--bg)',
                  color: active ? color : 'var(--text-muted)',
                }}
              >
                {count}
              </span>
            </button>
          );
        })}

        {/* Form filter dropdown — populated from API */}
        {formOptions.length > 1 && (
          <div className="relative min-w-48 ml-auto">
            <select
              value={formId}
              onChange={e => setFormId(e.target.value)}
              className="form-input appearance-none pr-8 cursor-pointer"
            >
              <option value="">All Forms</option>
              {formOptions.map(f => (
                <option key={f.id} value={f.id}>{f.title}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: 'var(--text-muted)' }} />
          </div>
        )}
      </div>

      {/* Search + date filters */}
      <div className="content-card mb-5">
        <div className="p-4 flex flex-wrap gap-3 items-end">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            {/* <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} /> */}
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by student name or email..."
              className="form-input pl-9"
            />
          </div>

          {/* Date range */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="form-input"
              title="From date"
            />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>to</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="form-input"
              title="To date"
            />
          </div>

          {/* Clear */}
          {hasFilters && (
            <button
              onClick={() => {
                setSearch(''); setStatus('All'); setFormId('');
                setStartDate(''); setEndDate('');
              }}
              className="btn-outline flex items-center gap-1.5"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="content-card">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Form</th>
                <th>Submitted</th>
                <th>Status</th>
                <th>Current Verifier</th>
                <th>Level</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {submissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <Filter className="w-10 h-10" style={{ color: 'var(--text-muted)' }} />
                      <p className="font-semibold" style={{ color: 'var(--text)' }}>No submissions match your filters</p>
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                submissions.map(s => {
                  const canViewDetails =
                    s.status === 'Accepted' ||
                    s.status === 'Rejected' ||
                    s.overallStatus === 'Accepted' ||
                    s.overallStatus === 'Rejected';

                  return (
                  <tr key={s.id}>
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
                    </td>

                    {/* Submitted date */}
                    <td className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {new Date(s.submissionDate).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </td>

                    {/* Status badge */}
                    <td>
                      <span className={`badge badge-${s.status.toLowerCase()}`}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'currentColor' }} />
                        {s.status}
                      </span>
                    </td>

                    {/* Current verifier */}
                    <td>
                      <p className="text-sm" style={{ color: 'var(--text)' }}>{s.currentVerifier}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.currentVerifierRole}</p>
                    </td>

                    {/* Level */}
                    <td>
                      <div className="flex items-center gap-1 text-sm">
                        <span className="font-bold" style={{ color: '#3B82F6' }}>L{s.currentLevel}</span>
                        <span style={{ color: 'var(--text-muted)' }}>/{s.totalLevels}</span>
                      </div>
                    </td>

                    {/* Action */}
                    <td>
                      {canViewDetails ? (
                        <Link
                          href={`/form-details/${s.id}`}
                          className="flex items-center gap-1.5 text-sm font-semibold"
                          style={{ color: '#3B82F6', textDecoration: 'none' }}
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </Link>
                      ) : (
                        <Link
                          href="/pending-approvals"
                          className="flex items-center gap-1.5 text-sm font-semibold"
                          style={{ color: '#F59E0B', textDecoration: 'none' }}
                        >
                          <Eye className="w-3.5 h-3.5" /> Goto Pending
                        </Link>
                      )}
                    </td>
                  </tr>
                );
                })
              )}
            </tbody>
          </table>
        </div>

        {submissions.length > 0 && (
          <div
            className="px-6 py-3 border-t flex items-center justify-between text-sm"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          >
            <span>Showing {submissions.length} result{submissions.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Page wrapper ─────────────────────────────────────────────────────────────

export default function AllSubmissionsPage() {
  return (
    <DashboardLayout>
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--text-muted)' }} />
            <span className="ml-2 text-sm" style={{ color: 'var(--text-muted)' }}>Loading submissions...</span>
          </div>
        }
      >
        <SubmissionsContent />
      </Suspense>
    </DashboardLayout>
  );
}
