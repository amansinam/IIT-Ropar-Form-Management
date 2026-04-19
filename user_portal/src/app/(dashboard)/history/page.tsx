"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { historyService } from "@/lib/services";
import type { Submission } from "@/lib/mockApi";
import StatusBadge from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Clock, FileText } from "lucide-react";

const filterOptions = ["All", "Pending", "Approved", "Rejected", "Under Review"] as const;

const filterColors: Record<string, string> = {
  All: "gradient-primary text-white border-transparent",
  Pending: "bg-amber-100 text-amber-700 border-amber-300",
  Approved: "bg-emerald-100 text-emerald-700 border-emerald-300",
  Rejected: "bg-rose-100 text-rose-700 border-rose-300",
  "Under Review": "bg-indigo-100 text-indigo-700 border-indigo-300",
};

export default function HistoryPage() {
  const [history, setHistory] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("All");

  useEffect(() => {
    historyService.getAll().then((data) => {
      setHistory(data);
      setLoading(false);
    });
  }, []);

  const filtered = filter === "All" ? history : history.filter((s) => s.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
          <Clock className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold">Submission History</h1>
          <p className="text-sm text-muted-foreground">View all your past form submissions.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {filterOptions.map((opt) => (
          <button
            key={opt}
            onClick={() => setFilter(opt)}
            className={`rounded-full px-4 py-2 text-xs font-semibold border transition-all duration-200 ${
              filter === opt
                ? filterColors[opt]
                : "bg-card text-muted-foreground border-border hover:border-primary/30"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      <Card className="shadow-card border-0 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
          <CardTitle className="font-heading text-base">
            {filter === "All" ? "All" : filter} Submissions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-10 w-10 text-muted-foreground/30" />
              <p className="mt-3 text-sm text-muted-foreground">No submissions found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30 text-left text-muted-foreground">
                    <th className="px-6 py-3 font-semibold">Form Name</th>
                    <th className="px-6 py-3 font-semibold hidden sm:table-cell">Submission Date</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((sub, i) => (
                    <motion.tr
                      key={sub.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="hover:bg-indigo-50/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium">{sub.form_name}</td>
                      <td className="px-6 py-4 hidden sm:table-cell text-muted-foreground">{sub.submitted_date}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={sub.status} />
                      </td>
                      <td className="px-6 py-4">
                        <Link href={`/submission/${sub.id}`}>
                          <Button variant="outline" size="sm" className="text-xs rounded-lg">View</Button>
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
