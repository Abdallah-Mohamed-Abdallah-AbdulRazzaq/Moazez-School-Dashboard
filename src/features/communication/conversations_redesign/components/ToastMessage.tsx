import { X } from "lucide-react";

export function ToastMessage({
  actionLabel,
  closeLabel,
  message,
  onAction,
  onClose,
  tone,
}: {
  actionLabel?: string;
  closeLabel: string;
  message: string;
  onAction?: () => void;
  onClose: () => void;
  tone: "success" | "error" | "info";
}) {
  const classes = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    error: "border-red-200 bg-red-50 text-red-800",
    info: "border-sky-200 bg-sky-50 text-sky-800",
  };

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      aria-live="polite"
      className={`absolute bottom-5 left-1/2 z-50 flex max-w-[min(520px,90vw)] -translate-x-1/2 items-center gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg ${classes[tone]}`}
    >
      <span>{message}</span>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="shrink-0 cursor-pointer rounded px-2 py-1 font-semibold transition-colors hover:bg-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
        >
          {actionLabel}
        </button>
      ) : null}
      <button
        type="button"
        onClick={onClose}
        className="cursor-pointer rounded p-1 transition-colors hover:bg-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
        aria-label={closeLabel}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
