"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import StatusBadge from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText, Clock, CheckCircle2, AlertCircle,
  Loader2, ArrowRight, Sparkles,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface VerifierLevel {
  level: number;
  verifier: { userName: string; role: string; department: string };
}

interface VerificationAction {
  level: number;
  status: "Pending" | "Approved" | "Rejected";
  remark: string | null;
  actionAt: string;
  verifier: { userName: string; role: string; department: string };
}

interface Submission {
  id: string;
  overallStatus: "Pending" | "Approved" | "Rejected";
  currentLevel: number;
  createdAt: string;
  form: {
    id: number;
    title: string;
    verifiersList: VerifierLevel[];
  };
  verificationActions: VerificationAction[];
}

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

// ── Chain progress component ───────────────────────────────────────────────────
function ChainProgress({
  verifiersList,
  verificationActions,
  currentLevel,
  overallStatus,
}: {
  verifiersList: VerifierLevel[];
  verificationActions: VerificationAction[];
  currentLevel: number;
  overallStatus: string;
}) {
  if (verifiersList.length === 0) return <span className="text-xs text-muted-foreground">—</span>;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {verifiersList.map((v, i) => {
        const action = verificationActions.find((a) => a.level === v.level);
        const isDone = action?.status === "Approved";
        const isRejected = action?.status === "Rejected";
        const isCurrent = v.level === currentLevel && overallStatus === "Pending";

        return (
          <div key={v.level} className="flex items-center gap-1">
            <div
              title={`${v.verifier.userName} (${v.verifier.role})`}
              className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border transition-colors ${isRejected
                  ? "bg-rose-50 border-rose-200 text-rose-600"
                  : isDone
                    ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                    : isCurrent
                      ? "bg-amber-50 border-amber-200 text-amber-600"
                      : "bg-muted border-border text-muted-foreground"
                }`}
            >
              <span>L{v.level}</span>
              {isDone && <span>✓</span>}
              {isRejected && <span>✗</span>}
              {isCurrent && <span className="animate-pulse">●</span>}
            </div>
            {i < verifiersList.length - 1 && (
              <span className="text-muted-foreground text-[10px]">→</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/submissions/getMySubmissions?limit=5");
        const data = await res.json();

        if (!res.ok) throw new Error(data.message ?? `Error ${res.status}`);

        setSubmissions(data.data ?? []);
        setStats(data.stats ?? { total: 0, pending: 0, approved: 0, rejected: 0 });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const statCards = [
    {
      label: "Total Submitted",
      value: stats.total,
      icon: FileText,
      cardClass: "card-stat-blue",
      iconColor: "text-indigo-600",
      iconBg: "bg-indigo-100",
    },
    {
      label: "Pending",
      value: stats.pending,
      icon: Clock,
      cardClass: "card-stat-amber",
      iconColor: "text-amber-600",
      iconBg: "bg-amber-100",
    },
    {
      label: "Approved",
      value: stats.approved,
      icon: CheckCircle2,
      cardClass: "card-stat-teal",
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-100",
    },
    {
      label: "Rejected",
      value: stats.rejected,
      icon: AlertCircle,
      cardClass: "card-stat-rose",
      iconColor: "text-rose-600",
      iconBg: "bg-rose-100",
    },
  ];

  // ── Helpers ────────────────────────────────────────────────────────
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    });

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-IN", {
      hour: "2-digit", minute: "2-digit",
    });

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">

      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl gradient-hero p-6 sm:p-8"
        style={{ boxShadow: "var(--shadow-primary)" }}
      >
        <div className="absolute right-0 top-0 h-full w-1/2 opacity-10">
          <div className="absolute right-[-20%] top-[-20%] h-64 w-64 rounded-full bg-white" />
          <div className="absolute bottom-[-10%] right-[20%] h-40 w-40 rounded-full bg-white" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-amber-300" />
            <span className="text-sm font-medium text-white/80">Welcome back</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white">
            {user?.name ?? "—"}
          </h1>
          <p className="mt-1 text-sm text-white/60">{user?.email}</p>
          <p className="mt-2 text-sm text-white/70 max-w-lg">
            Manage your forms, track approvals, and stay updated on your
            submissions — all in one place.
          </p>
          <Link href="/forms" className="mt-4 inline-block">
            <Button variant="accent" size="sm" className="gap-2">
              Browse Forms <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card className={`border ${stat.cardClass} hover:scale-[1.02] transition-transform duration-200`}>
              <CardContent className="flex items-center gap-4 p-5">
                <div className={`rounded-xl ${stat.iconBg} p-3 ${stat.iconColor}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent Submissions */}
      <Card className="shadow-card border-0 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
          <CardTitle className="font-heading text-lg">Recent Submissions</CardTitle>
          <Link href="/history">
            <Button variant="ghost" size="sm" className="text-primary gap-1">
              View All <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Loading submissions…</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <AlertCircle className="h-6 w-6 text-destructive/60" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          ) : submissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-3">
              <FileText className="h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No submissions yet.</p>
              <Link href="/forms">
                <Button size="sm" variant="outline" className="rounded-xl gap-1">
                  Browse Forms <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30 text-left text-muted-foreground">
                    <th className="px-6 py-3 font-semibold">Form</th>
                    <th className="px-6 py-3 font-semibold hidden sm:table-cell">Date</th>
                    <th className="px-6 py-3 font-semibold hidden md:table-cell">Time</th>
                    <th className="px-6 py-3 font-semibold hidden lg:table-cell">Approval Progress</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {submissions.map((sub, i) => (
                    <motion.tr
                      key={sub.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="hover:bg-indigo-50/50 transition-colors"
                    >
                      {/* Form title */}
                      <td className="px-6 py-4 font-medium max-w-[180px]">
                        <span className="line-clamp-1">{sub.form.title}</span>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 hidden sm:table-cell text-muted-foreground">
                        {formatDate(sub.createdAt)}
                      </td>

                      {/* Time */}
                      <td className="px-6 py-4 hidden md:table-cell text-muted-foreground">
                        {formatTime(sub.createdAt)}
                      </td>

                      {/* Chain progress */}
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <ChainProgress
                          verifiersList={sub.form.verifiersList}
                          verificationActions={sub.verificationActions}
                          currentLevel={sub.currentLevel}
                          overallStatus={sub.overallStatus}
                        />
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <StatusBadge status={sub.overallStatus} />
                      </td>

                      {/* View */}
                      <td className="px-6 py-4">
                        <Link href={`/submission/${sub.id}`}>
                          <Button variant="outline" size="sm" className="text-xs rounded-lg">
                            View
                          </Button>
                        </Link>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}