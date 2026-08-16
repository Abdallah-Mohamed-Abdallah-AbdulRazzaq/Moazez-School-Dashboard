"use client";

import Link from "next/link";
import { Eye, XCircle } from "lucide-react";
import { useLocale } from "next-intl";
import Button from "@/components/ui/button/Button";
import { DataTable } from "@/components/ui";
import DeliveryStatusBadge from "@/features/settings/email/deliveries/components/DeliveryStatusBadge";
import type {
  EmailDeliveryBatch,
  EmailDeliveryKind,
  EmailDeliveryStatus,
} from "@/features/settings/email/deliveries/types";

interface DeliveryBatchTableProps {
  batches: EmailDeliveryBatch[];
  page: number;
  limit: number;
  total: number;
  canManage: boolean;
  isLoading?: boolean;
  isCancellingBatchId?: string | null;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onCancel: (batch: EmailDeliveryBatch) => void;
  labels: {
    kind: string;
    status: string;
    subject: string;
    total: string;
    queued: string;
    sent: string;
    failed: string;
    skipped: string;
    createdAt: string;
    actions: string;
    view: string;
    cancel: string;
    notAvailable: string;
    kindLabels: Record<EmailDeliveryKind, string>;
    statusLabels: Record<EmailDeliveryStatus, string>;
  };
}

function formatDate(value: string | null | undefined, fallback: string) {
  return value ? new Date(value).toLocaleString() : fallback;
}

export default function DeliveryBatchTable({
  batches,
  page,
  limit,
  total,
  canManage,
  isLoading = false,
  isCancellingBatchId,
  onPageChange,
  onPageSizeChange,
  onCancel,
  labels,
}: DeliveryBatchTableProps) {
  const locale = useLocale();
  const columns = [
    {
      key: "kind",
      label: labels.kind,
      render: (value: unknown) =>
        labels.kindLabels[value as EmailDeliveryKind] || String(value),
    },
    {
      key: "status",
      label: labels.status,
      render: (value: unknown) => {
        const status = value as EmailDeliveryStatus;
        return (
          <DeliveryStatusBadge
            status={status}
            label={labels.statusLabels[status] || status}
          />
        );
      },
    },
    {
      key: "subject",
      label: labels.subject,
      searchable: true,
      render: (value: unknown, row: Record<string, unknown>) => {
        const batch = row as unknown as EmailDeliveryBatch;
        return (
          <div className="min-w-56">
            <p className="font-medium text-gray-900">
              {String(value || labels.notAvailable)}
            </p>
            <p className="mt-1 break-all text-xs text-gray-500">
              {batch.batchId}
            </p>
          </div>
        );
      },
    },
    { key: "totalRecipients", label: labels.total },
    { key: "queuedCount", label: labels.queued },
    { key: "sentCount", label: labels.sent },
    { key: "failedCount", label: labels.failed },
    { key: "skippedCount", label: labels.skipped },
    {
      key: "createdAt",
      label: labels.createdAt,
      render: (value: unknown) =>
        formatDate(value as string | null | undefined, labels.notAvailable),
    },
    {
      key: "batchId",
      label: labels.actions,
      sortable: false,
      render: (value: unknown, row: Record<string, unknown>) => {
        const batch = row as unknown as EmailDeliveryBatch;
        const batchId = String(value);
        return (
          <div className="flex gap-2">
            <Link href={`/${locale}/settings/email/deliveries/${batchId}`}>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 rounded-lg border border-gray-200 p-0"
                title={labels.view}
                aria-label={labels.view}
              >
                <Eye className="h-4 w-4 text-info" />
              </Button>
            </Link>
            {canManage && batch.cancellable ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 rounded-lg border border-gray-200 p-0"
                title={labels.cancel}
                aria-label={labels.cancel}
                loading={isCancellingBatchId === batch.batchId}
                onClick={(event) => {
                  event.stopPropagation();
                  onCancel(batch);
                }}
              >
                <XCircle className="h-4 w-4 text-red-500" />
              </Button>
            ) : null}
          </div>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={batches as unknown as Record<string, unknown>[]}
      isLoading={isLoading}
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
