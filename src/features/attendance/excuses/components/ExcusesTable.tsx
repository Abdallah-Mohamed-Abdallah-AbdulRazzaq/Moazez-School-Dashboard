"use client";

import { useLocale, useTranslations } from "next-intl";
import { Tooltip } from "@mui/material";
import { Eye, Check, X, PencilLine, Trash2 } from "lucide-react";
import DataTable from "@/components/ui/data-table/DataTable";
import type { ExcuseRequest } from "../types";
import {
  formatExcuseDateRange,
  getSecondaryStudentName,
} from "../utils/excusePresentation";

interface ExcusesTableProps {
  requests: ExcuseRequest[];
  isReadOnly: boolean;
  canManageExcuses: boolean;
  canReviewExcuses: boolean;
  onView: (request: ExcuseRequest) => void;
  onApprove: (request: ExcuseRequest) => void;
  onReject: (request: ExcuseRequest) => void;
  onEdit: (request: ExcuseRequest) => void;
  onDelete: (request: ExcuseRequest) => void;
}

export default function ExcusesTable({ requests, isReadOnly, canManageExcuses, canReviewExcuses, onView, onApprove, onReject, onEdit, onDelete }: ExcusesTableProps) {
  const t = useTranslations("attendance.excuses.table");
  const locale = useLocale();

  const typeLabel = (type: ExcuseRequest["type"]) => {
    if (type === "ABSENCE") return t("absence");
    if (type === "LATE") return t("late");
    return t("earlyLeave");
  };

  const statusLabel = (status: ExcuseRequest["status"]) => {
    if (status === "PENDING") return t("pending");
    if (status === "APPROVED") return t("approved");
    return t("rejected");
  };

  const columns = [
    { key: "createdAt", label: t("submittedAt"), render: (_: unknown, row: ExcuseRequest) => <span>{row.createdAt.split("T")[0]}</span> },
    {
      key: "student",
      label: t("student"),
      searchable: true,
      render: (_: unknown, row: ExcuseRequest) => {
        const primaryName = locale === "ar" ? row.studentNameAr : row.studentNameEn;
        const secondaryName = getSecondaryStudentName(
          primaryName,
          locale === "ar" ? row.studentNameEn : row.studentNameAr,
        );
        return (
        <div className="min-w-0">
          <div className="truncate" style={{ color: "var(--text-primary)", fontWeight: 600 }}>{primaryName}</div>
          {secondaryName && <div className="truncate text-xs" style={{ color: "var(--text-secondary)" }}>{secondaryName}</div>}
          <div className="truncate text-xs" style={{ color: "var(--text-secondary)" }}>{row.studentNumber || "-"}</div>
        </div>
        );
      },
    },
    {
      key: "type",
      label: t("type"),
      render: (_: unknown, row: ExcuseRequest) => {
        const bg = row.type === "ABSENCE" ? "var(--color-accent-100)" : row.type === "LATE" ? "var(--color-warning-100)" : "var(--color-info-100)";
        const fg = row.type === "ABSENCE" ? "var(--color-accent-700)" : row.type === "LATE" ? "var(--color-warning-700)" : "var(--color-info-700)";
        return <span className="inline-flex px-2 py-1 rounded text-xs font-semibold" style={{ backgroundColor: bg, color: fg }}>{typeLabel(row.type)}</span>;
      },
    },
    {
      key: "range",
      label: t("range"),
      render: (_: unknown, row: ExcuseRequest) => (
        <div>
          <div>{formatExcuseDateRange(row.dateFrom, row.dateTo, locale)}</div>
          <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
            {row.selectedPeriodIds && row.selectedPeriodIds.length > 0
              ? t("selectedPeriods", { count: row.selectedPeriodIds.length })
              : row.periodIndexes && row.periodIndexes.length > 0
              ? row.periodIndexes.map((p) => `P${p}`).join(", ")
              : t("allPolicyPeriods")}
          </div>
          {row.type === "LATE" && typeof row.minutesLate === "number" && (
            <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {row.minutesLate} {t("minutes")}
            </div>
          )}
          {row.type === "EARLY_LEAVE" && typeof row.minutesEarlyLeave === "number" && (
            <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {row.minutesEarlyLeave} {t("minutes")}
            </div>
          )}
        </div>
      ),
    },
    { key: "attachments", label: t("attachments"), render: (_: unknown, row: ExcuseRequest) => <span>{row.attachmentCount ?? row.attachments.length}</span> },
    {
      key: "status",
      label: t("status"),
      render: (_: unknown, row: ExcuseRequest) => {
        const bg = row.status === "PENDING" ? "var(--color-warning-100)" : row.status === "APPROVED" ? "var(--color-success-100)" : "var(--color-accent-100)";
        const fg = row.status === "PENDING" ? "var(--color-warning-700)" : row.status === "APPROVED" ? "var(--color-success-700)" : "var(--color-accent-700)";
        return <span className="inline-flex px-2 py-1 rounded text-xs font-semibold" style={{ backgroundColor: bg, color: fg }}>{statusLabel(row.status)}</span>;
      },
    },
    {
      key: "actions",
      label: t("actions"),
      sortable: false,
      render: (_: unknown, row: ExcuseRequest) => {
        const isPending = row.status === "PENDING";
        const canManage = isPending && !isReadOnly && canManageExcuses;
        const canReview = isPending && !isReadOnly && canReviewExcuses;

        return (
          <div className="flex items-center gap-1" onClick={(event) => event.stopPropagation()}>
            <Tooltip title={t("view")} arrow>
              <button onClick={() => onView(row)} className="p-1.5 rounded" style={{ color: "var(--text-secondary)" }}>
                <Eye className="w-4 h-4" />
              </button>
            </Tooltip>
            <Tooltip title={t("approve")} arrow>
              <button disabled={!canReview} onClick={() => onApprove(row)} className="p-1.5 rounded disabled:opacity-40" style={{ color: "var(--color-success-700)" }}>
                <Check className="w-4 h-4" />
              </button>
            </Tooltip>
            <Tooltip title={t("reject")} arrow>
              <button disabled={!canReview} onClick={() => onReject(row)} className="p-1.5 rounded disabled:opacity-40" style={{ color: "var(--color-accent-700)" }}>
                <X className="w-4 h-4" />
              </button>
            </Tooltip>
            <Tooltip title={t("edit")} arrow>
              <button disabled={!canManage} onClick={() => onEdit(row)} className="p-1.5 rounded disabled:opacity-40" style={{ color: "var(--text-secondary)" }}>
                <PencilLine className="w-4 h-4" />
              </button>
            </Tooltip>
            <Tooltip title={t("delete")} arrow>
              <button disabled={!canManage} onClick={() => onDelete(row)} className="p-1.5 rounded disabled:opacity-40" style={{ color: "var(--color-accent-700)" }}>
                <Trash2 className="w-4 h-4" />
              </button>
            </Tooltip>
          </div>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns as unknown as { key: string; label: string; sortable?: boolean; searchable?: boolean; render?: (value: unknown, row: { [key: string]: unknown }) => React.ReactNode }[]}
      data={requests as unknown as { [key: string]: unknown }[]}
      onRowClick={(row) => onView(row as unknown as ExcuseRequest)}
      itemsPerPage={20}
      showPagination={true}
    />
  );
}
