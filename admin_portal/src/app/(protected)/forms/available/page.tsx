'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Search, Filter, MoreVertical, Plus, Edit2, Trash2,
  ToggleLeft, ToggleRight, Eye, Loader2, ChevronLeft, ChevronRight, AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Form {
  id:          number;
  title:       string;
  description: string;
  deadline:    string;
  formStatus:  boolean;
  createdAt:   string;
  updatedAt:   string;
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

const LIMIT = 10;

// ─── Component ────────────────────────────────────────────────────────────────

export default function AvailableFormsPage() {

  // ── Data state ─────────────────────────────────────────────────────
  const [forms,   setForms]   = useState<Form[]>([]);
  const [meta,    setMeta]    = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  // ── UI state ───────────────────────────────────────────────────────
  const [search,        setSearch]        = useState('');
  const [statusFilter,  setStatusFilter]  = useState<'All' | 'Active' | 'Draft'>('All');
  const [page,          setPage]          = useState(1);
  const [openMenu,      setOpenMenu]      = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [deleting,      setDeleting]      = useState(false);
  const [togglingId,    setTogglingId]    = useState<number | null>(null);

  // ── Fetch forms ────────────────────────────────────────────────────
  const fetchForms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page',  String(page));
      params.set('limit', String(LIMIT));
      if (statusFilter !== 'All') params.set('formStatus', statusFilter === 'Active' ? 'true' : 'false');
      if (search) params.set('search', search);

      const { data } = await axios.get(`/api/form/getAllForms?${params.toString()}`);
      console.log(data.data)
      setForms(data.data);
      setMeta(data.meta);
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message ?? err.message
        : 'Failed to load forms';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => { fetchForms(); }, [fetchForms]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  // ── Client-side search filter (over current page) ──────────────────
  const filtered = useMemo(() => {
    if (!search.trim()) return forms;
    const q = search.toLowerCase();
    return forms.filter((f) => f.title.toLowerCase().includes(q));
  }, [forms, search]);

  // ── Toggle form status ─────────────────────────────────────────────
  const toggleStatus = async (form: Form) => {
    setOpenMenu(null);
    setTogglingId(form.id);
    try {
      await axios.patch(`/api/forms/${form.id}`, { formStatus: !form.formStatus });
      toast.success(`Form ${form.formStatus ? 'deactivated' : 'activated'} successfully`);
      setForms((prev) =>
        prev.map((f) => f.id === form.id ? { ...f, formStatus: !f.formStatus } : f)
      );
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message ?? err.message
        : 'Failed to update form status';
      toast.error(msg);
    } finally {
      setTogglingId(null);
    }
  };

  // ── Delete form ────────────────────────────────────────────────────
  const deleteForm = async (id: number) => {
    setDeleting(true);
    try {
      await axios.delete(`/api/forms/${id}`);
      toast.success('Form deleted successfully');
      setDeleteConfirm(null);
      setOpenMenu(null);
      fetchForms();
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message ?? err.message
        : 'Failed to delete form';
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  // ── Pagination page numbers ────────────────────────────────────────
  const pageNumbers = useMemo(() => {
    if (!meta) return [];
    const start = Math.max(1, page - 2);
    return Array.from(
      { length: Math.min(5, meta.totalPages - start + 1) },
      (_, i) => start + i
    );
  }, [meta, page]);

  const deletingForm = forms.find((f) => f.id === deleteConfirm);

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Available Forms
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {loading ? 'Loading forms...' : error ? 'Failed to load forms' : `${meta?.total ?? 0} forms total`}
          </p>
        </div>
        <Link
          href="/forms/create"
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1E3A8A] text-white text-sm font-semibold rounded-xl hover:bg-[#1e3a8a]/90 transition-all shadow-lg shadow-blue-900/20"
        >
          <Plus size={16} /> Create New Form
        </Link>
      </div>

      {/* ── Error banner ── */}
      {error && !loading && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800 dark:text-red-300">Failed to fetch forms</p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{error}</p>
          </div>
          <button
            onClick={fetchForms}
            className="ml-auto text-xs font-medium text-red-700 dark:text-red-300 hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Filters ── */}
      <div
        className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800 flex flex-wrap gap-3 items-center"
        style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
      >
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search forms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 dark:text-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-gray-400" />
          {(['All', 'Active', 'Draft'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                statusFilter === s
                  ? 'bg-[#1E3A8A] text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {s}
            </button>
          ))}
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
                {['Form Name', 'Created Date', 'Status', 'Deadline', 'Submissions', 'Actions'].map((h) => (
                  <th key={h} className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>

              {/* Loading skeleton */}
              {loading && Array.from({ length: LIMIT }).map((_, i) => (
                <tr key={i} className="border-b border-gray-50 dark:border-gray-800">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
                      <div className="h-3 w-36 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </div>
                  </td>
                  {[1, 2, 3, 4, 5].map((j) => (
                    <td key={j} className="px-6 py-4">
                      <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))}

              {/* Data rows */}
              {!loading && !error && filtered.map((form) => (
                <tr
                  key={form.id}
                  className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  {/* Form name */}
                  <td className="px-6 py-4">
                    <Link href={`/forms/available/${form.id}`} className="flex items-center gap-3 group">
                      <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/30 text-[#1E3A8A] dark:text-blue-400 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                        <Eye size={14} />
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-[#1E3A8A] dark:group-hover:text-blue-300 transition-colors">
                        {form.title}
                      </span>
                    </Link>
                  </td>

                  {/* Created date */}
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(form.createdAt)}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    {togglingId === form.id ? (
                      <Loader2 size={14} className="animate-spin text-gray-400" />
                    ) : (
                      <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${
                        form.formStatus
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${form.formStatus ? 'bg-green-500' : 'bg-gray-400'}`} />
                        {form.formStatus ? 'Active' : 'Draft'}
                      </span>
                    )}
                  </td>

                  {/* Deadline */}
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(form.deadline)}
                  </td>

                  {/* Submissions */}
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {form._count.formSubmissions}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">submissions</span>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenu(openMenu === form.id ? null : form.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-white transition-colors"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {openMenu === form.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                          <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-20 overflow-hidden py-1">
                            <Link
                              href={`/forms/available/${form.id}/edit`}
                              onClick={() => setOpenMenu(null)}
                              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                            >
                              <Edit2 size={14} /> Edit
                            </Link>
                            <button
                              onClick={() => toggleStatus(form)}
                              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                            >
                              {form.formStatus
                                ? <><ToggleLeft size={14} /> Deactivate</>
                                : <><ToggleRight size={14} className="text-green-500" /> Activate</>}
                            </button>
                            <div className="h-px bg-gray-100 dark:bg-gray-700 my-1" />
                            <button
                              onClick={() => { setDeleteConfirm(form.id); setOpenMenu(null); }}
                              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {/* Empty state */}
              {!loading && !error && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    {search || statusFilter !== 'All'
                      ? 'No forms match your filters'
                      : 'No forms found — create your first form'}
                  </td>
                </tr>
              )}

              {/* Error state */}
              {!loading && error && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    Could not load forms. Please retry.
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
                Showing <span className="font-medium">{filtered.length}</span> of{' '}
                <span className="font-medium">{meta?.total ?? 0}</span> forms
                {meta && ` — page ${meta.page} of ${meta.totalPages}`}
              </>
            )}
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={!meta?.hasPrevPage || loading}
              className="w-7 h-7 flex items-center justify-center text-xs rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={14} />
            </button>

            {pageNumbers.map((p) => (
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
              onClick={() => setPage((p) => p + 1)}
              disabled={!meta?.hasNextPage || loading}
              className="w-7 h-7 flex items-center justify-center text-xs rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Delete confirmation modal ── */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backdropFilter: 'blur(4px)', background: 'rgba(0,0,0,0.4)' }}
        >
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center mb-4">
              <Trash2 size={22} className="text-red-500" />
            </div>
            <h3 className="text-gray-900 dark:text-white mb-2">Delete Form</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              Are you sure you want to delete{' '}
              <strong className="text-gray-700 dark:text-gray-200">"{deletingForm?.title}"</strong>?
              This will permanently remove all associated submissions and verification records.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteForm(deleteConfirm)}
                disabled={deleting}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {deleting
                  ? <><Loader2 size={14} className="animate-spin" /> Deleting...</>
                  : 'Delete Form'
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}