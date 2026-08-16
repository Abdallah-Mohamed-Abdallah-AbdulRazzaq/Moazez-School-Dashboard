export type CommunicationStatusTone =
  | "default"
  | "info"
  | "success"
  | "warning"
  | "error"
  | "neutral";

export interface CommunicationStatusChipProps {
  label: string;
  tone?: CommunicationStatusTone;
  size?: "small" | "medium";
  className?: string;
}

const toneClasses: Record<CommunicationStatusTone, string> = {
  default: "bg-slate-100 text-slate-700",
  neutral: "bg-slate-100 text-slate-700",
  info: "bg-primary-100 text-primary-700",
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-800",
  error: "bg-rose-100 text-rose-700",
};

export default function CommunicationStatusChip({
  label,
  tone = "default",
  size = "small",
  className = "",
}: CommunicationStatusChipProps) {
  const sizeClass =
    size === "medium" ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs";

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full font-medium ${sizeClass} ${toneClasses[tone]} ${className}`}
    >
      {label}
    </span>
  );
}
