import type { ReactNode } from "react";

export interface CommunicationLoadingStateProps {
  label?: ReactNode;
  className?: string;
  size?: number;
}

export default function CommunicationLoadingState({
  label,
  className = "",
  size = 32,
}: CommunicationLoadingStateProps) {
  return (
    <div
      className={`flex min-h-64 flex-col items-center justify-center rounded-lg border border-slate-200 bg-white p-8 text-center ${className}`}
      aria-live="polite"
      aria-busy="true"
    >
      <span
        className="inline-block animate-spin rounded-full border-2 border-slate-200 border-t-primary-600"
        style={{ width: size, height: size }}
        aria-hidden="true"
      />
      {label ? (
        <p className="mt-4 text-sm font-medium text-slate-600">{label}</p>
      ) : null}
    </div>
  );
}
