import {
  getConversation,
  getMessageInfo,
} from "@/features/communication/api/communication.service";
import type {
  CommunicationNotification,
  NotificationPriority,
} from "@/features/communication/types/notification.types";

export type NotificationPresentationKind =
  "message" | "announcement" | "notification";

export interface NotificationPresentation {
  actionLabel: string;
  body: string;
  contextLabel: string;
  conversationId?: string;
  kind: NotificationPresentationKind;
  priority?: NotificationPriority;
  senderUserId?: string;
  targetUrl?: string;
  timestamp: number;
  title: string;
}

type NotificationRecord = CommunicationNotification | Record<string, unknown>;

const copy = {
  en: {
    announcements: "Announcements",
    messages: "Messages",
    newMessage: "New message",
    notification: "Notification",
    openConversation: "Open conversation",
    viewAnnouncement: "View announcement",
    viewDetails: "View details",
  },
  ar: {
    announcements: "الإعلانات",
    messages: "الرسائل",
    newMessage: "رسالة جديدة",
    notification: "إشعار",
    openConversation: "فتح المحادثة",
    viewAnnouncement: "عرض الإعلان",
    viewDetails: "عرض التفاصيل",
  },
} as const;

const sourceLabels = {
  admissions: ["Admissions", "القبول"],
  announcements: ["Announcements", "الإعلانات"],
  attendance: ["Attendance", "الحضور"],
  behavior: ["Behavior", "السلوك"],
  communication: ["Messages", "الرسائل"],
  grades: ["Grades", "الدرجات"],
  reinforcement: ["Reinforcement", "التعزيز"],
  students: ["Students", "الطلاب"],
  system: ["System", "النظام"],
} as const;

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function recordValue(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function unwrapRecord(value: unknown) {
  const record = recordValue(value);
  if (!record) return undefined;
  return (
    recordValue(record.data) ??
    recordValue(record.item) ??
    recordValue(record.result) ??
    recordValue(record.payload) ??
    record
  );
}

async function settledRecord(request: Promise<unknown>) {
  const [settledRequest] = await Promise.allSettled([request]);
  return settledRequest?.status === "fulfilled"
    ? unwrapRecord(settledRequest.value)
    : undefined;
}

function notificationDeepLink(notification: NotificationRecord) {
  return (
    recordValue(notification.deepLink) ?? recordValue(notification.deep_link)
  );
}

function sourceType(notification: NotificationRecord) {
  return (
    stringValue(notification.sourceType) ??
    stringValue(notification.source_type)
  );
}

function sourceId(notification: NotificationRecord) {
  return (
    stringValue(notification.sourceId) ?? stringValue(notification.source_id)
  );
}

export function communicationConversationId(
  notification: NotificationRecord,
): string | undefined {
  const deepLink = notificationDeepLink(notification);
  const metadata = recordValue(notification.metadata);
  const currentSourceType = sourceType(notification);
  const entityType =
    stringValue(notification.entityType) ??
    stringValue(notification.entity_type);

  return (
    stringValue(deepLink?.conversationId) ??
    stringValue(deepLink?.conversation_id) ??
    stringValue(notification.conversationId) ??
    stringValue(notification.conversation_id) ??
    stringValue(metadata?.conversationId) ??
    stringValue(metadata?.conversation_id) ??
    (currentSourceType === "conversation"
      ? sourceId(notification)
      : undefined) ??
    (entityType === "conversation"
      ? (stringValue(notification.entityId) ??
        stringValue(notification.entity_id))
      : undefined)
  );
}

export function notificationMessageId(
  notification: NotificationRecord,
): string | undefined {
  const deepLink = notificationDeepLink(notification);
  const currentSourceType = sourceType(notification);
  const type = stringValue(notification.type)?.toLowerCase();

  return (
    stringValue(deepLink?.messageId) ??
    stringValue(deepLink?.message_id) ??
    (currentSourceType === "message" || type?.startsWith("message_")
      ? sourceId(notification)
      : undefined)
  );
}

export function isAnnouncementNotification(notification: NotificationRecord) {
  const deepLink = notificationDeepLink(notification);
  const currentSourceType = sourceType(notification)?.toLowerCase();
  const sourceModule =
    stringValue(notification.sourceModule) ??
    stringValue(notification.source_module);
  const type = stringValue(notification.type)?.toLowerCase();

  return (
    deepLink?.type === "announcement" ||
    type === "announcement_published" ||
    sourceModule?.toLowerCase() === "announcements" ||
    Boolean(currentSourceType?.includes("announcement"))
  );
}

function isMessageNotification(notification: NotificationRecord) {
  const deepLink = notificationDeepLink(notification);
  const type = stringValue(notification.type)?.toLowerCase();
  return (
    deepLink?.type === "conversation_message" ||
    sourceType(notification)?.toLowerCase() === "message" ||
    Boolean(type?.startsWith("message_"))
  );
}

function priority(value: unknown): NotificationPriority | undefined {
  return value === "low" ||
    value === "normal" ||
    value === "high" ||
    value === "urgent"
    ? value
    : undefined;
}

function timestamp(notification: NotificationRecord) {
  const createdAt =
    stringValue(notification.createdAt) ?? stringValue(notification.created_at);
  const parsedTimestamp = createdAt
    ? new Date(createdAt).getTime()
    : Number.NaN;
  return Number.isFinite(parsedTimestamp) ? parsedTimestamp : Date.now();
}

function localizedValue(
  content: NotificationRecord | undefined,
  field: "body" | "title",
  locale: string,
) {
  if (!content) return undefined;
  const localizedField = `${field}${locale === "ar" ? "Ar" : "En"}`;
  const fallbackField = `${field}${locale === "ar" ? "En" : "Ar"}`;
  return (
    stringValue(content[localizedField]) ??
    stringValue(content[field]) ??
    stringValue(content[fallbackField])
  );
}

function senderFromMessageInfo(
  messageInfo: Record<string, unknown> | undefined,
) {
  const message = recordValue(messageInfo?.message);
  return (
    recordValue(message?.sender) ??
    recordValue(message?.senderUser) ??
    recordValue(messageInfo?.sender)
  );
}

function senderName(
  notification: NotificationRecord,
  messageInfo: Record<string, unknown> | undefined,
) {
  const message = recordValue(messageInfo?.message);
  const sender = senderFromMessageInfo(messageInfo);
  return (
    stringValue(sender?.displayName) ??
    stringValue(sender?.display_name) ??
    stringValue(sender?.name) ??
    stringValue(message?.senderName) ??
    stringValue(message?.sender_name) ??
    stringValue(notification.senderName) ??
    stringValue(notification.sender_name)
  );
}

function messageInfoConversationId(
  messageInfo: Record<string, unknown> | undefined,
) {
  const message = recordValue(messageInfo?.message);
  return (
    stringValue(message?.conversationId) ??
    stringValue(message?.conversation_id)
  );
}

function sourceLabel(sourceModule: string | undefined, locale: string) {
  const labels = sourceModule
    ? sourceLabels[sourceModule as keyof typeof sourceLabels]
    : undefined;
  return (
    labels?.[locale === "ar" ? 1 : 0] ??
    copy[locale === "ar" ? "ar" : "en"].notification
  );
}

function messagePresentationFallback(
  notification: NotificationRecord,
  locale: string,
): NotificationPresentation {
  const currentCopy = copy[locale === "ar" ? "ar" : "en"];
  return {
    actionLabel: currentCopy.openConversation,
    body:
      localizedValue(notification, "body", locale) ?? currentCopy.newMessage,
    contextLabel: currentCopy.messages,
    conversationId: communicationConversationId(notification),
    kind: "message",
    priority: priority(notification.priority),
    timestamp: timestamp(notification),
    title:
      senderName(notification, undefined) ??
      localizedValue(notification, "title", locale) ??
      currentCopy.newMessage,
  };
}

function notificationTarget(notification: NotificationRecord, locale: string) {
  const notificationId =
    stringValue(notification.notificationId) ?? stringValue(notification.id);
  return `/${locale}/communication/notifications${
    notificationId
      ? `?notificationId=${encodeURIComponent(notificationId)}`
      : ""
  }`;
}

function standardPresentationFallback(
  notification: NotificationRecord,
  locale: string,
): NotificationPresentation {
  const currentCopy = copy[locale === "ar" ? "ar" : "en"];
  const currentSourceModule =
    stringValue(notification.sourceModule) ??
    stringValue(notification.source_module);
  const announcement = isAnnouncementNotification(notification);

  return {
    actionLabel: announcement
      ? currentCopy.viewAnnouncement
      : currentCopy.viewDetails,
    body: localizedValue(notification, "body", locale) ?? "",
    contextLabel: announcement
      ? currentCopy.announcements
      : sourceLabel(currentSourceModule, locale),
    kind: announcement ? "announcement" : "notification",
    priority: priority(notification.priority),
    targetUrl: notificationTarget(notification, locale),
    timestamp: timestamp(notification),
    title:
      localizedValue(notification, "title", locale) ?? currentCopy.notification,
  };
}

export function notificationPresentationFallback(
  notification: NotificationRecord,
  locale: string,
): NotificationPresentation {
  return isMessageNotification(notification)
    ? messagePresentationFallback(notification, locale)
    : standardPresentationFallback(notification, locale);
}

async function loadMessagePresentationContext(
  notification: NotificationRecord,
  messageId: string,
) {
  const notificationConversationId = communicationConversationId(notification);
  const messageInfoRequest = settledRecord(getMessageInfo(messageId));
  const notificationConversationRequest = notificationConversationId
    ? settledRecord(getConversation(notificationConversationId))
    : undefined;
  const messageInfo = await messageInfoRequest;
  const conversationId =
    notificationConversationId ?? messageInfoConversationId(messageInfo);
  const conversation = notificationConversationRequest
    ? await notificationConversationRequest
    : conversationId
      ? await settledRecord(getConversation(conversationId))
      : undefined;
  return { conversation, conversationId, messageInfo };
}

export async function notificationPresentation(
  notification: NotificationRecord,
  locale: string,
): Promise<NotificationPresentation> {
  const fallback = notificationPresentationFallback(notification, locale);
  const messageId = notificationMessageId(notification);
  if (fallback.kind !== "message" || !messageId) {
    return fallback;
  }

  const { conversation, conversationId, messageInfo } =
    await loadMessagePresentationContext(notification, messageId);
  const sender = senderFromMessageInfo(messageInfo);

  return {
    ...fallback,
    conversationId,
    contextLabel:
      localizedValue(conversation, "title", locale) ?? fallback.contextLabel,
    senderUserId: stringValue(sender?.userId) ?? stringValue(sender?.user_id),
    title: senderName(notification, messageInfo) ?? fallback.title,
  };
}

export function formatRelativeNotificationTime(
  timestampValue: number,
  locale: string,
) {
  const elapsedSeconds = Math.round((timestampValue - Date.now()) / 1000);
  if (Math.abs(elapsedSeconds) < 60) return locale === "ar" ? "الآن" : "Now";

  const elapsedMinutes = Math.round(elapsedSeconds / 60);
  if (Math.abs(elapsedMinutes) < 60) {
    return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(
      elapsedMinutes,
      "minute",
    );
  }

  const elapsedHours = Math.round(elapsedMinutes / 60);
  if (Math.abs(elapsedHours) < 24) {
    return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(
      elapsedHours,
      "hour",
    );
  }

  const elapsedDays = Math.round(elapsedHours / 24);
  return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(
    elapsedDays,
    "day",
  );
}
