"use client";

import { ShieldCheck } from "lucide-react";
import Button from "@/components/ui/button/Button";
import ConversationSearchSelect from "@/features/communication/components/selectors/ConversationSearchSelect";
import MessageSearchSelect from "@/features/communication/components/selectors/MessageSearchSelect";
import CommunicationStatusChip from "@/features/communication/components/layout/CommunicationStatusChip";
import type { Message } from "@/features/communication/types/message.types";

export interface ModerationActionsPanelLabels {
  title: string;
  conversationSelect: string;
  messageId: string;
  selectConversationFirst: string;
  load: string;
  currentStatus: string;
  sender: string;
  conversation: string;
  messageBody: string;
  noMessage: string;
  hidden: string;
  deleted: string;
  visible: string;
  unknown: string;
}

export interface ModerationActionsPanelProps {
  conversationId: string;
  messageId: string;
  message?: Message | null;
  isLoading?: boolean;
  onConversationIdChange: (conversationId: string) => void;
  labels: ModerationActionsPanelLabels;
  onMessageIdChange: (messageId: string) => void;
  onLoad: () => Promise<void> | void;
}

function senderName(message: Message, fallback: string) {
  return (
    message.sender?.name ||
    message.sender?.nameEn ||
    message.sender?.nameAr ||
    message.senderId ||
    fallback
  );
}

function statusLabel(
  message: Message | null | undefined,
  labels: ModerationActionsPanelLabels,
) {
  if (message?.status === "hidden") return labels.hidden;
  if (message?.status === "deleted" || message?.deletedAt)
    return labels.deleted;
  return labels.visible;
}

function statusTone(message?: Message | null) {
  if (message?.status === "hidden") return "warning" as const;
  if (message?.status === "deleted" || message?.deletedAt)
    return "error" as const;
  return "success" as const;
}

export default function ModerationActionsPanel({
  conversationId,
  isLoading,
  labels,
  message,
  messageId,
  onConversationIdChange,
  onLoad,
  onMessageIdChange,
}: ModerationActionsPanelProps) {
  return (
    <section className="space-y-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-primary-600" aria-hidden />
        <h2 className="text-base font-semibold text-slate-900">
          {labels.title}
        </h2>
      </div>
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
        <ConversationSearchSelect
          label={labels.conversationSelect}
          value={conversationId}
          onChange={(nextConversationId) => {
            onConversationIdChange(nextConversationId);
            onMessageIdChange("");
          }}
        />
        <MessageSearchSelect
          label={labels.messageId}
          conversationId={conversationId}
          value={messageId}
          helperText={
            !conversationId ? labels.selectConversationFirst : undefined
          }
          onChange={onMessageIdChange}
        />
        <Button type="button" loading={isLoading} onClick={() => void onLoad()}>
          {labels.load}
        </Button>
      </div>

      {!message ? (
        <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
          {labels.noMessage}
        </p>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-500">
              {labels.currentStatus}
            </span>
            <CommunicationStatusChip
              label={statusLabel(message, labels)}
              tone={statusTone(message)}
            />
          </div>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-slate-500">{labels.sender}</dt>
              <dd className="font-medium text-slate-800">
                {senderName(message, labels.unknown)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">{labels.conversation}</dt>
              <dd className="break-all font-medium text-slate-800">
                {message.conversationId ?? labels.unknown}
              </dd>
            </div>
          </dl>
          <div>
            <p className="mb-1 text-xs text-slate-500">{labels.messageBody}</p>
            <p className="whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-800">
              {message.deletedAt || message.status === "deleted"
                ? labels.deleted
                : message.body || labels.unknown}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
