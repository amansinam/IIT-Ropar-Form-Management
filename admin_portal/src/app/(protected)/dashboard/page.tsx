'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Loader2, RefreshCw } from 'lucide-react';
import styles from '@/styles/DashboardPage.module.css';
import {
  Users, FileText, Send, Clock, CheckCircle, XCircle,
  TrendingUp, TrendingDown, ArrowUpRight,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useApp } from '@/context/AppContext';

interface DashboardStats {
  totalUsers: number; totalForms: number; totalSubmissions: number;
  pending: number; approved: number; rejected: number; sentBack: number;
}
interface RecentSubmission {
  id: string; userName: string; userEmail: string; formTitle: string;
  formId: number; status: string; currentLevel: number; createdAt: string;
}
interface WeeklyPoint { day: string; submissions: number; }
interface RecentForm { id: number; title: string; status: boolean; deadline: string; submissionsCount: number; createdAt: string; }

interface DashboardData {
  stats: DashboardStats;
  recentSubmissions: RecentSubmission[];
  weeklyData: WeeklyPoint[];
  recentForms: RecentForm[];
}

const STATUS_BADGE_CLASS: Record<string, string> = {
  Approved: styles.statusApproved,
  Pending: styles.statusPending,
  Rejected: styles.statusRejected,
  SentBack: styles.statusPending,
};

const PIE_COLORS = ['#22C55E', '#F59E0B', '#EF4444', '#F97316'];

export default function DashboardPage() {
  const { isLoading: authLoading } = useRequireAuth();
  const { currentUser } = useApp();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const res = await fetch('/api/admin/dashboard');
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const json = await res.json();
      setData(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (!authLoading) fetchDashboard(); }, [authLoading, fetchDashboard]);

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <Loader2 size={32} className="animate-spin text-[#1E3A8A]" />
    </div>
  );

  const stats = data?.stats;

  const statCards = [
    { label: 'Total Users',          value: stats?.totalUsers ?? 0,        trend: null, trendUp: true,  icon: <Users size={22} />,       color: '#1E3A8A', bg: '#EFF6FF', href: '/users' },
    { label: 'Total Forms Created',  value: stats?.totalForms ?? 0,        trend: null, trendUp: true,  icon: <FileText size={22} />,    color: '#7C3AED', bg: '#F5F3FF', href: '/forms/available' },
    { label: 'Total Submitted',      value: stats?.totalSubmissions ?? 0,  trend: null, trendUp: true,  icon: <Send size={22} />,        color: '#0891B2', bg: '#ECFEFF', href: '/forms/all' },
    { label: 'Pending Verification', value: stats?.pending ?? 0,           trend: null, trendUp: false, icon: <Clock size={22} />,       color: '#D97706', bg: '#FFFBEB', href: '/forms/all?status=Pending' },
    { label: 'Approved Forms',       value: stats?.approved ?? 0,          trend: null, trendUp: true,  icon: <CheckCircle size={22} />, color: '#16A34A', bg: '#F0FDF4', href: '/forms/all?status=Approved' },
    { label: 'Rejected Forms',       value: stats?.rejected ?? 0,          trend: null, trendUp: false, icon: <XCircle size={22} />,     color: '#DC2626', bg: '#FFF1F2', href: '/forms/all?status=Rejected' },
  ];

  const pieData = [
    { name: 'Approved', value: stats?.approved ?? 0 },
    { name: 'Pending',  value: stats?.pending ?? 0 },
    { name: 'Rejected', value: stats?.rejected ?? 0 },
    { name: 'Sent Back',value: stats?.sentBack ?? 0 },
  ].filter(d => d.value > 0);

  const total = stats?.totalSubmissions ?? 0;
  const chartStatusData = pieData.map((d, i) => ({
    name: d.name,
    value: total > 0 ? Math.round((d.value / total) * 100) : 0,
    color: PIE_COLORS[i],
  }));

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className={styles.dashboardWrapper}>
      <div className={styles.pageHeader}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className={styles.pageTitle}>Dashboard</h1>
            <p className={styles.pageSubtitle}>
              Welcome back, {currentUser?.name ?? 'Admin'}. Here are the latest stats.
            </p>
          </div>
          <button
            onClick={fetchDashboard}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}
      </div>

      {/* Stat cards */}
      <div className={styles.statsGrid}>
        {statCards.map((card) => (
          <Link key={card.label} href={card.href} className={`${styles.statCard} ${styles.statCardLink}`}>
            <div className={styles.statTop}>
              <div className={styles.iconBox} style={{ backgroundColor: card.bg, color: card.color }}>
                {card.icon}
              </div>
              <div className={`${styles.trend} ${card.trendUp ? styles.trendUp : styles.trendDown}`}>
                {card.trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              </div>
            </div>
            <p className={styles.statValue}>
              {loading ? <span className="inline-block w-10 h-8 rounded bg-gray-200 animate-pulse" /> : card.value}
            </p>
            <p className={styles.statLabel}>{card.label}</p>
          </Link>
        ))}
      </div>

      <div className={styles.chartGrid}>
        {/* Line chart */}
        <div className={styles.chartCardLarge}>
          <div className={styles.chartHeader}>
            <div>
              <h3 className={styles.chartTitle}>Weekly Form Submissions</h3>
              <p className={styles.chartSubtitle}>Last 7 days activity</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data?.weeklyData ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="submissions" stroke="#4F46E5" strokeWidth={3} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Verification Status</h3>
            <p className={styles.chartSubtitle}>Distribution overview</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={chartStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                {chartStatusData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(val) => `${val}%`} />
            </PieChart>
          </ResponsiveContainer>
          <div className={styles.statusList}>
            {chartStatusData.map((item) => (
              <div key={item.name} className={styles.statusRow}>
                <div className={styles.statusLeft}>
                  <span className={styles.statusDot} style={{ backgroundColor: item.color }} />
                  <span>{item.name}</span>
                </div>
                <span className={styles.statusValue}>{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent submissions table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <div>
            <h3 className={styles.chartTitle}>Recent Submissions</h3>
            <p className={styles.chartSubtitle}>Latest form activities</p>
          </div>
          <Link href="/forms/all" className={styles.viewAllBtn}>
            View All <ArrowUpRight size={14} />
          </Link>
        </div>

        <div className={styles.tableWrapper}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-gray-400" />
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  {['User', 'Form', 'Date Submitted', 'Level', 'Status', 'Action'].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data?.recentSubmissions ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-400">No submissions yet</td>
                  </tr>
                ) : (
                  (data?.recentSubmissions ?? []).map((sub) => (
                    <tr key={sub.id}>
                      <td>
                        <div className={styles.userCell}>
                          <div className={styles.avatar}>
                            {sub.userName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-medium">{sub.userName}</div>
                            <div className="text-xs text-gray-400">{sub.userEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td className="text-sm">{sub.formTitle}</td>
                      <td className="text-sm text-gray-500">{formatDate(sub.createdAt)}</td>
                      <td>
                        <span className={styles.levelBadge}>L{sub.currentLevel}</span>
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${STATUS_BADGE_CLASS[sub.status] ?? styles.statusPending}`}>
                          {sub.status}
                        </span>
                      </td>
                      <td>
                        <Link href={`/forms/all/${sub.id}`} className={styles.inlineLink}>
                          View details
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
