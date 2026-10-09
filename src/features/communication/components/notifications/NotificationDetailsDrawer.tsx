"use client";

import { Archive, BellRing, Check, ChevronDown, Clock3, MessageSquare, Megaphone } from "lucide-react";
import { useLocale } from "next-intl";
import Button from "@/components/ui/button/Button";
import Modal from "@/components/ui/modal/Modal";
import CommunicationErrorState from "@/features/communication/components/layout/CommunicationErrorState";
import CommunicationLoadingState from "@/features/communication/components/layout/CommunicationLoadingState";
import CommunicationStatusChip from "@/features/communication/components/layout/CommunicationStatusChip";
import { notificationPresentationFallback } from "@/features/communication/utils/notificationPresentation";
import { notificationSourceTypeLabel } from "@/features/communication/utils/notificationSourceTypeLabel";
import type { CommunicationRecord } from "@/features/communication/types/communication.types";
import type { CommunicationNotification } from "@/features/communication/types/notification.types";
import NotificationAttachments from "./NotificationAttachments";
import NotificationSourceButton from "./NotificationSourceButton";

export interface NotificationDetailsDrawerLabels {
  title: string;
  close: string;
  markRead: string;
  archive: string;
  loading: string;
  errorTitle: string;
  id: string;
  notificationTitle: string;
  body: string;
  type: string;
  status: string;
  priority: string;
  sourceModule: string;
  sourceType: string;
  sourceId: string;
  recipientUserId: string;
  createdAt: string;
  readAt: string;
  archivedAt: string;
  advanced: string;
  metadata: string;
}

export interface NotificationDetailsDrawerProps {
  open: boolean;
  notification?: CommunicationNotification | null;
  currentUserId?: string;
  isLoading?: boolean;
  isMutating?: boolean;
  error?: string | null;
  labels: NotificationDetailsDrawerLabels;
  onClose: () => void;
  onMarkRead: (notificationId: string) => Promise<void> | void;
  onArchive: (notificationId: string) => Promise<void> | void;
}

const detailCopy = {
  en: {
    technical: "Technical details",
    unread: "Unread", read: "Read", archived: "Archived",
    low: "Low priority", normal: "Normal priority", high: "High priority", urgent: "Urgent",
    noBody: "No additional message.",
  },
  ar: {
    technical: "التفاصيل التقنية",
    unread: "غير مقروء", read: "مقروء", archived: "مؤرشف",
    low: "أولوية منخفضة", normal: "أولوية عادية", high: "أولوية عالية", urgent: "عاجل",
    noBody: "لا يوجد محتوى إضافي.",
  },
};

function formatDate(value: string | null | undefined, locale: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function metadataJson(metadata?: CommunicationRecord | null) {
  if (!metadata || Object.keys(metadata).length === 0) return null;
  return JSON.stringify(metadata, null, 2);
}

function DetailRow({ label, value }: { label: string; value?: unknown }) {
  const displayValue =
    typeof value === "string" || typeof value === "number" || typeof value === "boolean"
      ? String(value)
      : "-";

  return (
    <div className="grid gap-1 border-b border-slate-100 py-3 last:border-0 sm:grid-cols-[140px_minmax(0,1fr)]">
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="min-w-0 break-words text-sm text-slate-700 [overflow-wrap:anywhere]">{displayValue || "-"}</dd>
    </div>
  );
}

export default function NotificationDetailsDrawer({
  error,
  isLoading,
  isMutating,
  labels,
  notification,
  currentUserId,
  onArchive,
  onClose,
  onMarkRead,
  open,
}: NotificationDetailsDrawerProps) {
  const locale = useLocale();
  const copy = detailCopy[locale === "ar" ? "ar" : "en"];
  const isRead = notification?.status === "read" || Boolean(notification?.readAt);
  const isArchived = notification?.status === "archived";
  const isOwned = Boolean(currentUserId) && (notification?.recipientUserId === currentUserId || notification?.userId === currentUserId);
  const metadata = metadataJson(notification?.metadata);
  const presentation = notification ? notificationPresentationFallback(notification, locale) : null;
  const NotificationIcon = presentation?.kind === "message" ? MessageSquare
    : presentation?.kind === "announcement" ? Megaphone : BellRing;
  const statusLabel = isArchived ? copy.archived : isRead ? copy.read : copy.unread;
  const priority = notification?.priority ?? "normal";

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={labels.title}
      size="lg"
      icon={<NotificationIcon className="h-6 w-6" aria-hidden="true" />}
      description={presentation?.contextLabel}
      footer={
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          {!isLoading && notification ? <NotificationSourceButton key={notification.id} notification={notification} onClose={onClose} /> : null}
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            {labels.close}
          </Button>
          {isOwned && notification && !isRead ? (
            <Button
              type="button"
              variant="primary"
              loading={isMutating}
              onClick={() => void onMarkRead(notification.id)}
              leftIcon={<Check className="h-4 w-4" aria-hidden="true" />}
            >
              {labels.markRead}
            </Button>
          ) : null}
          {isOwned && notification && !isArchived ? (
            <Button
              type="button"
              variant="ghost"
              loading={isMutating}
              onClick={() => void onArchive(notification.id)}
              leftIcon={<Archive className="h-4 w-4" aria-hidden="true" />}
            >
              {labels.archive}
            </Button>
          ) : null}
        </div>
      }
    >
      <div className="space-y-5 pb-5">
        {error ? (
          <CommunicationErrorState title={labels.errorTitle} message={error} />
        ) : null}
        {isLoading ? (
          <CommunicationLoadingState label={labels.loading} />
        ) : notification ? (
          <>
            <section className="rounded-2xl border border-primary-100 bg-primary-50/40 p-5 sm:p-6">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <CommunicationStatusChip
                  label={statusLabel}
                  tone={isArchived ? "neutral" : isRead ? "success" : "info"}
                />
                <CommunicationStatusChip
                  label={copy[priority]}
                  tone={priority === "urgent" ? "error" : priority === "high" ? "warning" : "neutral"}
                />
              </div>
              <h3 className="break-words text-xl font-bold leading-relaxed text-slate-900">
                {presentation?.title}
              </h3>
              <p className="mt-3 whitespace-pre-wrap break-words text-base leading-8 text-slate-700 [overflow-wrap:anywhere]">
                {presentation?.body || notification.message || copy.noBody}
              </p>
            </section>
            <NotificationAttachments key={notification.id} notification={notification} />
            <dl className="flex flex-wrap gap-x-8 gap-y-4 rounded-xl bg-slate-50 px-4 py-4">
              {[
                { label: labels.createdAt, date: notification.createdAt, Icon: Clock3 },
                { label: labels.readAt, date: notification.readAt, Icon: Check },
                { label: labels.archivedAt, date: notification.archivedAt, Icon: Archive },
              ].filter((event) => event.date).map(({ label, date, Icon }) => (
                <div key={label} className="min-w-0">
                  <dt className="mb-1.5 flex items-center gap-1.5 text-xs text-slate-500">
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    {label}
                  </dt>
                  <dd className="text-sm font-medium text-slate-700">{formatDate(date, locale)}</dd>
                </div>
              ))}
            </dl>
            <details className="group rounded-xl border border-slate-200 px-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-4 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 [&::-webkit-details-marker]:hidden">
                {copy.technical}
                <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
              </summary>
              <dl className="pb-3">
                <DetailRow label={labels.id} value={notification.id} />
                <DetailRow label={labels.type} value={notification.type} />
                <DetailRow label={labels.sourceModule} value={notification.sourceModule} />
                <DetailRow label={labels.sourceType} value={notificationSourceTypeLabel(notification.sourceType ?? notification.source_type, locale)} />
                <DetailRow label={labels.sourceId} value={notification.sourceId} />
                <DetailRow label={labels.recipientUserId} value={notification.recipientUserId ?? notification.userId} />
              </dl>
              {metadata ? (
                <div className="pb-4">
                  <p className="mb-2 text-xs font-semibold uppercase text-slate-500">
                    {labels.metadata}
                  </p>
                  <pre dir="ltr" className="max-h-48 overflow-auto rounded-lg bg-slate-950 p-3 text-start text-xs text-slate-50">
                    {metadata}
                  </pre>
                </div>
              ) : null}
            </details>
          </>
        ) : null}
      </div>
    </Modal>
  );
}
