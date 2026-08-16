"use client";

import { useMemo } from "react";
import { Eye, ShieldAlert } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/button/Button";
import DataTable, { type Column } from "@/components/ui/data-table/DataTable";
import CommunicationStatusChip from "@/features/communication/components/layout/CommunicationStatusChip";
import type { MessageReport } from "@/features/communication/types/safety.types";

export interface ReportsTableLabels {
  emptyTitle: string;
  emptyDescription: string;
  report: string;
  reporter: string;
  reportedUser: string;
  message: string;
  reason: string;
  spam: string;
  harassment: string;
  bullying: string;
  abusiveLanguage: string;
  inappropriateContent: string;
  safety: string;
  privacy: string;
  other: string;
  description: string;
  status: string;
  createdAt: string;
  open: string;
  pending: string;
  inReview: string;
  resolved: string;
  dismissed: string;
  view: string;
  unknown: string;
}

export interface ReportsTableProps {
  reports: MessageReport[];
  locale: string;
  labels: ReportsTableLabels;
  isLoading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

function formatDate(value: string | undefined, locale: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function statusTone(status?: string) {
  if (status === "resolved") return "success" as const;
  if (status === "in_review") return "warning" as const;
  if (status === "dismissed") return "default" as const;
  return "error" as const;
}

function statusLabel(status: string | undefined, labels: ReportsTableLabels) {
  if (status === "resolved") return labels.resolved;
  if (status === "in_review") return labels.inReview;
  if (status === "dismissed") return labels.dismissed;
  if (status === "pending") return labels.pending;
  return labels.open;
}

function reasonLabel(reason: string | null | undefined, labels: ReportsTableLabels) {
  switch (reason) {
    case "spam":
      return labels.spam;
    case "harassment":
      return labels.harassment;
    case "bullying":
      return labels.bullying;
    case "abusive_language":
      return labels.abusiveLanguage;
    case "inappropriate_content":
      return labels.inappropriateContent;
    case "safety":
      return labels.safety;
    case "privacy":
      return labels.privacy;
    case "other":
      return labels.other;
    default:
      return labels.unknown;
  }
}

function reporterName(report: MessageReport, fallback: string) {
  return (
    report.reporter?.name ||
    report.reporter?.nameEn ||
    report.reporter?.nameAr ||
    report.reporterId ||
    fallback
  );
}

export default function ReportsTable({
  isLoading,
  labels,
  locale,
  onPageChange,
  onPageSizeChange,
  page,
  pageSize,
  reports,
  total,
}: ReportsTableProps) {
  const columns = useMemo<Array<Column<MessageReport>>>(
    () => [
      {
        key: "id",
        label: labels.report,
        render: (value) => (
          <span className="inline-flex max-w-52 items-center gap-2 truncate text-slate-700">
            <ShieldAlert className="h-4 w-4 shrink-0 text-red-600" aria-hidden />
            {String(value)}
          </span>
        ),
      },
      {
        key: "reporterId",
        label: labels.reporter,
        render: (_value, report) => (
          <span className="block max-w-52 truncate text-slate-700">
            {reporterName(report, labels.unknown)}
          </span>
        ),
      },
      {
        key: "reportedUserId",
        label: labels.reportedUser,
        render: (value) => (
          <span className="block max-w-52 truncate text-slate-700">
            {String(value ?? labels.unknown)}
          </span>
        ),
      },
      {
        key: "messageId",
        label: labels.message,
        render: (value, report) => (
          <div className="max-w-52 text-slate-700">
            <p className="truncate font-medium">{String(value)}</p>
            <p className="mt-1 text-xs capitalize text-slate-500">
              {report.message?.status ?? labels.unknown}
            </p>
          </div>
        ),
      },
      {
        key: "reasonCode",
        label: labels.reason,
        render: (_value, report) => (
          <span className="block max-w-64 truncate text-slate-700">
            {reasonLabel(report.reasonCode ?? report.reason, labels)}
          </span>
        ),
      },
      {
        key: "reasonText",
        label: labels.description,
        render: (_value, report) => (
          <p className="line-clamp-2 max-w-64 text-slate-700">
            {report.reasonText ?? report.description ?? labels.unknown}
          </p>
        ),
      },
      {
        key: "status",
        label: labels.status,
        render: (value) => (
          <CommunicationStatusChip
            label={statusLabel(String(value), labels)}
            tone={statusTone(String(value))}
          />
        ),
      },
      {
        key: "createdAt",
        label: labels.createdAt,
        render: (value) => (
          <span className="text-slate-600">{formatDate(String(value), locale)}</span>
        ),
      },
      {
        key: "actions",
        label: labels.view,
        sortable: false,
        render: (_value, report) => (
          <Link href={`/${locale}/communication/moderation/${report.id}`}>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              leftIcon={<Eye className="h-4 w-4" aria-hidden="true" />}
            >
              {labels.view}
            </Button>
          </Link>
        ),
      },
    ],
    [labels, locale],
  );

  return (
    <DataTable<MessageReport>
      columns={columns}
      data={reports}
      getRowKey={(report) => report.id}
      isLoading={isLoading}
      emptyTitle={labels.emptyTitle}
      emptyDescription={labels.emptyDescription}
      itemsPerPage={pageSize}
      serverPagination={{
        enabled: true,
        currentPage: page,
        pageSize,
        totalItems: total,
        onPageChange,
        onPageSizeChange,
      }}
    />
  );
}
