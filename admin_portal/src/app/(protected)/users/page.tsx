'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Search, Download, Users, Mail, Calendar, RefreshCw,
  AlertCircle, Phone, Building2, ShieldCheck, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = 'Admin' | 'HOD' | 'Caretaker' | 'Dean' | 'Faculty';

interface User {
  id:        string;
  userName:  string;
  email:     string;
  createdAt: string;
  updatedAt: string;
  _count: { formSubmissions: number };
}

interface PaginationMeta {
  total:       number;
  page:        number;
  limit:       number;
  totalPages:  number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SORT_BY_OPTIONS   = ['createdAt', 'updatedAt', 'userName', 'email'] as const;
const SORT_ORDER_OPTIONS = ['asc', 'desc'] as const;
const LIMIT = 20;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

const getInitials = (name: string) =>
  name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

const avatarColor = (name: string) =>
  `hsl(${name.charCodeAt(0) * 7 % 360}, 60%, 40%)`;

// ─── Component ────────────────────────────────────────────────────────────────

export default function UsersDirectoryPage() {

  // ── Data state ─────────────────────────────────────────────────────
  const [users,   setUsers]   = useState<User[]>([]);
  const [meta,    setMeta]    = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  // ── Filter / pagination state ──────────────────────────────────────
  const [search,    setSearch]    = useState('');
  const [sortBy,    setSortBy]    = useState<typeof SORT_BY_OPTIONS[number]>('createdAt');
  const [sortOrder, setSortOrder] = useState<typeof SORT_ORDER_OPTIONS[number]>('desc');
  const [page,      setPage]      = useState(1);
  const [dateFrom,  setDateFrom]  = useState('');
  const [dateTo,    setDateTo]    = useState('');

  // ── Fetch ──────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('page',      String(page));
      params.set('limit',     String(LIMIT));
      params.set('sortBy',    sortBy);
      params.set('sortOrder', sortOrder);

      if (search)   params.set('search', search);
      if (dateFrom) params.set('from',   dateFrom);
      if (dateTo)   params.set('to',     dateTo);

      const { data } = await axios.get(`/api/users/getAllUsers?${params.toString()}`);

      setUsers(data.data);
      setMeta(data.meta);
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message ?? err.message
        : 'An unexpected error occurred';
      setError(message);
      toast.error(`Failed to load users: ${message}`);
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, sortOrder, search, dateFrom, dateTo]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Reset to page 1 on any filter change
  useEffect(() => {
    setPage(1);
  }, [search, sortBy, sortOrder, dateFrom, dateTo]);

  // ── Export ─────────────────────────────────────────────────────────
  const EXPORT_HEADERS = ['Name', 'Email', 'Submissions', 'Joined'];
  const toRow = (u: User) => [
    u.userName,
    u.email,
    String(u._count.formSubmissions),
    formatDate(u.createdAt),
  ];

  const exportCSV = () => {
    const rows = [EXPORT_HEADERS, ...users.map(toRow)];
    const csv  = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `users_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${users.length} users as CSV`);
  };

  const exportPDF = () => {
    const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const headerCells = EXPORT_HEADERS.map(
      h => `<th style="background:#1E3A8A;color:#fff;padding:8px 12px;text-align:left;font-size:11px;">${h}</th>`
    ).join('');
    const bodyRows = users.map((u, i) =>
      `<tr style="background:${i % 2 === 0 ? '#fff' : '#f8fafc'};">${toRow(u)
        .map(v => `<td style="padding:7px 12px;font-size:12px;border-bottom:1px solid #e2e8f0;">${esc(v)}</td>`)
        .join('')}</tr>`
    ).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Users Directory</title>
      <style>body{font-family:Inter,sans-serif;margin:32px;}h1{color:#1E3A8A;}table{border-collapse:collapse;width:100%;}</style>
      </head><body><h1>Users Directory</h1><p style="color:#64748b;font-size:12px;">Exported ${new Date().toLocaleDateString()} · ${users.length} records</p>
      <table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table></body></html>`;
    const win = window.open('', '_blank');
    if (!win) { toast.error('Pop-up blocked — allow pop-ups and retry'); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
    toast.success(`PDF print dialog opened for ${users.length} users`);
  };

  const handleExport = (format: string) => {
    if (users.length === 0) { toast.error('No data to export'); return; }
    if (format === 'CSV') exportCSV();
    else if (format === 'PDF') exportPDF();
  };

  // ── Pagination pages ───────────────────────────────────────────────
  const pageNumbers = useMemo(() => {
    if (!meta) return [];
    const start = Math.max(1, page - 2);
    return Array.from(
      { length: Math.min(5, meta.totalPages - start + 1) },
      (_, i) => start + i
    );
  }, [meta, page]);

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Users Directory
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {loading
              ? 'Loading users...'
              : error
              ? 'Failed to load users'
              : `${meta?.total ?? 0} registered users`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          {['CSV', 'PDF'].map(fmt => (
            <button
              key={fmt}
              onClick={() => handleExport(fmt)}
              disabled={loading || !!error}
              className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium text-white bg-[#1E3A8A] hover:bg-[#1e3a8a]/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-lg shadow-blue-900/20"
            >
              <Download size={14} /> Export {fmt}
            </button>
          ))}
        </div>
      </div>

      {/* ── Error banner ── */}
      {error && !loading && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800 dark:text-red-300">Failed to fetch users</p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{error}</p>
          </div>
          <button
            onClick={fetchUsers}
            className="ml-auto text-xs font-medium text-red-700 dark:text-red-300 hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Users',       value: loading ? '—' : meta?.total ?? 0,                                            icon: <Users size={18} />,     color: '#1E3A8A', bg: '#EFF6FF' },
          { label: 'Total Submissions', value: loading ? '—' : users.reduce((a, u) => a + u._count.formSubmissions, 0),     icon: <ShieldCheck size={18} />, color: '#065F46', bg: '#ECFDF5' },
          { label: 'This Page',         value: loading ? '—' : users.length,                                                icon: <Building2 size={18} />,  color: '#7C3AED', bg: '#F5F3FF' },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800 flex items-center gap-3"
            style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: stat.bg, color: stat.color }}
            >
              {stat.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
            </div>
          </div>
        ))}
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
              placeholder="Search by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 dark:text-white"
            />
          </div>

          {/* Sort by */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as typeof SORT_BY_OPTIONS[number])}
            className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none dark:text-white"
          >
            {SORT_BY_OPTIONS.map(opt => (
              <option key={opt} value={opt}>
                Sort: {opt.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
              </option>
            ))}
          </select>

          {/* Sort order */}
          <select
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value as typeof SORT_ORDER_OPTIONS[number])}
            className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none dark:text-white"
          >
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </select>

          {/* Date range */}
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-gray-400" />
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none dark:text-white"
            />
            <span className="text-gray-400 text-xs">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none dark:text-white"
            />
          </div>
        </div>
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
                {['User', 'Email', 'Submissions', 'Joined', 'Last Updated'].map(h => (
                  <th key={h} className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>

              {/* Loading skeleton */}
              {loading && Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-50 dark:border-gray-800">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                      <div className="space-y-1.5">
                        <div className="h-3 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        <div className="h-2.5 w-16 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                      </div>
                    </div>
                  </td>
                  {[1, 2, 3, 4].map(j => (
                    <td key={j} className="px-6 py-4">
                      <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))}

              {/* Data rows */}
              {!loading && !error && users.map(user => (
                <tr
                  key={user.id}
                  className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  {/* User */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full text-white text-sm font-semibold flex items-center justify-center flex-shrink-0"
                        style={{ background: avatarColor(user.userName) }}
                      >
                        {getInitials(user.userName)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{user.userName}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                          {user.id.slice(0, 8).toUpperCase()}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <Mail size={12} className="text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">{user.email}</span>
                    </div>
                  </td>

                  {/* Submissions */}
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${
                      user._count.formSubmissions > 0
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}>
                      {user._count.formSubmissions} submission{user._count.formSubmissions !== 1 ? 's' : ''}
                    </span>
                  </td>

                  {/* Joined */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} className="text-gray-400" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">{formatDate(user.createdAt)}</span>
                    </div>
                  </td>

                  {/* Last updated */}
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500 dark:text-gray-400">{formatDate(user.updatedAt)}</span>
                  </td>
                </tr>
              ))}

              {/* Empty state */}
              {!loading && !error && users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    {search || dateFrom || dateTo
                      ? 'No users match your filters'
                      : 'No users found in the database'}
                  </td>
                </tr>
              )}

              {/* Error state */}
              {!loading && error && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    Could not load users. Please retry.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {loading ? 'Loading...' : (
              <>
                Showing <span className="font-medium">{users.length}</span> of{' '}
                <span className="font-medium">{meta?.total ?? 0}</span> users
                {meta && ` — page ${meta.page} of ${meta.totalPages}`}
              </>
            )}
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => p - 1)}
              disabled={!meta?.hasPrevPage || loading}
              className="w-7 h-7 flex items-center justify-center text-xs rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={14} />
            </button>

            {pageNumbers.map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                disabled={loading}
                className={`w-7 h-7 text-xs rounded-lg transition-colors ${
                  p === page
                    ? 'bg-[#1E3A8A] text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => setPage(p => p + 1)}
              disabled={!meta?.hasNextPage || loading}
              className="w-7 h-7 flex items-center justify-center text-xs rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}