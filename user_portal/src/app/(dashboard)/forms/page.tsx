"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Search, FileText, AlertCircle, Clock, ChevronRight, Filter } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface FormDefinition {
  id: number;
  title: string;
  description: string;
  deadline: string;
  createdAt: string;
}

type FilterTab = "all" | "active" | "expiring" | "expired";

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDeadline(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const label = date.toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
  return {
    label,
    diff,
    isExpiringSoon: diff <= 3 && diff >= 0,
    isExpired: diff < 0,
    isActive: diff > 3,
  };
}

function getSection(form: FormDefinition): FilterTab {
  const d = formatDeadline(form.deadline);
  if (d.isExpired) return "expired";
  if (d.isExpiringSoon) return "expiring";
  return "active";
}

// ── Tab config ────────────────────────────────────────────────────────────────
const TABS: { key: FilterTab; label: string }[] = [
  { key: "all",      label: "All Forms"     },
  { key: "active",   label: "Active"        },
  { key: "expiring", label: "Expiring Soon" },
  { key: "expired",  label: "Closed"        },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function FormsPage() {
  const [forms, setForms] = useState<FormDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  useEffect(() => {
    const fetchForms = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/form/getPublicForms");
        if (!res.ok) throw new Error(`Failed to fetch forms (${res.status})`);
        const data = await res.json();
        setForms(Array.isArray(data) ? data : data.data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    };
    fetchForms();
  }, []);

  // Counts per tab
  const counts: Record<FilterTab, number> = {
    all:      forms.length,
    active:   forms.filter((f) => getSection(f) === "active").length,
    expiring: forms.filter((f) => getSection(f) === "expiring").length,
    expired:  forms.filter((f) => getSection(f) === "expired").length,
  };

  const filtered = forms.filter((f) => {
    const matchesSearch =
      f.title.toLowerCase().includes(search.toLowerCase()) ||
      f.description.toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === "all" || getSection(f) === activeTab;
    return matchesSearch && matchesTab;
  });

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;1,400&family=Playfair+Display:wght@600;700&display=swap');`}</style>
        <div className="w-10 h-10 border-2 border-[#1a2744] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-[#6b5e4e] italic" style={{ fontFamily: "'Crimson Text', Georgia, serif" }}>
          Loading forms…
        </p>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;1,400&family=Playfair+Display:wght@600;700&display=swap');`}</style>
        <AlertCircle className="h-10 w-10 text-rose-400" />
        <p className="text-[#1a1a2e]" style={{ fontFamily: "'Crimson Text', Georgia, serif" }}>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 text-sm border-2 border-[#c8b89a] text-[#6b5e4e] rounded hover:border-[#1a2744] hover:text-[#1a2744] transition-colors"
          style={{ fontFamily: "'Crimson Text', Georgia, serif" }}
        >
          Try again
        </button>
      </div>
    );
  }

  // ── Page ─────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full" style={{ fontFamily: "'Crimson Text', Georgia, serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;1,400&family=Playfair+Display:wght@600;700&display=swap');
        .form-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .form-card:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(26,39,68,0.12); }
      `}</style>

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="bg-[#1a2744] px-8 py-8 relative overflow-hidden">
        {/* Subtle decorative background pattern */}
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: "repeating-linear-gradient(45deg, #c8b89a 0, #c8b89a 1px, transparent 0, transparent 50%)", backgroundSize: "12px 12px" }} />
        <div className="absolute inset-x-0 bottom-0 h-px bg-[#c8b89a] opacity-30" />

        <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#c8b89a] mb-2">
              IIT Ropar · Official Portal
            </p>
            <h1 className="text-2xl font-bold text-white font-['Playfair_Display',_serif] leading-tight">
              Available Forms
            </h1>
            <p className="text-sm text-[#a89880] mt-1.5 italic">
              {counts.active} active form{counts.active !== 1 ? "s" : ""} open for submission
            </p>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#a89880]" />
            <input
              type="text"
              placeholder="Search forms…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/10 border border-white/20 text-white placeholder-[#a89880] rounded pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-[#c8b89a] focus:bg-white/15 transition-all"
            />
          </div>
        </div>
      </div>

      {/* ── Filter tabs ───────────────────────────────────────────────── */}
      <div className="bg-[#f5f0e8] border-b border-[#e8dfd0] px-8">
        <div className="flex items-center gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative flex items-center gap-2 px-4 py-3.5 text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-colors border-b-2 ${
                activeTab === tab.key
                  ? "border-[#1a2744] text-[#1a2744]"
                  : "border-transparent text-[#a89880] hover:text-[#6b5e4e]"
              }`}
            >
              {tab.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                activeTab === tab.key
                  ? "bg-[#1a2744] text-white"
                  : "bg-[#e8dfd0] text-[#a89880]"
              }`}>
                {counts[tab.key]}
              </span>
            </button>
          ))}

          <div className="ml-auto flex items-center gap-1.5 text-[11px] text-[#a89880] py-3 pr-1 shrink-0">
            <Filter className="h-3 w-3" />
            {filtered.length} shown
          </div>
        </div>
      </div>

      {/* ── Form grid ─────────────────────────────────────────────────── */}
      <div className="p-8">
        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-center py-20"
            >
              <div className="w-16 h-16 rounded-full bg-[#f5f0e8] border-2 border-dashed border-[#c8b89a] flex items-center justify-center mx-auto mb-4">
                <FileText className="h-7 w-7 text-[#c8b89a]" />
              </div>
              <p className="text-[#6b5e4e] italic">No forms found matching your search.</p>
              {search && (
                <button onClick={() => setSearch("")}
                  className="mt-3 text-xs text-[#1a2744] underline underline-offset-2">
                  Clear search
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              {filtered.map((form, i) => {
                const deadline = formatDeadline(form.deadline);
                const section = getSection(form);

                const statusBar =
                  section === "expired"  ? "linear-gradient(90deg, #f43f5e, #fb7185)" :
                  section === "expiring" ? "linear-gradient(90deg, #f59e0b, #fbbf24)" :
                                           "linear-gradient(90deg, #10b981, #34d399)";

                const statusBadge =
                  section === "expired"  ? "bg-rose-50 text-rose-600 border-rose-200" :
                  section === "expiring" ? "bg-amber-50 text-amber-600 border-amber-200" :
                                           "bg-emerald-50 text-emerald-700 border-emerald-200";

                const statusLabel =
                  section === "expired"  ? "Closed" :
                  section === "expiring" ? "Closing Soon" :
                                           "Open";

                return (
                  <motion.div
                    key={form.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.3 }}
                  >
                    <div className="form-card bg-white border border-[#e8dfd0] rounded-sm overflow-hidden flex flex-col h-full">

                      {/* Status bar */}
                      <div className="h-1 w-full" style={{ background: statusBar }} />

                      <div className="p-5 flex flex-col flex-1">

                        {/* Top row: icon + status badge */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-9 h-9 rounded bg-[#f5f0e8] border border-[#e8dfd0] flex items-center justify-center shrink-0">
                            <FileText className="h-4 w-4 text-[#1a2744]" />
                          </div>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusBadge}`}>
                            {statusLabel}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="font-['Playfair_Display',_serif] text-sm font-semibold text-[#1a1a2e] leading-snug line-clamp-2 mb-2">
                          {form.title}
                        </h3>

                        {/* Description */}
                        <p className="flex-1 text-xs text-[#6b5e4e] leading-relaxed line-clamp-3 italic mb-4">
                          {form.description || "No description provided."}
                        </p>

                        {/* Deadline */}
                        <div className={`flex items-center gap-1.5 text-xs mb-4 ${
                          deadline.isExpired ? "text-rose-500" :
                          deadline.isExpiringSoon ? "text-amber-600" :
                          "text-[#6b5e4e]"
                        }`}>
                          <Clock className="h-3.5 w-3.5 shrink-0" />
                          <span>
                            {deadline.isExpired
                              ? `Deadline passed · ${deadline.label}`
                              : deadline.isExpiringSoon
                                ? `Closing soon · ${deadline.label}`
                                : `Due ${deadline.label}`}
                          </span>
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-[#e8dfd0] mb-4" />

                        {/* CTA */}
                        {deadline.isExpired ? (
                          <div className="flex items-center justify-center py-2 text-xs text-[#a89880] uppercase tracking-widest">
                            Form Closed
                          </div>
                        ) : (
                          <Link href={`/forms/${form.id}`}>
                            <button className="w-full flex items-center justify-between px-4 py-2.5 bg-[#1a2744] text-[#f5f0e8] text-xs rounded hover:bg-[#243660] active:bg-[#111d38] transition-colors group">
                              <span className="uppercase tracking-wider font-semibold">Fill Form</span>
                              <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                            </button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Footer note ───────────────────────────────────────────────── */}
      <p className="text-center text-[11px] text-[#c8b89a] pb-8">
        IIT Ropar · Official Form Portal · Showing {filtered.length} of {forms.length} forms
      </p>
    </div>
  );
}