'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { Search, Mail, Trash2, Edit2, UserPlus, X, Send, Check, Eye, RefreshCw, AlertCircle, Phone } from 'lucide-react';
import { toast } from 'sonner';

// ── Types ─────────────────────────────────────────────────────────────────────

type Role = 'Admin' | 'HOD' | 'Caretaker' | 'Dean' | 'Faculty';

interface Verifier {
  id: string;
  userName: string;
  email: string;
  role: Role;
  department: string;
  mobileNo: string;
  createdAt: string;
  updatedAt: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ALL_ROLES: Role[] = ['Admin', 'HOD', 'Caretaker', 'Dean', 'Faculty'];

const ROLE_STYLES: Record<Role, { pill: string; icon: string }> = {
  Admin:     { pill: 'bg-red-100    dark:bg-red-900/30    text-red-700    dark:text-red-400',    icon: '🛡️' },
  HOD:       { pill: 'bg-blue-100   dark:bg-blue-900/30   text-blue-700   dark:text-blue-400',   icon: '👑' },
  Dean:      { pill: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400', icon: '🎓' },
  Caretaker: { pill: 'bg-teal-100   dark:bg-teal-900/30   text-teal-700   dark:text-teal-400',   icon: '🔧' },
  Faculty:   { pill: 'bg-amber-100  dark:bg-amber-900/30  text-amber-700  dark:text-amber-400',  icon: '📚' },
};

const fallbackPill = 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300';

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

const initials = (name: string) =>
  name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

const avatarHue = (name: string) =>
  `hsl(${(name.charCodeAt(0) * 13) % 360}, 55%, 35%)`;

// ── Email Modal ───────────────────────────────────────────────────────────────

interface EmailModalProps {
  recipients: Verifier[];
  onClose: () => void;
}

function EmailModal({ recipients, onClose }: EmailModalProps) {
  const [subject, setSubject] = useState('');
  const [body, setBody]       = useState('');

  const handleSend = () => {
    if (!subject.trim() || !body.trim()) {
      toast.error('Subject and message body are required');
      return;
    }
    const to = recipients.map((r) => r.email).join(',');
    const mailtoLink = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink, '_blank');
    toast.success(`Opening mail client for ${recipients.length} recipient(s)`);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: 'blur(6px)', background: 'rgba(0,0,0,0.4)' }}
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#1E3A8A] rounded-lg flex items-center justify-center">
              <Mail size={15} className="text-white" />
            </div>
            <div>
              <h3 className="text-gray-900 dark:text-white text-sm font-semibold">Compose Email</h3>
              <p className="text-gray-400 dark:text-gray-500 text-xs">{recipients.length} recipient(s)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* To */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">To</label>
            <div className="flex flex-wrap gap-1.5 p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl min-h-10">
              {recipients.map((r) => (
                <span
                  key={r.id}
                  className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-[#1E3A8A] dark:text-blue-400 text-xs px-2.5 py-1 rounded-full"
                  title={r.email}
                >
                  {r.userName}
                </span>
              ))}
            </div>
            {/* Show actual emails as a subtle hint */}
            <p className="text-xs text-gray-400 mt-1 truncate">
              {recipients.map((r) => r.email).join(', ')}
            </p>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Subject *</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject..."
              className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 bg-gray-50 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Message *</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Type your message here..."
              className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 bg-gray-50 dark:bg-gray-800 dark:text-white resize-none h-32"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 pt-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-white text-sm font-semibold rounded-xl transition-all bg-[#1E3A8A] hover:bg-[#1e3a8a]/90"
          >
            <Send size={14} /> Open in Mail Client
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirm Modal ──────────────────────────────────────────────────────

interface DeleteModalProps {
  member: Verifier;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteModal({ member, onConfirm, onCancel }: DeleteModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: 'blur(4px)', background: 'rgba(0,0,0,0.4)' }}
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center mb-4">
          <Trash2 size={22} className="text-red-500" />
        </div>
        <h3 className="text-gray-900 dark:text-white font-semibold mb-2">Remove Member</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
          Are you sure you want to remove <strong>{member.userName}</strong> from the system?
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AllMembersPage() {
  const [members, setMembers]             = useState<Verifier[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [search, setSearch]               = useState('');
  const [roleFilter, setRoleFilter]       = useState('All');
  const [selected, setSelected]           = useState<Set<string>>(new Set());
  const [emailRecipients, setEmailRecipients] = useState<Verifier[] | null>(null);
  const [deleteTarget, setDeleteTarget]   = useState<Verifier | null>(null);

  // ── Fetch ───────────────────────────────────────────────────────────────────

  const fetchMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get('/api/admin/getAllMembers');
      setMembers(data.data);
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : 'An unexpected error occurred';
      setError(message);
      toast.error(`Failed to load members: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMembers(); }, []);

  // ── Derived ─────────────────────────────────────────────────────────────────

  const filtered = members.filter((m) => {
    const matchSearch =
      m.userName.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      m.department.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'All' || m.role === roleFilter;
    return matchSearch && matchRole;
  });

  // ── Selection ───────────────────────────────────────────────────────────────

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(
      selected.size === filtered.length && filtered.length > 0
        ? new Set()
        : new Set(filtered.map((m) => m.id))
    );
  };

  // ── Actions ─────────────────────────────────────────────────────────────────

  const handleBulkEmail = () =>
    setEmailRecipients(members.filter((m) => selected.has(m.id)));

  const handleSingleEmail = (member: Verifier) =>
    setEmailRecipients([member]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await axios.delete(`/api/admin/deleteMember/${deleteTarget.id}`);
      setMembers((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      setSelected((prev) => { const next = new Set(prev); next.delete(deleteTarget.id); return next; });
      toast.success(`${deleteTarget.userName} removed successfully`);
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : 'Failed to delete member';
      toast.error(message);
    } finally {
      setDeleteTarget(null);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
            All Members
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {loading ? 'Loading...' : error ? 'Failed to load' : `${members.length} staff members`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchMembers}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <Link
            href="/members/add"
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1E3A8A] text-white text-sm font-semibold rounded-xl hover:bg-[#1e3a8a]/90 transition-all shadow-lg shadow-blue-900/20"
          >
            <UserPlus size={16} /> Add Member
          </Link>
        </div>
      </div>

      {/* Error banner */}
      {error && !loading && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800 dark:text-red-300">Failed to fetch members</p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{error}</p>
          </div>
          <button onClick={fetchMembers} className="ml-auto text-xs font-medium text-red-700 dark:text-red-300 hover:underline">
            Retry
          </button>
        </div>
      )}

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="bg-[#1E3A8A] text-white rounded-xl px-5 py-3 flex items-center justify-between">
          <p className="text-sm font-medium">{selected.size} member(s) selected</p>
          <div className="flex items-center gap-3">
            <button
              onClick={handleBulkEmail}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <Mail size={13} /> Send Email to Selected
            </button>
            <button onClick={() => setSelected(new Set())} className="p-1 hover:bg-white/20 rounded transition-colors">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div
        className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800 flex flex-wrap gap-3 items-center"
        style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
      >
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 dark:text-white"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {(['All', ...ALL_ROLES] as const).map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                roleFilter === role
                  ? 'bg-[#1E3A8A] text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {role !== 'All' && <span className="mr-1">{ROLE_STYLES[role].icon}</span>}
              {role}
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
                <th className="px-6 py-3.5 w-12">
                  <input
                    type="checkbox"
                    checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={toggleAll}
                    className="w-4 h-4 text-[#1E3A8A] rounded border-gray-300 cursor-pointer"
                  />
                </th>
                {['Name', 'Role', 'Department', 'Mobile',  'Actions'].map((h) => (
                  <th key={h} className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Loading skeleton */}
              {loading && Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-50 dark:border-gray-800">
                  <td className="px-6 py-4 w-12">
                    <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                      <div className="space-y-1.5">
                        <div className="h-3 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        <div className="h-2.5 w-20 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                      </div>
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
              {!loading && !error && filtered.map((member) => {
                const roleStyle = ROLE_STYLES[member.role];
                return (
                  <tr
                    key={member.id}
                    className={`border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors ${
                      selected.has(member.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="px-6 py-4 w-12">
                      <input
                        type="checkbox"
                        checked={selected.has(member.id)}
                        onChange={() => toggleSelect(member.id)}
                        className="w-4 h-4 text-[#1E3A8A] rounded border-gray-300 cursor-pointer"
                      />
                    </td>

                    {/* Name */}
                    <td className="px-6 py-4">
                      <Link href={`/members/all/${member.id}`} className="flex items-center gap-3 group">
                        <div
                          className="w-9 h-9 rounded-full text-white text-sm font-semibold flex items-center justify-center flex-shrink-0"
                          style={{ background: avatarHue(member.userName) }}
                        >
                          {initials(member.userName)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-[#1E3A8A] dark:group-hover:text-blue-300 transition-colors">
                            {member.userName}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">{member.email}</p>
                        </div>
                      </Link>
                    </td>

                    {/* Role */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${roleStyle?.pill ?? fallbackPill}`}>
                        {roleStyle?.icon && <span>{roleStyle.icon}</span>}
                        {member.role}
                      </span>
                    </td>

                    {/* Department */}
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-48 truncate">
                      {member.department}
                    </td>

                    {/* Mobile */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Phone size={12} className="text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-500 dark:text-gray-400">{member.mobileNo}</span>
                      </div>
                    </td>

                    {/* Joined */}
                    {/* <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(member.createdAt)}
                    </td> */}

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/members/all/${member.id}`}
                          className="p-1.5 text-[#1E3A8A] dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
                          title="View profile"
                        >
                          <Eye size={14} />
                        </Link>
                        <button
                          onClick={() => handleSingleEmail(member)}
                          className="p-1.5 text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-900/30 hover:bg-teal-100 dark:hover:bg-teal-900/50 rounded-lg transition-colors"
                          title={`Email ${member.userName}`}
                        >
                          <Mail size={14} />
                        </button>
                        {/* <Link
                          href={`/members/all/${member.id}/edit`}
                          className="p-1.5 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </Link> */}
                        <button
                          onClick={() => setDeleteTarget(member)}
                          className="p-1.5 text-red-500 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* Empty state */}
              {!loading && !error && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    {members.length === 0 ? 'No members found in the database' : 'No members match your search'}
                  </td>
                </tr>
              )}

              {/* Error empty state */}
              {!loading && error && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    Could not load members. Please retry.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {loading ? 'Loading...' : (
              <>
                Showing <span className="font-medium">{filtered.length}</span> of{' '}
                <span className="font-medium">{members.length}</span> members
              </>
            )}
          </p>
        </div>
      </div>

      {/* Modals */}
      {emailRecipients && (
        <EmailModal recipients={emailRecipients} onClose={() => setEmailRecipients(null)} />
      )}

      {deleteTarget && (
        <DeleteModal
          member={deleteTarget}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}