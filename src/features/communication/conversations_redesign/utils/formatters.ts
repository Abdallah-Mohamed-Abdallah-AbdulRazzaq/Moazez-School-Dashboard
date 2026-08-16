import type { Conversation, ConversationParticipant } from "@/features/communication/types/conversation.types";
import type { ConversationListItemModel } from "@/features/communication/hooks/useConversations";
import type { ConversationMessage } from "@/features/communication/hooks/useConversationMessages";
import type { CommunicationRecord } from "@/features/communication/types/communication.types";
import type { ConversationRedesignLabels } from "@/features/communication/conversations_redesign/labels";

export function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}


export function getTitle(
  labels: ConversationRedesignLabels,
  conversation?: Conversation | ConversationListItemModel | null,
) {
  if (!conversation) return labels.untitledConversation;
  return (
    conversation.titleEn ||
    conversation.title ||
    conversation.titleAr ||
    labels.untitledConversation
  );
}


export function formatTime(value: string | null | undefined, locale: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function formatRelativeDate(value: string | null | undefined, locale: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.max(1, Math.round(diffMs / 3600000));
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (diffHours < 24) return formatter.format(-diffHours, "hour");
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 31) return formatter.format(-diffDays, "day");
  const diffMonths = Math.round(diffDays / 30);
  return formatter.format(-diffMonths, "month");
}

export function formatDate(value: string | null | undefined, locale: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function localDateKey(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatMessageDateSeparator(
  value: string | null | undefined,
  locale: string,
  labels: ConversationRedesignLabels,
) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const key = localDateKey(value);
  if (key === localDateKey(today.toISOString())) return labels.today;
  if (key === localDateKey(yesterday.toISOString())) return labels.yesterday;

  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}


export function formatFileSize(value?: number | string) {
  const numericValue = typeof value === "string" ? Number(value) : value;
  if (!numericValue) return "";
  if (numericValue < 1024 * 1024) return `${Math.max(1, Math.round(numericValue / 1024))} KB`;
  return `${(numericValue / 1024 / 1024).toFixed(1)} MB`;
}


export function conversationIsReadOnly(conversation?: Conversation | null) {
  if (!conversation) return false;
  const record = conversation as CommunicationRecord;
  return Boolean(
    record.isReadOnly || record.readOnly || conversation.status === "closed",
  );
}


export function participantUserId(participant: ConversationParticipant) {
  return (
    participant.userId ||
    participant.actor?.userId ||
    participant.actor?.id ||
    ""
  );
}


export function conversationTypeLabel(
  type: Conversation["type"] | undefined,
  labels: ConversationRedesignLabels,
) {
  if (type === "group") return labels.group;
  if (type === "classroom") return labels.classroom;
  if (type === "direct") return labels.direct;
  return type?.replace(/_/g, " ") || labels.direct;
}


export function statusLabel(
  status: string | null | undefined,
  labels: ConversationRedesignLabels,
) {
  const normalized = status || "pending";
  const statusLabels: Record<string, string> = {
    active: labels.active,
    accepted: labels.accepted,
    approved: labels.approved,
    expired: labels.expired,
    pending: labels.pending,
    rejected: labels.rejected,
  };
  return statusLabels[normalized] ?? normalized;
}


export function isOwnMessage(
  message: ConversationMessage,
  currentUserId?: string | null,
) {
  if (!currentUserId) return false;
  const record = message as Record<string, unknown>;
  const senderUserId =
    message.senderId ||
    message.sender?.userId ||
    message.sender?.id ||
    (typeof record.senderUserId === "string" ? record.senderUserId : undefined);
  return senderUserId === currentUserId;
}


export function messageSenderUserId(message: ConversationMessage) {
  return message.senderId || message.sender?.userId || message.sender?.id || "";
}
