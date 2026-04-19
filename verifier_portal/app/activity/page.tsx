'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import {
  CheckCircle, XCircle, FileText, CornerDownLeft,
  Clock, RefreshCw, Activity, Loader2, AlertTriangle,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type ActivityType = 'approved' | 'rejected' | 'submitted' | 'sent-back' | 'other';

interface ActivityItem {
  id: string;
  type: ActivityType;
  icon: string;
  message: string;
  action: string;
  actor: {
    id: string | null;
    name: string;
    role: string | null;
  };
  formId: number | null;
  formTitle: string | null;
  submissionId: string | null;
  time: string;
}

interface Stats {
  totalActions: number;
  approvals: number;
  rejections: number;
  sentBacks: number;
}

// ─── Icon / label maps ────────────────────────────────────────────────────────

const iconMap: Record<string, { icon: React.ElementType; bg: string; color: string }> = {
  check:   { icon: CheckCircle,   bg: '#F0FDF4', color: '#22C55E' },
  x:       { icon: XCircle,       bg: '#FFF5F5', color: '#EF4444' },
  file:    { icon: FileText,       bg: '#EFF6FF', color: '#3B82F6' },
  refresh: { icon: CornerDownLeft, bg: '#FFFBEB', color: '#F59E0B' },
  clock:   { icon: Clock,          bg: 'var(--bg)', color: '#94A3B8' },
};

const typeLabels: Record<string, { label: string; cls: string }> = {
  approved:   { label: 'Approved',   cls: 'badge-accepted' },
  rejected:   { label: 'Rejected',   cls: 'badge-rejected' },
  submitted:  { label: 'Submitted',  cls: 'badge' },
  'sent-back':{ label: 'Sent Back',  cls: 'badge-pending' },
  other:      { label: 'Action',     cls: 'badge' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1)   return 'Just now';
  if (diffMins < 60)  return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ActivityPage() {
  const router = useRouter();

  const [activity, setActivity]     = useState<ActivityItem[]>([]);
  const [stats, setStats]           = useState<Stats | null>(null);
  const [loading, setLoading]       = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchActivity = useCallback(async (cursor?: string) => {
    try {
      cursor ? setLoadingMore(true) : setLoading(true);
      setError(null);

      const params = new URLSearchParams({ limit: '50' });
      if (cursor) params.set('cursor', cursor);

      const res = await fetch(`/api/verifier/activity?${params.toString()}`);
      if (res.status === 401) { router.push('/login'); return; }
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Failed to load activity');
      }

      const json = await res.json();

      setActivity(prev => cursor ? [...prev, ...json.activity] : json.activity);
      setStats(json.stats);
      setNextCursor(json.nextCursor);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [router]);

  useEffect(() => { fetchActivity(); }, [fetchActivity]);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--text-muted)' }} />
          <span className="ml-2 text-sm" style={{ color: 'var(--text-muted)' }}>Loading activity...</span>
        </div>
      </DashboardLayout>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <AlertTriangle className="w-8 h-8 text-red-400" />
          <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{error}</p>
          <button onClick={() => fetchActivity()} className="btn-outline text-sm">Retry</button>
        </div>
      </DashboardLayout>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Activity Log</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Recent verification activity across all your assigned forms
        </p>
      </div>

      {/* Stats strip */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Actions', val: stats.totalActions, color: '#3B82F6', bg: '#EFF6FF' },
            { label: 'Approvals',     val: stats.approvals,    color: '#22C55E', bg: '#F0FDF4' },
            { label: 'Rejections',    val: stats.rejections,   color: '#EF4444', bg: '#FFF5F5' },
            { label: 'Sent Back',     val: stats.sentBacks,    color: '#F59E0B', bg: '#FFFBEB' },
          ].map(({ label, val, color, bg }) => (
            <div key={label} className="content-card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                <Activity className="w-5 h-5" style={{ color }} />
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ color }}>{val}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Timeline */}
      <div className="content-card p-6">
        <h3 className="font-bold text-base mb-6 flex items-center gap-2" style={{ color: 'var(--text)' }}>
          <RefreshCw style={{ width: 18, height: 18, color: '#3B82F6' }} />
          Recent Activity
        </h3>

        {activity.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Activity className="w-10 h-10" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>No activity yet</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Actions you take on submissions will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {activity.map((item, i) => {
              const { icon: Icon, bg, color } = iconMap[item.icon] ?? iconMap.clock;
              const typeInfo = typeLabels[item.type] ?? typeLabels.other;
              const isLast = i === activity.length - 1 && !nextCursor;

              return (
                <div key={item.id} className="flex gap-4">
                  {/* Icon + connector */}
                  <div className="flex flex-col items-center">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm"
                      style={{ background: bg, border: `1.5px solid ${color}30` }}
                    >
                      <Icon className="w-4 h-4" style={{ color }} />
                    </div>
                    {!isLast && (
                      <div
                        className="w-0.5 flex-1 my-1"
                        style={{ background: 'var(--border)', minHeight: 24 }}
                      />
                    )}
                  </div>

                  {/* Content card */}
                  <div className={`flex-1 pb-5 ${isLast ? 'pb-0' : ''}`}>
                    <div
                      className="rounded-xl p-4 transition-all"
                      style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = color + '60'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}
                    >
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <p className="text-sm font-medium flex-1" style={{ color: 'var(--text)' }}>
                          {item.message}
                        </p>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`badge ${typeInfo.cls}`} style={{ fontSize: 11 }}>
                            {typeInfo.label}
                          </span>
                        </div>
                      </div>

                      {/* Meta row */}
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <p className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                          <Clock className="w-3 h-3" />
                          {formatTime(item.time)}
                        </p>
                        {item.actor.role && (
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            · {item.actor.name} ({item.actor.role})
                          </span>
                        )}
                        {item.submissionId && item.type !== 'sent-back' && (
                          <Link
                            href={`/form-details/${item.submissionId}`}
                            className="text-xs font-semibold"
                            style={{ color: '#3B82F6', textDecoration: 'none' }}
                          >
                            View submission →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Load more */}
        {nextCursor && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => fetchActivity(nextCursor)}
              disabled={loadingMore}
              className="btn-outline flex items-center gap-2"
            >
              {loadingMore
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <RefreshCw className="w-4 h-4" />}
              Load more
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
