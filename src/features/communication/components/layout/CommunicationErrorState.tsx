import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

export interface CommunicationErrorStateProps {
  title?: ReactNode;
  message: ReactNode;
  action?: ReactNode;
  className?: string;
}

export default function CommunicationErrorState({
  title,
  message,
  action,
  className = "",
}: CommunicationErrorStateProps) {
  return (
    <div
      role="alert"
      className={`flex gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 ${className}`}
    >
      <AlertTriangle
        className="mt-0.5 h-5 w-5 shrink-0 text-rose-600"
        aria-hidden="true"
      />
      <div className="min-w-0">
        {title ? (
          <div className="mb-1 font-semibold text-rose-950">{title}</div>
        ) : null}
        <div className="text-sm leading-6 text-rose-800">{message}</div>
        {action ? <div className="mt-4">{action}</div> : null}
      </div>
    </div>
  );
}
