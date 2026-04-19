import { Badge } from "@/components/ui/badge";

type Status = "Approved" | "Pending" | "Rejected" | "Under Review" | "SentBack" | string;

export default function StatusBadge({ status }: { status: Status }) {
  const classes: Record<string, string> = {
    Approved: "status-approved",
    Pending: "status-pending",
    Rejected: "status-rejected",
    "Under Review": "status-review",
    SentBack: "bg-orange-100 text-orange-700 border-orange-300",
    Expired: "bg-slate-100 text-slate-600 border-slate-300",
  };

  const labels: Record<string, string> = {
    SentBack: "Sent Back",
  };

  return (
    <Badge variant="outline" className={`${classes[status] ?? "status-pending"} border font-medium text-xs`}>
      {labels[status] ?? status}
    </Badge>
  );
}
