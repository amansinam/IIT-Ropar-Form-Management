import type { WorkflowStep } from "@/lib/mockApi";
import { CheckCircle2, Clock, Circle } from "lucide-react";

interface Props {
  steps: WorkflowStep[];
}

export default function StatusTracker({ steps }: Props) {
  return (
    <div className="space-y-0">
      {steps.map((step, i) => (
        <div key={step.step} className="flex gap-4">
          <div className="flex flex-col items-center">
            {step.status === "completed" ? (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
            ) : step.status === "pending" ? (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 animate-pulse">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                <Circle className="h-5 w-5 text-muted-foreground/40" />
              </div>
            )}
            {i < steps.length - 1 && (
              <div
                className={`w-0.5 flex-1 min-h-[2rem] ${
                  step.status === "completed"
                    ? "bg-gradient-to-b from-emerald-400 to-emerald-200"
                    : "bg-border"
                }`}
              />
            )}
          </div>
          <div className="pb-6">
            <p
              className={`text-sm font-semibold ${
                step.status === "completed"
                  ? "text-emerald-700"
                  : step.status === "pending"
                  ? "text-amber-700"
                  : "text-muted-foreground"
              }`}
            >
              {step.authority}
            </p>
            <p
              className={`text-xs font-medium ${
                step.status === "completed"
                  ? "text-emerald-500"
                  : step.status === "pending"
                  ? "text-amber-500"
                  : "text-muted-foreground/60"
              }`}
            >
              {step.status === "completed"
                ? "✔ Completed"
                : step.status === "pending"
                ? "⏳ Pending Review"
                : "Awaiting"}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
