'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Filter, Download, Activity, Calendar, User, Hash, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ActorUser     { id: string; userName: string; email: string }
interface ActorVerifier { id: string; userName: string; email: string; role: string }
interface FormRef       { id: number; title: string }
interface SubmissionRef { id: string; overallStatus: string; currentLevel: number }

interface AuditLog {
  id:               string;
  action:           string;
  entity:           string;
  entityId:         string;
  actorType:        string;
  actorUserId:      string | null;
  actorVerifierId:  string | null;
  formId:           number | null;
  submissionId:     string | null;
  diff:             { before: Record<string, any> | null; after: Record<string, any> | null } | null;
  meta:             { ip?: string; userAgent?: string; adminEmail?: string } | null;
  createdAt:        string;
  actorUser:        ActorUser     | null;
  actorVerifier:    ActorVerifier | null;
  form:             FormRef       | null;
  submission:       SubmissionRef | null;
}

interface PaginationMeta {
  total:       number;
  page:        number;
  limit:       number;
  totalPages:  number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ACTION_FILTER_LABELS = [
  'All', 'APPROVED', 'REJECTED', 'CREATED', 'UPDATED', 'DELETED',
  'TOGGLED', 'ADDED', 'REMOVED', 'REORDERED',
] as const;

const actionColor = (action: string): string => {
  if (action.includes('APPROVED'))                          return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
  if (action.includes('REJECTED'))                          return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
  if (action.includes('CREATED') || action.includes('ADDED'))    return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
  if (action.includes('DELETED') || action.includes('REMOVED'))  return 'text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
  if (action.includes('UPDATED') || action.includes('TOGGLED') || action.includes('REORDERED')) return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20';
  return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700';
};

const actionDot = (action: string): string => {
  if (action.includes('APPROVED'))                          return 'bg-green-500';
  if (action.includes('REJECTED'))                          return 'bg-red-500';
  if (action.includes('CREATED') || action.includes('ADDED'))    return 'bg-blue-500';
  if (action.includes('DELETED') || action.includes('REMOVED'))  return 'bg-red-400';
  if (action.includes('UPDATED') || action.includes('TOGGLED') || action.includes('REORDERED')) return 'bg-amber-500';
  return 'bg-gray-400';
};

const formatAction = (action: string) =>
  action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

const getActorName = (log: AuditLog): string => {
  if (log.actorUser)     return log.actorUser.userName;
  if (log.actorVerifier) return log.actorVerifier.userName;
  return 'System';
};

const getActorInitial = (log: AuditLog): string => {
  const name = getActorName(log);
  return name.split(' ').slice(-1)[0][0] ?? '?';
};

const getTarget = (log: AuditLog): string => {
  if (log.form)       return `Form #${log.form.id} — ${log.form.title}`;
  if (log.submission) return `Submission #${log.submissionId?.slice(0, 8)}`;
  return `${log.entity} #${log.entityId.slice(0, 8)}`;
};

const today = () => new Date().toISOString().slice(0, 10);
const weekAgo = () => {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().slice(0, 10);
};

// ─── Component ────────────────────────────────────────────────────────────────

interface ActivityLogsPageProps {
  initialAdmin?: string;
}

export function ActivityLogsPage({ initialAdmin = 'All' }: ActivityLogsPageProps) {
  const router   = useRouter();
  const pathname = usePathname();

  // ── Filter state ───────────────────────────────────────────────────
  const [search,          setSearch]          = useState('');
  const [actionTypeFilter, setActionTypeFilter] = useState('All');
  const [dateFrom,        setDateFrom]        = useState('');
  const [dateTo,          setDateTo]          = useState('');
  const [page,            setPage]            = useState(1);
  const LIMIT = 20;

  // ── Data state ─────────────────────────────────────────────────────
  const [logs,       setLogs]       = useState<AuditLog[]>([]);
  const [meta,       setMeta]       = useState<PaginationMeta | null>(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('page',  String(page));
      params.set('limit', String(LIMIT));
      params.set('sortOrder', 'desc');

      if (actionTypeFilter !== 'All') params.set('action', actionTypeFilter);
      if (dateFrom)                   params.set('from',   dateFrom);
      if (dateTo)                     params.set('to',     dateTo);

      const res  = await fetch(`/api/logs?${params.toString()}`);
      const json = await res.json();

      if (!res.ok) throw new Error(json.error ?? 'Failed to fetch logs');

      setLogs(json.data);
      setMeta(json.meta);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, actionTypeFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [actionTypeFilter, dateFrom, dateTo, search]);

  // ── Client-side search filter (over current page) ──────────────────
  const filtered = useMemo(() => {
    if (!search.trim()) return logs;
    const q = search.toLowerCase();
    return logs.filter((log) =>
      log.action.toLowerCase().includes(q)          ||
      getActorName(log).toLowerCase().includes(q)   ||
      getTarget(log).toLowerCase().includes(q)      ||
      (log.meta?.adminEmail ?? '').toLowerCase().includes(q)
    );
  }, [logs, search]);

  // ── Summary stats ──────────────────────────────────────────────────
  const todayCount    = useMemo(() => filtered.filter((l) => l.createdAt.startsWith(today())).length,   [filtered]);
  const weekCount     = useMemo(() => filtered.filter((l) => l.createdAt.slice(0, 10) >= weekAgo()).length, [filtered]);
  const uniqueActors  = useMemo(() => new Set(filtered.map(getActorName)).size,                         [filtered]);

  // ── Export ─────────────────────────────────────────────────────────
  const handleExport = () => {
    const headers = ['Timestamp', 'Actor', 'Action', 'Entity', 'Target', 'IP'];
    const rows    = filtered.map((l) => [
      l.createdAt,
      getActorName(l),
      l.action,
      l.entity,
      getTarget(l),
      l.meta?.ip ?? '',
    ]);
    const csv  = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `audit-logs-${today()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Logs exported as CSV');
  };

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Activity Logs
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Complete audit trail of all admin actions
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <Download size={15} /> Export Logs
        </button>
      </div>

      {/* ── Filters ── */}
      <div
        className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800 space-y-3"
        style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
      >
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by action, actor, or target..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 dark:text-white"
            />
          </div>

          {/* Date range */}
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-gray-400" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none dark:text-white"
            />
            <span className="text-gray-400 text-xs">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none dark:text-white"
            />
          </div>
        </div>

        {/* Action type pills */}
        <div className="flex flex-wrap gap-1.5">
          <Filter size={14} className="text-gray-400 mt-1 flex-shrink-0" />
          {ACTION_FILTER_LABELS.map((action) => (
            <button
              key={action}
              onClick={() => setActionTypeFilter(action)}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                actionTypeFilter === action
                  ? 'bg-[#1E3A8A] text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {action === 'All' ? 'All' : formatAction(action)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Summary stats ── */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Actions',  value: meta?.total ?? filtered.length, icon: <Activity size={16} />, color: '#1E3A8A', bg: '#EFF6FF' },
          { label: 'Today',          value: todayCount,                      icon: <Calendar size={16} />, color: '#16A34A', bg: '#F0FDF4' },
          { label: 'Last 7 Days',    value: weekCount,                       icon: <Hash size={16} />,     color: '#7C3AED', bg: '#F5F3FF' },
          { label: 'Unique Actors',  value: uniqueActors,                    icon: <User size={16} />,     color: '#D97706', bg: '#FFFBEB' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800 flex items-center gap-3"
            style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: stat.bg, color: stat.color }}>
              {stat.icon}
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Table ── */}
      <div
        className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden"
        style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                {['Timestamp', 'Actor', 'Action Taken', 'Target / Entity'].map((h) => (
                  <th key={h} className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Loading */}
              {loading && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <Loader2 size={20} className="animate-spin mx-auto text-gray-400" />
                    <p className="text-sm text-gray-400 mt-2">Loading logs...</p>
                  </td>
                </tr>
              )}

              {/* Error */}
              {!loading && error && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-red-500 text-sm">
                    {error} —{' '}
                    <button onClick={fetchLogs} className="underline">Retry</button>
                  </td>
                </tr>
              )}

              {/* Empty */}
              {!loading && !error && filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No activity logs match your filters
                  </td>
                </tr>
              )}

              {/* Rows */}
              {!loading && !error && filtered.map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  {/* Timestamp */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${actionDot(log.action)}`} />
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </td>

                  {/* Actor */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center flex-shrink-0"
                        style={{ background: `hsl(${getActorName(log).charCodeAt(0) * 17 % 360}, 55%, 35%)` }}
                      >
                        {getActorInitial(log)}
                      </div>
                      <div>
                        <p className="text-sm text-gray-800 dark:text-gray-200">{getActorName(log)}</p>
                        <p className="text-xs text-gray-400">{log.actorType}</p>
                      </div>
                    </div>
                  </td>

                  {/* Action */}
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full font-medium ${actionColor(log.action)}`}>
                      {formatAction(log.action)}
                    </span>
                  </td>

                  {/* Target */}
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600 dark:text-gray-300 font-mono bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-lg">
                      {getTarget(log)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Showing <span className="font-medium">{filtered.length}</span> of{' '}
            <span className="font-medium">{meta?.total ?? 0}</span> log entries
          </p>

          <div className="flex items-center gap-1">
            <button
              disabled={!meta?.hasPrevPage}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 text-xs rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Prev
            </button>

            {meta && Array.from({ length: Math.min(meta.totalPages, 5) }, (_, i) => {
              // Show pages around current page
              const start = Math.max(1, page - 2);
              const p     = start + i;
              if (p > meta.totalPages) return null;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-7 h-7 text-xs rounded-lg transition-colors ${
                    p === page
                      ? 'bg-[#1E3A8A] text-white'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {p}
                </button>
              );
            })}

            <button
              disabled={!meta?.hasNextPage}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 text-xs rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}