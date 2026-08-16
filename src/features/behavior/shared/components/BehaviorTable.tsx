"use client";

import { useTranslations, useLocale } from "next-intl";
import { Tooltip } from "@mui/material";
import { Ban, Eye, Send, CheckCircle, XCircle, Pencil } from "lucide-react";
import DataTable from "@/components/ui/data-table/DataTable";
import type { BehaviorRecord, BehaviorStatus, BehaviorType } from "../../types";
import {
  canApproveOrRejectBehaviorRecord,
  canCancelBehaviorRecord,
  canEditBehaviorRecord,
  canSubmitBehaviorRecord,
} from "../utils/behaviorUiRules";

// ─── Status badge ──────────────────────────────────────────────────────────
const STATUS_STYLES: Record<BehaviorStatus, { bg: string; fg: string; border: string }> = {
  draft: { bg: "var(--color-neutral-100)", fg: "var(--color-neutral-800)", border: "var(--color-neutral-200)" },
  submitted: { bg: "#fef3c7", fg: "#78350f", border: "#fde68a" },
  approved: { bg: "#dcfce7", fg: "#14532d", border: "#bbf7d0" },
  rejected: { bg: "#fef2f2", fg: "#991b1b", border: "#fecaca" },
  cancelled: { bg: "var(--color-neutral-100)", fg: "var(--color-neutral-500)", border: "var(--color-neutral-200)" },
};

const TYPE_STYLES: Record<BehaviorType, { bg: string; fg: string; border: string }> = {
  positive: { bg: "#dcfce7", fg: "#14532d", border: "#bbf7d0" },
  negative: { bg: "#fef2f2", fg: "#991b1b", border: "#fecaca" },
};

function StatusBadge({ status, label }: { status: BehaviorStatus; label: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.draft;
  return (
    <span
      className="inline-flex px-2 py-1 text-xs font-medium rounded border"
      style={{ backgroundColor: s.bg, color: s.fg, borderColor: s.border }}
    >
      {label}
    </span>
  );
}

function TypeBadge({ type, label }: { type: BehaviorType; label: string }) {
  const s = TYPE_STYLES[type] ?? TYPE_STYLES.positive;
  return (
    <span
      className="inline-flex px-2 py-1 text-xs font-medium rounded border"
      style={{ backgroundColor: s.bg, color: s.fg, borderColor: s.border }}
    >
      {label}
    </span>
  );
}

// ─── Empty state panel (inline, no attendance dependency) ──────────────────
function StatePanel({ title, compact }: { title: string; compact?: boolean }) {
  return (
    <div className={`flex items-center justify-center ${compact ? "py-12" : "py-24"}`}>
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>{title}</p>
    </div>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────
export type BehaviorTableAction = "view" | "edit" | "submit" | "cancel" | "approve" | "reject";

interface BehaviorTableProps {
  records: BehaviorRecord[];
  loading?: boolean;
  error?: string | null;
  onRowClick?: (record: BehaviorRecord) => void;
  onAction?: (action: BehaviorTableAction, record: BehaviorRecord) => void;
  canCreate?: boolean;
  canManage?: boolean;
  canReview?: boolean;
}

export default function BehaviorTable({
  records,
  loading,
  error,
  onRowClick,
  onAction,
  canCreate = false,
  canManage = false,
  canReview = false,
}: BehaviorTableProps) {
  const t = useTranslations("behavior");
  const locale = useLocale();
  const isRTL = locale === "ar";

  if (error) return <StatePanel title={error} compact />;

  const fmt = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-SA") : "—";

  const columns = [
    {
      key: "occurredAt",
      label: t("table.occurredAt"),
      sortable: true,
      render: (_: unknown, row: BehaviorRecord) => (
        <span className="text-sm" style={{ color: "var(--color-gray-900)" }}>
          {fmt(row.occurredAt)}
        </span>
      ),
    },
    {
      key: "student",
      label: t("table.student"),
      searchable: true,
      render: (_: unknown, row: BehaviorRecord) => (
        <div className="text-sm" style={{ color: "var(--color-gray-900)" }}>
          {row.student?.displayName || row.studentId}
        </div>
      ),
    },
    {
      key: "title",
      label: t("table.title"),
      render: (_: unknown, row: BehaviorRecord) => (
        <span className="text-sm" style={{ color: "var(--color-gray-800)" }}>
          {(isRTL ? row.titleAr : row.titleEn) ?? "—"}
        </span>
      ),
    },
    {
      key: "type",
      label: t("table.type"),
      render: (_: unknown, row: BehaviorRecord) =>
        row.type ? (
          <TypeBadge
            type={row.type}
            label={t(`type.${row.type}`)}
          />
        ) : (
          <span style={{ color: "var(--color-neutral-400)" }} className="text-sm">—</span>
        ),
    },
    {
      key: "status",
      label: t("table.status"),
      render: (_: unknown, row: BehaviorRecord) => (
        <StatusBadge status={row.status} label={t(`status.${row.status}`)} />
      ),
    },
    {
      key: "points",
      label: t("table.points"),
      sortable: true,
      render: (_: unknown, row: BehaviorRecord) => {
        const isPositive = row.points > 0;
        return (
          <span
            className="text-sm font-semibold"
            style={{ color: isPositive ? "#16a34a" : row.points < 0 ? "#dc2626" : "var(--color-gray-700)" }}
          >
            {isPositive ? `+${row.points}` : row.points}
          </span>
        );
      },
    },
    {
      key: "actions",
      label: t("table.actions"),
      sortable: false,
      render: (_: unknown, row: BehaviorRecord) => (
        <div className="flex items-center gap-1">
          {/* View */}
          <Tooltip title={t("actions.view")} arrow>
            <button
              onClick={(e) => { e.stopPropagation(); onAction?.("view", row); }}
              className="p-1.5 rounded hover:bg-[var(--color-neutral-100)] transition-colors"
              style={{ color: "var(--color-gray-600)" }}
            >
              <Eye className="w-4 h-4" />
            </button>
          </Tooltip>

          {/* Edit — only draft */}
          {canEditBehaviorRecord(row) && canManage && (
            <Tooltip title={t("actions.edit")} arrow>
              <button
                onClick={(e) => { e.stopPropagation(); onAction?.("edit", row); }}
                className="p-1.5 rounded hover:bg-[var(--color-neutral-100)] transition-colors"
                style={{ color: "var(--color-gray-600)" }}
              >
                <Pencil className="w-4 h-4" />
              </button>
            </Tooltip>
          )}

          {/* Submit — only draft */}
          {canSubmitBehaviorRecord(row) && canCreate && (
            <Tooltip title={t("actions.submit")} arrow>
              <button
                onClick={(e) => { e.stopPropagation(); onAction?.("submit", row); }}
                className="p-1.5 rounded hover:bg-[var(--color-neutral-100)] transition-colors"
                style={{ color: "#d97706" }}
              >
                <Send className="w-4 h-4" />
              </button>
            </Tooltip>
          )}

          {/* Approve — only submitted */}
          {canCancelBehaviorRecord(row) && canManage && (
            <Tooltip title={t("actions.cancel")} arrow>
              <button
                onClick={(e) => { e.stopPropagation(); onAction?.("cancel", row); }}
                className="p-1.5 rounded hover:bg-[var(--color-neutral-100)] transition-colors"
                style={{ color: "var(--color-gray-600)" }}
              >
                <Ban className="w-4 h-4" />
              </button>
            </Tooltip>
          )}

          {canApproveOrRejectBehaviorRecord(row) && canReview && (
            <Tooltip title={t("actions.approve")} arrow>
              <button
                onClick={(e) => { e.stopPropagation(); onAction?.("approve", row); }}
                className="p-1.5 rounded hover:bg-[var(--color-neutral-100)] transition-colors"
                style={{ color: "#16a34a" }}
              >
                <CheckCircle className="w-4 h-4" />
              </button>
            </Tooltip>
          )}

          {/* Reject — only submitted */}
          {canApproveOrRejectBehaviorRecord(row) && canReview && (
            <Tooltip title={t("actions.reject")} arrow>
              <button
                onClick={(e) => { e.stopPropagation(); onAction?.("reject", row); }}
                className="p-1.5 rounded hover:bg-[var(--color-neutral-100)] transition-colors"
                style={{ color: "#dc2626" }}
              >
                <XCircle className="w-4 h-4" />
              </button>
            </Tooltip>
          )}
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={
        columns as unknown as {
          key: string;
          label: string;
          sortable?: boolean;
          searchable?: boolean;
          render?: (
            value: unknown,
            row: { [key: string]: unknown },
          ) => React.ReactNode;
        }[]
      }
      data={records as unknown as { [key: string]: unknown }[]}
      isLoading={loading}
      onRowClick={(row) => onRowClick?.(row as unknown as BehaviorRecord)}
      searchQuery=""
      itemsPerPage={20}
      showPagination={true}
    />
  );
}
