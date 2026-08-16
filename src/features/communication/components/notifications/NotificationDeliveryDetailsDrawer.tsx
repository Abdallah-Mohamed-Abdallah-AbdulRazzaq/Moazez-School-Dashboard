"use client";

import { X } from "lucide-react";
import Button from "@/components/ui/button/Button";
import Modal from "@/components/ui/modal/Modal";
import CommunicationErrorState from "@/features/communication/components/layout/CommunicationErrorState";
import CommunicationLoadingState from "@/features/communication/components/layout/CommunicationLoadingState";
import type { NotificationDelivery } from "@/features/communication/types/notification.types";

export interface NotificationDeliveryDetailsDrawerLabels {
  title: string;
  close: string;
  loading: string;
  errorTitle: string;
  id: string;
  notificationId: string;
  channel: string;
  status: string;
  provider: string;
  providerMessageId: string;
  errorCode: string;
  errorMessage: string;
  attemptedAt: string;
  sentAt: string;
  deliveredAt: string;
  failedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationDeliveryDetailsDrawerProps {
  open: boolean;
  delivery?: NotificationDelivery | null;
  isLoading?: boolean;
  error?: string | null;
  labels: NotificationDeliveryDetailsDrawerLabels;
  onClose: () => void;
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

export default function NotificationDeliveryDetailsDrawer({
  delivery,
  error,
  isLoading,
  labels,
  onClose,
  open,
}: NotificationDeliveryDetailsDrawerProps) {
  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={labels.title}
      size="xl"
      footer={
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          leftIcon={<X className="h-4 w-4" aria-hidden="true" />}
        >
          {labels.close}
        </Button>
      }
    >
      <div className="space-y-4 pb-4">
        {error ? (
          <CommunicationErrorState title={labels.errorTitle} message={error} />
        ) : null}
        {isLoading ? (
          <CommunicationLoadingState label={labels.loading} />
        ) : delivery ? (
          <dl className="grid gap-3">
            <DetailRow label={labels.id} value={delivery.id} />
            <DetailRow label={labels.notificationId} value={delivery.notificationId} />
            <DetailRow label={labels.channel} value={delivery.channel} />
            <DetailRow label={labels.status} value={delivery.status} />
            <DetailRow label={labels.provider} value={delivery.provider} />
            <DetailRow
              label={labels.providerMessageId}
              value={delivery.providerMessageId}
            />
            <DetailRow label={labels.errorCode} value={delivery.errorCode} />
            <DetailRow label={labels.errorMessage} value={delivery.errorMessage} />
            <DetailRow
              label={labels.attemptedAt}
              value={formatDate(delivery.attemptedAt)}
            />
            <DetailRow label={labels.sentAt} value={formatDate(delivery.sentAt)} />
            <DetailRow
              label={labels.deliveredAt}
              value={formatDate(delivery.deliveredAt)}
            />
            <DetailRow label={labels.failedAt} value={formatDate(delivery.failedAt)} />
            <DetailRow label={labels.createdAt} value={formatDate(delivery.createdAt)} />
            <DetailRow label={labels.updatedAt} value={formatDate(delivery.updatedAt)} />
          </dl>
        ) : null}
      </div>
    </Modal>
  );
}
