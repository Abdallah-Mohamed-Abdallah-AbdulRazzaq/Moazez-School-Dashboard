import type { ReactNode } from "react";
import { Loader2, MessageCircle } from "lucide-react";

export function PanelLayout({
  action,
  children,
  title,
}: {
  action?: ReactNode;
  children: ReactNode;
  title: string;
}) {
  return (
    <div className="h-full overflow-y-auto px-4 py-6">
      <div className="mx-auto max-w-[768px]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-xl font-bold text-slate-950">{title}</h3>
          {action}
        </div>
        {children}
      </div>
    </div>
  );
}

export function ActionButton({
  children,
  icon,
  onClick,
}: {
  children: ReactNode;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary-50 px-3 text-sm font-bold text-primary transition hover:bg-primary-100"
    >
      {icon}
      {children}
    </button>
  );
}

export function ParticipantActionButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="h-8 rounded-md border border-slate-200 px-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-slate-600"
    >
      {children}
    </button>
  );
}

export function StatusPill({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "blue" | "green" | "orange" | "red" | "yellow" | "gray";
}) {
  const classes = {
    blue: "bg-primary-50 text-primary",
    green: "bg-emerald-50 text-emerald-700",
    orange: "bg-orange-50 text-orange-600",
    red: "bg-red-50 text-red-600",
    yellow: "bg-amber-50 text-amber-700",
    gray: "bg-slate-100 text-slate-500",
  };

  return (
    <span
      className={`inline-flex rounded px-2 py-0.5 text-[10px] font-bold uppercase ${classes[tone]}`}
    >
      {children}
    </span>
  );
}

export function PanelState({ label }: { label: string }) {
  return (
    <div className="px-4 py-6 text-center text-sm text-slate-500">{label}</div>
  );
}

export function CenteredState({
  isLoading = false,
  label,
}: {
  isLoading?: boolean;
  label: string;
}) {
  return (
    <div
      role={isLoading ? "status" : undefined}
      aria-busy={isLoading || undefined}
      aria-live={isLoading ? "polite" : undefined}
      className="flex min-h-[260px] flex-col items-center justify-center gap-3 px-6 text-center text-sm text-slate-500"
    >
      {isLoading ? (
        <Loader2
          className="h-6 w-6 motion-safe:animate-spin"
          aria-hidden="true"
        />
      ) : (
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100">
          <MessageCircle className="h-5 w-5" aria-hidden="true" />
        </span>
      )}
      <span>{label}</span>
    </div>
  );
}

export function EmptyDetail({ label }: { label: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-slate-50 px-6 text-center text-sm text-slate-500">
      <span className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm">
        <MessageCircle className="h-5 w-5" aria-hidden="true" />
      </span>
      <span>{label}</span>
    </div>
  );
}

