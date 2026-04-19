'use client';
import { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useRouter } from 'next/navigation';
import {
  FileStack, CheckCircle, XCircle, Clock, AlertTriangle,
  TrendingUp, TrendingDown, Eye, ArrowRight, Loader2, RefreshCw,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import Link from 'next/link';
import { useRequireAuth } from '@/hooks/useRequireAuth';

interface Stats { allSubmissions: number; accepted: number; rejected: number; pending: number; expired: number; }
interface WeeklyPoint { day: string; submissions: number; accepted: number; rejected: number; }
interface RecentSub {
  id: string; studentName: string; email: string; formTitle: string; formId: number;
  submissionDate: string; status: string; currentLevel: number; totalLevels: number; myLevel: number | null;
}
interface DashboardData {
  verifier: { name: string; email: string; role: string; department: string };
  stats: Stats;
  weeklyData: WeeklyPoint[];
  recentSubmissions: RecentSub[];
}

const STATUS_COLORS: Record<string, string> = {
  Accepted: '#22C55E', Pending: '#F59E0B', Rejected: '#EF4444', Expired: '#94A3B8', 'Sent Back': '#F97316',
};

export default function DashboardPage() {
  const router = useRouter();
  const { isLoading: authLoading, currentUser } = useRequireAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const res = await fetch('/api/verifier/dashboard');
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const json = await res.json();
      setData(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (!authLoading) fetchDashboard(); }, [authLoading, fetchDashboard]);

  const navigateToVerifierPath = useCallback((path: string) => {
    router.push(path);
  }, [router]);

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={32} className="animate-spin text-[#1E3A8A]" />
        <p className="text-sm text-gray-500">Loading dashboard...</p>
      </div>
    </div>
  );

  const stats = data?.stats ?? { allSubmissions: 0, accepted: 0, rejected: 0, pending: 0, expired: 0 };

  const statCards = [
    { label: 'All Submissions', value: stats.allSubmissions, icon: FileStack,     color: '#3B82F6', bg: 'linear-gradient(135deg,#EFF6FF,#DBEAFE)', href: '/all-submissions',                 trend: null },
    { label: 'Accepted',        value: stats.accepted,       icon: CheckCircle,   color: '#22C55E', bg: 'linear-gradient(135deg,#F0FDF4,#DCFCE7)', href: '/all-submissions?status=Accepted', trend: null },
    { label: 'Rejected',        value: stats.rejected,       icon: XCircle,       color: '#EF4444', bg: 'linear-gradient(135deg,#FFF5F5,#FEE2E2)', href: '/all-submissions?status=Rejected', trend: null },
    { label: 'Pending',         value: stats.pending,        icon: Clock,         color: '#F59E0B', bg: 'linear-gradient(135deg,#FFFBEB,#FEF3C7)', href: '/pending-approvals',               trend: null },
    { label: 'Expired',         value: stats.expired,        icon: AlertTriangle, color: '#94A3B8', bg: 'linear-gradient(135deg,#F8FAFC,#F1F5F9)', href: '/all-submissions?status=Expired',  trend: null },
  ];

  const pieData = [
    { name: 'Accepted', value: stats.accepted, color: '#22C55E' },
    { name: 'Pending',  value: stats.pending,  color: '#F59E0B' },
    { name: 'Rejected', value: stats.rejected, color: '#EF4444' },
    { name: 'Expired',  value: stats.expired,  color: '#94A3B8' },
  ].filter(d => d.value > 0);

  const verifierName = data?.verifier.name ?? currentUser?.name ?? 'Verifier';

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
            Welcome back, <span className="gradient-text">{verifierName.split(' ')[0]}</span> 👋
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {data?.verifier.role} · {data?.verifier.department}
          </p>
        </div>
        <button onClick={fetchDashboard} disabled={loading}
          className="btn-outline flex items-center gap-1.5 text-sm">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl text-sm text-red-600" style={{ background: '#FFF5F5', border: '1px solid #FCA5A5' }}>
          {error}
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {statCards.map(({ label, value, icon: Icon, color, bg, href }) => (
          <div key={label} className="stat-card group cursor-pointer" onClick={() => navigateToVerifierPath(href)}>
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-3" style={{ background: bg }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div className="text-3xl font-bold mb-1" style={{ color: 'var(--text)' }}>
              {loading ? <span className="inline-block w-8 h-7 rounded bg-gray-200 animate-pulse" /> : value}
            </div>
            <div className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</div>
            <div className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: color }} />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Line Chart */}
        <div className="chart-wrapper lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-base" style={{ color: 'var(--text)' }}>Weekly Submissions</h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Last 7 days activity</p>
            </div>
            <div className="flex gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded inline-block" style={{ background: '#3B82F6' }} />Submitted</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded inline-block" style={{ background: '#22C55E' }} />Accepted</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded inline-block" style={{ background: '#EF4444' }} />Rejected</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data?.weeklyData ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 13 }} />
              <Line type="monotone" dataKey="submissions" stroke="#3B82F6" strokeWidth={2.5} dot={{ fill: '#3B82F6', r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="accepted"    stroke="#22C55E" strokeWidth={2.5} dot={{ fill: '#22C55E', r: 4 }} />
              <Line type="monotone" dataKey="rejected"    stroke="#EF4444" strokeWidth={2.5} dot={{ fill: '#EF4444', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="chart-wrapper">
          <div className="mb-5">
            <h3 className="font-bold text-base" style={{ color: 'var(--text)' }}>Status Breakdown</h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Overall distribution</p>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 13 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {pieData.map(d => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{d.name}</span>
                <span className="text-xs font-semibold ml-auto" style={{ color: 'var(--text)' }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Submissions */}
      <div className="content-card">
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div>
            <h3 className="font-bold text-base" style={{ color: 'var(--text)' }}>Recent Submissions</h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Latest form submissions assigned to you</p>
          </div>
          <Link href="/all-submissions" className="flex items-center gap-1.5 text-sm font-semibold transition-colors" style={{ color: '#3B82F6' }}>
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--text-muted)' }} />
            </div>
          ) : !data?.recentSubmissions.length ? (
            <div className="text-center py-12">
              <FileStack className="w-10 h-10 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No submissions yet</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Form Name</th>
                  <th>Submitted</th>
                  <th>Level</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.recentSubmissions.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ background: `hsl(${s.studentName.charCodeAt(0) * 7},60%,50%)` }}>
                          {s.studentName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{s.studentName}</p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td><span className="font-medium text-sm" style={{ color: 'var(--text)' }}>{s.formTitle}</span></td>
                    <td className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {new Date(s.submissionDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>L{s.currentLevel}</span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>/ {s.totalLevels}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${s.status.toLowerCase().replace(' ','-')}`}
                        style={{ background: (STATUS_COLORS[s.status] ?? '#94A3B8') + '20', color: STATUS_COLORS[s.status] ?? '#94A3B8', border: `1px solid ${STATUS_COLORS[s.status] ?? '#94A3B8'}40` }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'currentColor' }} />
                        {s.status}
                      </span>
                    </td>
                    <td>
                      <Link href={`/form-details/${s.id}`} className="flex items-center gap-1.5 text-sm font-semibold transition-colors" style={{ color: '#3B82F6', textDecoration: 'none' }}>
                        <Eye className="w-3.5 h-3.5" /> View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
