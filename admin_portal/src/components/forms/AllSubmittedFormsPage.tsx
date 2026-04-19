'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Filter, Eye, Download, FileText, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

// ── Types ──────────────────────────────────────────────────────────────────────

interface SubmissionUser {
  id: number;
  userName: string;
  email: string;
}

interface FormSubmission {
  id: number;
  overallStatus: string;
  currentLevel: number;
  createdAt: string;
  updatedAt: string;
  user: SubmissionUser;
}

interface FormData {
  id: number;
  name: string;
  formStatus: boolean;
  formSubmissions: FormSubmission[];
  _count: { formSubmissions: number };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const normalizeStatus = (raw: string): 'Approved' | 'Pending' | 'Rejected' | string => {
  const map: Record<string, string> = {
    APPROVED: 'Approved',
    PENDING: 'Pending',
    REJECTED: 'Rejected',
  };
  return map[raw?.toUpperCase()] ?? raw;
};

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    Approved: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    Pending: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    Rejected: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  };
  return map[status] ?? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
};

const dotColor = (status: string) => {
  const map: Record<string, string> = {
    Approved: 'bg-green-500',
    Pending: 'bg-amber-500',
    Rejected: 'bg-red-500',
  };
  return map[status] ?? 'bg-gray-400';
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
};

const initials = (name: string) =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

// ── Component ──────────────────────────────────────────────────────────────────

interface AllSubmittedFormsPageProps {
  formId: string; // required: which form to load
  initialStatus?: string;
  initialDate?: string;
  initialSearch?: string;
  initialPage?: string;
}

export function AllSubmittedFormsPage({
  formId,
  initialStatus = 'All',
  initialDate = '',
  initialSearch = '',
  initialPage = '1',
}: AllSubmittedFormsPageProps) {
  const router = useRouter();
  const pathname = usePathname();

  // ── Constants ───────────────────────────────────────────────────────────────
  const ITEMS_PER_PAGE = 20;

  // ── Filter state ────────────────────────────────────────────────────────────
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [dateFilter, setDateFilter] = useState(initialDate);
  const [currentPage, setCurrentPage] = useState(parseInt(initialPage, 10) || 1);

  // ── Data state ──────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch ───────────────────────────────────────────────────────────────────
  const fetchForm = useCallback(async () => {
    if (!formId) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/form/getForm/${formId}?page=${currentPage}&limit=${ITEMS_PER_PAGE}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message ?? 'Failed to fetch form.');
      }
      setFormData(json.data as FormData);
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }, [formId, currentPage, ITEMS_PER_PAGE]);

  useEffect(() => {
    fetchForm();
  }, [fetchForm]);

  // Sync initial props if they change (e.g. URL param navigation)
  useEffect(() => {
    setSearch(initialSearch);
    setStatusFilter(initialStatus);
    setDateFilter(initialDate);
    setCurrentPage(parseInt(initialPage, 10) || 1);
  }, [initialSearch, initialStatus, initialDate, initialPage]);

  // ── URL sync ────────────────────────────────────────────────────────────────
  const updateParams = (updates: Record<string, string>) => {
    const nextParams = new URLSearchParams();
    const next = { search, status: statusFilter, date: dateFilter, page: String(updates.page ?? currentPage), ...updates };
    Object.entries(next).forEach(([key, value]) => {
      if (value && value !== 'All') nextParams.set(key, value);
    });
    const query = nextParams.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  // ── Filtered submissions ────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!formData) return [];
    // Backend already returns paginated and sorted data
    // Just filter by search/status/date on frontend (small dataset now)
    const result = formData.formSubmissions.filter((sub) => {
      const displayStatus = normalizeStatus(sub.overallStatus);
      const matchesSearch =
        sub.user.userName.toLowerCase().includes(search.toLowerCase()) ||
        sub.user.email.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'All' || displayStatus === statusFilter;
      const matchesDate = !dateFilter || formatDate(sub.createdAt) === dateFilter;
      return matchesSearch && matchesStatus && matchesDate;
    });
    return result;
  }, [formData, search, statusFilter, dateFilter]);

  // ── Export ──────────────────────────────────────────────────────────────────
  const handleExport = (format: string) => {
    if (!formData || filtered.length === 0) {
      toast.error('No data to export');
      return;
    }

    if (format === 'CSV' || format === 'Excel') {
      const rows = [
        ['ID', 'Student Name', 'Email', 'Status', 'Current Level', 'Date Submitted', 'Last Updated'],
        ...filtered.map(sub => [
          sub.id,
          sub.user.userName,
          sub.user.email,
          normalizeStatus(sub.overallStatus),
          String(sub.currentLevel),
          formatDate(sub.createdAt),
          formatDate(sub.updatedAt),
        ]),
      ];
      const csvContent = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${formData.name.replace(/\s+/g, '_')}_submissions.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${filtered.length} records as CSV`);
    } else if (format === 'PDF') {
      // Build a printable HTML page and trigger browser print-to-PDF
      const tableRows = filtered.map(sub => `
        <tr>
          <td>${sub.user.userName}</td>
          <td>${sub.user.email}</td>
          <td>${normalizeStatus(sub.overallStatus)}</td>
          <td>Level ${sub.currentLevel}</td>
          <td>${formatDate(sub.createdAt)}</td>
        </tr>
      `).join('');

      const html = `<!DOCTYPE html><html><head><title>${formData.name} — Submissions</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #1a1a1a; }
          h1 { font-size: 18px; margin-bottom: 4px; }
          p  { color: #666; font-size: 13px; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          th { background: #1E3A8A; color: white; padding: 8px 12px; text-align: left; }
          td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; }
          tr:nth-child(even) td { background: #f9fafb; }
        </style>
      </head><body>
        <h1>${formData.name} — Submissions Report</h1>
        <p>Total: ${filtered.length} records · Exported ${new Date().toLocaleDateString('en-IN')}</p>
        <table>
          <thead><tr><th>Student Name</th><th>Email</th><th>Status</th><th>Level</th><th>Date</th></tr></thead>
          <tbody>${tableRows}</tbody>
        </table>
      </body></html>`;

      const win = window.open('', '_blank');
      if (win) {
        win.document.write(html);
        win.document.close();
        win.focus();
        setTimeout(() => win.print(), 500);
      }
      toast.success(`Opening PDF print dialog for ${filtered.length} records`);
    }
  };

  // ── Loading state ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={28} className="animate-spin text-[#1E3A8A]" />
        <span className="ml-3 text-sm text-gray-500 dark:text-gray-400">Loading submissions…</span>
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────────
  if (error || !formData) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <AlertCircle size={32} className="text-red-400" />
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {error ?? 'Form not found.'}
        </p>
        <button
          onClick={fetchForm}
          className="px-4 py-2 text-xs font-semibold bg-[#1E3A8A] text-white rounded-lg hover:bg-[#1e3a8a]/90 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const hasActiveFilters = statusFilter !== 'All' || !!dateFilter || !!search;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
            All Submitted Forms
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {formData.name} — {formData._count.formSubmissions} total submission
            {formData._count.formSubmissions !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {['CSV', 'Excel', 'PDF'].map((format) => (
            <button
              key={format}
              onClick={() => handleExport(format)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Download size={12} /> {format}
            </button>
          ))}
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#1E3A8A] text-white rounded-lg flex items-center justify-center flex-shrink-0">
            <Eye size={15} />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1E3A8A] dark:text-blue-300">
              Filtered by: {formData.name}
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">
              Admins can only view, search, filter, and export. Detail pages use dummy frontend data.
            </p>
          </div>
        </div>
        {hasActiveFilters && (
          <button
            onClick={() => {
              setSearch('');
              setStatusFilter('All');
              setDateFilter('');
              router.replace(pathname);
            }}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-white text-[#1E3A8A] border border-blue-200 dark:bg-gray-900 dark:border-blue-800 dark:text-blue-300"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Filters */}
      <div
        className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800 flex flex-wrap gap-3 items-center"
        style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
      >
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by user or email…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
              updateParams({ search: e.target.value, page: '1' });
            }}
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 dark:text-white"
          />
        </div>

        <input
          type="date"
          value={dateFilter}
          onChange={(e) => {
            setDateFilter(e.target.value);
            setCurrentPage(1);
            updateParams({ date: e.target.value, page: '1' });
          }}
          className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 dark:text-white"
        />

        <div className="flex items-center gap-2">
          <Filter size={15} className="text-gray-400" />
          {['All', 'Approved', 'Pending', 'Rejected'].map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setCurrentPage(1);
                updateParams({ status, page: '1' });
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${statusFilter === status
                  ? 'bg-[#1E3A8A] text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div
        className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden"
        style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                {['User', 'Email', 'Date Submitted', 'Verifier Level', 'Status', 'Actions'].map((heading) => (
                  <th
                    key={heading}
                    className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filtered.map((sub) => {
                const displayStatus = normalizeStatus(sub.overallStatus);
                return (
                  <tr
                    key={sub.id}
                    className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    {/* User */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#1E3A8A] text-white text-xs font-semibold flex items-center justify-center">
                          {initials(sub.user.userName)}
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {sub.user.userName}
                        </span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 group">
                        <FileText size={13} className="text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {sub.user.email}
                        </span>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(sub.createdAt)}
                    </td>

                    {/* Verifier Level */}
                    <td className="px-6 py-4">
                      <span className="text-xs bg-blue-50 dark:bg-blue-900/30 text-[#1E3A8A] dark:text-blue-400 px-2.5 py-1 rounded-full font-medium">
                        Level {sub.currentLevel}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${statusBadge(displayStatus)}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${dotColor(displayStatus)}`} />
                        {displayStatus}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <Link
                        href={`/forms/all/${sub.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#1E3A8A] dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 rounded-lg transition-colors font-medium"
                      >
                        <Eye size={12} /> View Details
                      </Link>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    {filtered.length === 0 ? 'No submissions match your search criteria.' : 'No data to display.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {formData && formData._count.formSubmissions > ITEMS_PER_PAGE && (
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Showing <span className="font-semibold">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
              <span className="font-semibold">
                {Math.min(currentPage * ITEMS_PER_PAGE, formData._count.formSubmissions)}
              </span>{' '}
              of <span className="font-semibold">{formData._count.formSubmissions}</span> submissions
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const newPage = Math.max(1, currentPage - 1);
                  setCurrentPage(newPage);
                  updateParams({ page: String(newPage) });
                }}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ← Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.ceil(formData._count.formSubmissions / ITEMS_PER_PAGE) }, (_, i) => i + 1)
                  .slice(Math.max(0, currentPage - 3), currentPage + 2)
                  .map((page) => (
                    <button
                      key={page}
                      onClick={() => {
                        setCurrentPage(page);
                        updateParams({ page: String(page) });
                      }}
                      className={`w-7 h-7 text-xs font-medium rounded-lg transition-all ${
                        page === currentPage
                          ? 'bg-[#1E3A8A] text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
              </div>

              <button
                onClick={() => {
                  const totalPages = Math.ceil(formData._count.formSubmissions / ITEMS_PER_PAGE);
                  const newPage = Math.min(totalPages, currentPage + 1);
                  setCurrentPage(newPage);
                  updateParams({ page: String(newPage) });
                }}
                disabled={currentPage === Math.ceil(formData._count.formSubmissions / ITEMS_PER_PAGE)}
                className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}