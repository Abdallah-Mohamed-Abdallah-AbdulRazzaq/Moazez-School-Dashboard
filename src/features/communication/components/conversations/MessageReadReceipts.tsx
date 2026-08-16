import type { ReadSummaryState } from "@/features/communication/hooks/useConversationMessages";

export interface MessageReadReceiptsProps {
  readSummary?: ReadSummaryState;
  labels: {
    read: string;
    unread: string;
  };
}

export default function MessageReadReceipts({
  labels,
  readSummary,
}: MessageReadReceiptsProps) {
  if (!readSummary) return null;
  const readCount = readSummary.items.reduce(
    (total, message) => total + message.readCount,
    0,
  );

  return (
    <div className="text-xs text-slate-500">
      <span>
        {labels.read}: {readCount}
      </span>
    </div>
  );
}
