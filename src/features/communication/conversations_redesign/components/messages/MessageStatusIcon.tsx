import { Check, CheckCheck, Clock } from "lucide-react";
import type { ConversationRedesignLabels } from "@/features/communication/conversations_redesign/labels";

export function MessageStatusIcon({
  deliveryStatus,
  isRead,
  isOwn,
  labels,
}: {
  deliveryStatus?: string;
  isRead: boolean;
  isOwn: boolean;
  labels: Pick<
    ConversationRedesignLabels,
    "failed" | "readStatus" | "sending" | "sent"
  >;
}) {
  if (!isOwn) return null;

  if (deliveryStatus === "pending") {
    return (
      <span
        role="img"
        aria-label={labels.sending}
        title={labels.sending}
        className="mb-1 mt-auto inline-flex opacity-60"
      >
        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
    );
  }

  if (deliveryStatus === "failed") {
    return (
      <span
        role="img"
        aria-label={labels.failed}
        title={labels.failed}
        className="mb-1 mt-auto inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white"
      >
        !
      </span>
    );
  }

  const statusLabel = isRead ? labels.readStatus : labels.sent;
  return (
    <span
      role="img"
      aria-label={statusLabel}
      title={statusLabel}
      className={`mb-1 mt-auto inline-flex ${
        isRead ? "text-sky-400" : "opacity-70"
      }`}
    >
      {isRead ? (
        <CheckCheck className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Check className="h-4 w-4" aria-hidden="true" />
      )}
    </span>
  );
}
