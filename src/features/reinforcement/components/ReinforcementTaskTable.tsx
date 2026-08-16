"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import DataTable, { type Column } from "@/components/ui/data-table/DataTable";
import type { ReinforcementRewardType, ReinforcementTask } from "../types";
import ReinforcementBadge from "./shared/ReinforcementBadge";

interface ReinforcementTaskTableProps {
  tasks: ReinforcementTask[];
  loading?: boolean;
  canManage?: boolean;
  onDuplicate: (task: ReinforcementTask) => void;
  onCancel: (task: ReinforcementTask) => void;
  total?: number;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
}

const taskTitle = (task: ReinforcementTask, locale: string) =>
  locale === "ar"
    ? task.titleAr || task.titleEn || task.id
    : task.titleEn || task.titleAr || task.id;

const VALID_REWARD_TYPES = new Set<ReinforcementRewardType>([
  "xp",
  "badge",
  "moral",
  "financial",
]);

const VALID_SOURCES = new Set(["teacher", "parent", "system"]);

type Translator = ReturnType<typeof useTranslations>;

const toLabel = (key: string): string =>
  key
    .replace(/[._-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/^\w/, (letter) => letter.toUpperCase());

const hasMessage = (t: Translator, key: string): boolean =>
  typeof t.has === "function" ? t.has(key) : true;

const sourceLabel = (source: unknown, t: Translator) => {
  const value = typeof source === "string" ? source : "";
  const key = `source.${value}`;
  return value && VALID_SOURCES.has(value) && hasMessage(t, key)
    ? t(key)
    : value
      ? toLabel(value)
      : "-";
};

const rewardCell = (task: ReinforcementTask, locale: string) => {
  const rewardType =
    typeof task.reward.type === "string" && VALID_REWARD_TYPES.has(task.reward.type)
      ? task.reward.type
      : undefined;
  if (!rewardType) return <span className="text-gray-400">-</span>;

  return (
    <div className="flex items-center gap-2 whitespace-nowrap">
      <ReinforcementBadge value={rewardType} type="rewardType" />
      {task.reward.value !== null ? (
        <span className="font-bold tabular-nums text-gray-900">
          {new Intl.NumberFormat(locale).format(task.reward.value)}
        </span>
      ) : null}
    </div>
  );
};

export default function ReinforcementTaskTable({
  tasks,
  loading = false,
  canManage = false,
  onDuplicate,
  onCancel,
  total,
  currentPage = 1,
  pageSize = 25,
  onPageChange,
}: ReinforcementTaskTableProps) {
  const locale = useLocale();
  const t = useTranslations("reinforcement");

  const columns: Column<ReinforcementTask>[] = [
    {
      key: "titleEn",
      label: t("tasks.table.task"),
      searchable: true,
      render: (_value, task) => (
        <div className="max-w-sm">
          <div className="font-semibold text-gray-900">{taskTitle(task, locale)}</div>
          <div className="mt-1 line-clamp-2 text-sm text-gray-500">
            {locale === "ar" ? task.descriptionAr || task.descriptionEn : task.descriptionEn || task.descriptionAr}
          </div>
        </div>
      ),
    },
    { key: "source", label: t("tasks.table.source"), render: (value) => sourceLabel(value, t) },
    {
      key: "status",
      label: t("tasks.table.status"),
      render: (_value, task) => (
        <ReinforcementBadge value={task.status} type="status" />
      ),
    },
    { key: "reward", label: t("tasks.table.reward"), render: (_value, task) => rewardCell(task, locale) },
    {
      key: "dueDate",
      label: t("tasks.table.dueDate"),
      render: (value) => value
        ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(String(value)))
        : "-",
    },
    {
      key: "actions",
      label: t("tasks.table.actions"),
      sortable: false,
      render: (_value, task) => {
        const isCancelled = task.status === "cancelled";
        return (
          <div className="flex flex-wrap gap-2" onClick={(event) => event.stopPropagation()}>
            <Link href={`/${locale}/reinforcement/tasks/${task.id}`}>
              <Button type="button" variant="secondary" size="sm">{t("tasks.table.view")}</Button>
            </Link>
            {canManage ? <Button type="button" variant="secondary" size="sm" onClick={() => onDuplicate(task)}>{t("actions.duplicate")}</Button> : null}
            {canManage && !isCancelled ? <Button type="button" variant="danger" size="sm" onClick={() => onCancel(task)}>{t("actions.cancel")}</Button> : null}
          </div>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={tasks}
      isLoading={loading}
      showPagination
      itemsPerPage={pageSize}
      emptyTitle={t("emptyStates.tasks")}
      serverPagination={onPageChange ? {
        enabled: true,
        currentPage,
        pageSize,
        totalItems: total ?? tasks.length,
        onPageChange,
        onPageSizeChange: () => undefined,
      } : undefined}
    />
  );
}
