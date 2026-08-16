"use client";

import { DataTable } from "@/components/ui";
import DeliveryStatusBadge from "@/features/settings/email/deliveries/components/DeliveryStatusBadge";
import type {
  EmailDeliveryRecipient,
  EmailRecipientStatus,
} from "@/features/settings/email/deliveries/types";

interface DeliveryRecipientTableProps {
  recipients: EmailDeliveryRecipient[];
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  labels: {
    recipient: string;
    email: string;
    status: string;
    attempts: string;
    lastAttemptAt: string;
    failureReason: string;
    skippedReason: string;
    sentAt: string;
    updatedAt: string;
    notAvailable: string;
    statusLabels: Record<EmailRecipientStatus, string>;
  };
}

function formatDate(value: string | null | undefined, fallback: string) {
  return value ? new Date(value).toLocaleString() : fallback;
}

export default function DeliveryRecipientTable({
  recipients,
  page,
  limit,
  total,
  onPageChange,
  onPageSizeChange,
  labels,
}: DeliveryRecipientTableProps) {
  const columns = [
    {
      key: "fullName",
      label: labels.recipient,
      searchable: true,
      render: (value: unknown, row: Record<string, unknown>) => {
        const recipient = row as unknown as EmailDeliveryRecipient;
        return (
          <div className="min-w-48">
            <p className="font-medium text-gray-900">
              {String(value || labels.notAvailable)}
            </p>
            {recipient.userId ? (
              <p className="mt-1 break-all text-xs text-gray-500">
                {recipient.userId}
              </p>
            ) : null}
          </div>
        );
      },
    },
    {
      key: "recipientEmail",
      label: labels.email,
      searchable: true,
      render: (value: unknown) => (
        <span className="break-all">
          {String(value || labels.notAvailable)}
        </span>
      ),
    },
    {
      key: "status",
      label: labels.status,
      render: (value: unknown) => {
        const status = value as EmailRecipientStatus;
        return (
          <DeliveryStatusBadge
            status={status}
            label={labels.statusLabels[status] || status}
          />
        );
      },
    },
    {
      key: "attempts",
      label: labels.attempts,
      render: (value: unknown) => String(value),
    },
    {
      key: "lastAttemptAt",
      label: labels.lastAttemptAt,
      render: (value: unknown) =>
        formatDate(value as string | null, labels.notAvailable),
    },
    {
      key: "failureReason",
      label: labels.failureReason,
      render: (value: unknown) => String(value || labels.notAvailable),
    },
    {
      key: "sentAt",
      label: labels.sentAt,
      render: (value: unknown) =>
        formatDate(value as string | null | undefined, labels.notAvailable),
    },
    {
      key: "skippedReason",
      label: labels.skippedReason,
      render: (value: unknown) => String(value || labels.notAvailable),
    },
    {
      key: "updatedAt",
      label: labels.updatedAt,
      render: (value: unknown) =>
        formatDate(value as string, labels.notAvailable),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={recipients as unknown as Record<string, unknown>[]}
      showPagination
      itemsPerPage={limit}
      serverPagination={{
        enabled: true,
        currentPage: page,
        pageSize: limit,
        totalItems: total,
        onPageChange,
        onPageSizeChange,
      }}
    />
  );
}
