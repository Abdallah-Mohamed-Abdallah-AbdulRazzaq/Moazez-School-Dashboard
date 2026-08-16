"use client";

import { Archive, Check, X } from "lucide-react";
import Button from "@/components/ui/button/Button";
import Modal from "@/components/ui/modal/Modal";
import CommunicationErrorState from "@/features/communication/components/layout/CommunicationErrorState";
import CommunicationLoadingState from "@/features/communication/components/layout/CommunicationLoadingState";
import type { CommunicationRecord } from "@/features/communication/types/communication.types";
import type { CommunicationNotification } from "@/features/communication/types/notification.types";

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

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(undefined, {
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
    <div className="grid gap-1 rounded-lg border border-slate-100 bg-slate-50 p-3 sm:grid-cols-[160px_1fr]">
      <dt className="text-xs font-semibold uppercase text-slate-500">{label}</dt>
      <dd className="break-words text-sm text-slate-800">{displayValue || "-"}</dd>
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
  const isRead = notification?.status === "read" || Boolean(notification?.readAt);
  const isArchived = notification?.status === "archived";
  const isOwned = Boolean(currentUserId) && (notification?.recipientUserId === currentUserId || notification?.userId === currentUserId);
  const metadata = metadataJson(notification?.metadata);

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={labels.title}
      size="xl"
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            leftIcon={<X className="h-4 w-4" aria-hidden="true" />}
          >
            {labels.close}
          </Button>
          {isOwned && notification && !isRead ? (
            <Button
              type="button"
              variant="secondary"
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
        </>
      }
    >
      <div className="space-y-4 pb-4">
        {error ? (
          <CommunicationErrorState title={labels.errorTitle} message={error} />
        ) : null}
        {isLoading ? (
          <CommunicationLoadingState label={labels.loading} />
        ) : notification ? (
          <>
            <dl className="grid gap-3">
              <DetailRow label={labels.id} value={notification.id} />
              <DetailRow
                label={labels.notificationTitle}
                value={notification.title}
              />
              <DetailRow label={labels.body} value={notification.body} />
              <DetailRow label={labels.type} value={notification.type} />
              <DetailRow label={labels.status} value={notification.status} />
              <DetailRow label={labels.priority} value={notification.priority} />
              <DetailRow
                label={labels.sourceModule}
                value={notification.sourceModule}
              />
              <DetailRow label={labels.sourceType} value={notification.sourceType} />
              <DetailRow label={labels.sourceId} value={notification.sourceId} />
              <DetailRow
                label={labels.recipientUserId}
                value={notification.recipientUserId ?? notification.userId}
              />
              <DetailRow
                label={labels.createdAt}
                value={formatDate(notification.createdAt)}
              />
              <DetailRow
                label={labels.readAt}
                value={formatDate(notification.readAt)}
              />
              <DetailRow
                label={labels.archivedAt}
                value={formatDate(notification.archivedAt)}
              />
            </dl>
            {metadata ? (
              <details className="rounded-lg border border-slate-200 bg-white p-4">
                <summary className="cursor-pointer text-sm font-semibold text-slate-900">
                  {labels.advanced}
                </summary>
                <div className="mt-3">
                  <p className="mb-2 text-xs font-semibold uppercase text-slate-500">
                    {labels.metadata}
                  </p>
                  <pre className="max-h-72 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-50">
                    {metadata}
                  </pre>
                </div>
              </details>
            ) : null}
          </>
        ) : null}
      </div>
    </Modal>
  );
}
