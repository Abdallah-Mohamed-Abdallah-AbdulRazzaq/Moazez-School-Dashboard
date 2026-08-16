import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

export interface CommunicationEmptyStateProps {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export default function CommunicationEmptyState({
  title,
  description,
  action,
  icon,
  className = "",
}: CommunicationEmptyStateProps) {
  return (
    <div
      className={`flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center ${className}`}
    >
      <div className="mb-4 rounded-full bg-slate-100 p-3 text-slate-500">
        {icon ?? <Inbox className="h-7 w-7" aria-hidden="true" />}
      </div>
      <h2 className="text-base font-semibold text-slate-950">{title}</h2>
      {description ? (
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
