"use client";

import { useLocale, useTranslations } from "next-intl";
import { Eye, Copy, Ban } from "lucide-react";
import { DataTable, type Column } from "@/components/ui/data-table";
import type { ReinforcementTask } from "../../types/reinforcement";
import ReinforcementBadge from "../shared/ReinforcementBadge";
import { getProgressLabel } from "../../utils/reinforcementPresentation";

interface ReinforcementTasksTableProps {
  tasks: ReinforcementTask[];
  searchQuery?: string;
  onRowClick: (task: ReinforcementTask) => void;
  onDuplicate: (task: ReinforcementTask) => void;
  onCancel: (task: ReinforcementTask) => void;
}

export default function ReinforcementTasksTable({
  tasks,
  searchQuery,
  onRowClick,
  onDuplicate,
  onCancel,
}: ReinforcementTasksTableProps) {
  const t = useTranslations("reinforcement.table");
  const locale = useLocale();

  const columns: Column<ReinforcementTask>[] = [
    {
      key: "titleEn",
      label: t("task"),
      searchable: true,
      render: (_value, row) => (
        <div className="min-w-0">
          <div className="truncate font-semibold text-gray-900">
            {locale === "ar" ? row.titleAr : row.titleEn}
          </div>
          <div className="truncate text-xs text-gray-500">{row.id}</div>
        </div>
      ),
    },
    {
      key: "targetSummaryEn",
      label: t("audience"),
      searchable: true,
      render: (_value, row) => (
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-gray-900">
            {locale === "ar" ? row.targetSummaryAr : row.targetSummaryEn}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <ReinforcementBadge type="scope" value={row.primaryTargetType} />
            <span className="text-xs text-gray-500">
              {t("audienceCount", { count: row.audienceCount })}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "source",
      label: t("source"),
      render: (value) => (
        <ReinforcementBadge
          type="source"
          value={value as ReinforcementTask["source"]}
        />
      ),
    },
    {
      key: "status",
      label: t("status"),
      render: (value) => (
        <ReinforcementBadge
          type="status"
          value={value as ReinforcementTask["status"]}
        />
      ),
    },
    {
      key: "rewardType",
      label: t("reward"),
      render: (value, row) => (
        <div className="space-y-1">
          <ReinforcementBadge
            type="rewardType"
            value={value as ReinforcementTask["rewardType"]}
          />
          <div className="text-xs text-gray-500">{row.rewardValue}</div>
        </div>
      ),
    },
    {
      key: "stages",
      label: t("progress"),
      sortable: false,
      render: (_value, row) => (
        <span className="text-sm font-medium text-gray-700">
          {getProgressLabel(
            row.stages.filter((stage) => stage.isCompleted).length,
            row.stages.length,
          )}
        </span>
      ),
    },
    { key: "dueDate", label: t("dueDate") },
    {
      key: "actions",
      label: t("actions"),
      sortable: false,
      render: (_value, row) => (
        <div
          className="flex items-center gap-1"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            onClick={() => onRowClick(row)}
            className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-primary"
            title={t("view")}
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDuplicate(row)}
            className="rounded p-1.5 text-blue-600 hover:bg-blue-50"
            title={t("duplicate")}
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            onClick={() => onCancel(row)}
            disabled={row.status === "cancelled"}
            className="rounded p-1.5 text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
            title={t("cancelTask")}
          >
            <Ban className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns as unknown as Column<{ [key: string]: unknown }>[]}
      data={tasks as unknown as Array<{ [key: string]: unknown }>}
      onRowClick={(row) => onRowClick(row as unknown as ReinforcementTask)}
      searchQuery={searchQuery}
      showPagination={true}
      itemsPerPage={10}
      urlState={{
        keyPrefix: "reinforcementTasksTable",
        syncPagination: true,
        syncSorting: true,
      }}
    />
  );
}
