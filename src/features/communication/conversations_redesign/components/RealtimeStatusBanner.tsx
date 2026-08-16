import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import type { ConversationRedesignLabels } from "@/features/communication/conversations_redesign/labels";
import { CONVERSATION_ERROR_LABEL_KEYS } from "@/features/communication/utils/communication-errors";

function realtimeErrorMessage(
  errorCode: string,
  labels: ConversationRedesignLabels,
) {
  const labelKey = CONVERSATION_ERROR_LABEL_KEYS[errorCode];
  return labelKey ? labels[labelKey] : labels.realtimeUnavailable;
}

export default function RealtimeStatusBanner({
  connectionError,
  isConnected,
  labels,
  onRetry,
}: {
  connectionError: string | null;
  isConnected: boolean;
  labels: ConversationRedesignLabels;
  onRetry: () => void;
}) {
  if (isConnected && !connectionError) return null;

  const hasError = Boolean(connectionError);
  const message = connectionError
    ? realtimeErrorMessage(connectionError, labels)
    : labels.realtimeReconnecting;
  const Icon = hasError ? AlertTriangle : Loader2;

  return (
    <div
      role={hasError ? "alert" : "status"}
      aria-live={hasError ? "assertive" : "polite"}
      aria-atomic="true"
      className={`flex shrink-0 flex-wrap items-center justify-start gap-x-3 gap-y-2 border-b px-3 py-2.5 text-sm sm:flex-nowrap sm:justify-center sm:px-4 ${
        hasError
          ? "border-rose-200 bg-rose-50 text-rose-800"
          : "border-amber-200 bg-amber-50 text-amber-900"
      }`}
    >
      <Icon
        className={`h-4 w-4 shrink-0 ${hasError ? "" : "motion-safe:animate-spin"}`}
        aria-hidden="true"
      />
      <span className="min-w-0 flex-1 sm:flex-none">{message}</span>
      <button
        type="button"
        onClick={onRetry}
        className="ms-auto inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 font-semibold transition-colors hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current sm:ms-0"
      >
        {!isConnected ? (
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
        ) : null}
        {isConnected ? labels.dismiss : labels.retry}
      </button>
    </div>
  );
}
