import { CheckCircle2, Circle } from "lucide-react";

interface SetupProgressStep {
  id: string;
  label: string;
  complete: boolean;
}

interface SetupProgressProps {
  label: string;
  progressText: string;
  completed: number;
  total: number;
  steps: SetupProgressStep[];
  done: string;
  remaining: string;
}

export function SetupProgress({
  label,
  progressText,
  completed,
  total,
  steps,
  done,
  remaining,
}: SetupProgressProps) {
  return (
    <div className="rounded-lg border border-primary/15 bg-primary/[0.03] p-3">
      <div className="flex items-center justify-between gap-3 text-sm font-medium text-gray-800">
        <span>{label}</span>
        <span aria-live="polite">{progressText}</span>
      </div>
      <div
        aria-label={label}
        aria-valuemax={total}
        aria-valuemin={0}
        aria-valuenow={completed}
        className="mt-2 h-2 overflow-hidden rounded-full bg-primary/10"
        role="progressbar"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
          style={{ width: `${(completed / total) * 100}%` }}
        />
      </div>
      <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-4">
        {steps.map((step) => {
          const StatusIcon = step.complete ? CheckCircle2 : Circle;
          const status = step.complete ? done : remaining;

          return (
            <li
              className={`flex items-center gap-2 rounded-md px-2 py-1.5 font-medium ${
                step.complete
                  ? "bg-emerald-50 text-emerald-800"
                  : "bg-white text-gray-600"
              }`}
              key={step.id}
            >
              <StatusIcon aria-hidden className="h-4 w-4 shrink-0" />
              <span>{step.label}</span>
              <span className="ms-auto text-xs">{status}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
