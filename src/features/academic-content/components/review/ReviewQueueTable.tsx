"use client";

import { useLocale } from "next-intl";
import DataTable, { type Column } from "@/components/ui/data-table/DataTable";
import type { TeacherDirectoryListItem } from "@/features/teachers/types";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import {
  academicSubjectName,
  academicTargetScopeName,
  teacherDisplayName,
} from "../../model/academicContentDisplay";
import type { AcademicTargetOptions } from "../../services/academicContentSelectors";
import type { AcademicContentReviewQueueItem } from "../../types/contracts";

type ReviewQueueRow = AcademicContentReviewQueueItem & Record<string, unknown>;

interface ReviewQueueTableProps {
  items: AcademicContentReviewQueueItem[];
  page: number;
  limit: number;
  total: number;
  isLoading: boolean;
  searchQuery: string;
  targetOptions: AcademicTargetOptions | null;
  teachers: TeacherDirectoryListItem[];
  onOpen: (item: AcademicContentReviewQueueItem) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export default function ReviewQueueTable({
  items,
  page,
  limit,
  total,
  isLoading,
  searchQuery,
  targetOptions,
  teachers,
  onOpen,
  onPageChange,
  onPageSizeChange,
}: ReviewQueueTableProps) {
  const locale = useLocale();
  const t = useAcademicContentTranslations("review");
  const targetLabel = (
    target: AcademicContentReviewQueueItem["targets"][number],
  ) => {
    const scopeName =
      target.scopeType === "SCHOOL"
        ? t("whole_school")
        : (academicTargetScopeName(target, targetOptions, locale) ??
          t("name_unavailable"));
    if (!target.subjectId) return scopeName;
    const subjectName =
      academicSubjectName(target.subjectId, targetOptions, locale) ??
      t("name_unavailable");
    return `${scopeName} · ${subjectName}`;
  };
  const columns: Column<ReviewQueueRow>[] = [
    {
      key: "title",
      label: t("columns.title"),
      searchable: true,
      render: (title, row) => (
        <div className="min-w-48 space-y-1.5">
          <p className="font-semibold text-gray-900">{String(title)}</p>
          <span className="inline-flex rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
            {t("round", { round: row.roundNumber })}
          </span>
        </div>
      ),
    },
    {
      key: "submittedAt",
      label: t("columns.submitted"),
      render: (submittedAt) => (
        <time dateTime={String(submittedAt)} title={String(submittedAt)}>
          {new Intl.DateTimeFormat(locale, {
            dateStyle: "medium",
            timeStyle: "short",
          }).format(new Date(String(submittedAt)))}
        </time>
      ),
    },
    {
      key: "submittedByUserId",
      label: t("columns.submitted_by"),
      render: (submittedByUserId) =>
        teacherDisplayName(String(submittedByUserId), teachers) ??
        t("name_unavailable"),
    },
    {
      key: "targets",
      label: t("columns.targets"),
      render: (targets) => {
        const targetList = targets as AcademicContentReviewQueueItem["targets"];
        const visibleTargets = targetList.slice(0, 2);
        return (
          <div className="min-w-44 space-y-1">
            {visibleTargets.length > 0 ? (
              visibleTargets.map((target, index) => (
                <p
                  key={`${target.scopeType}-${index}`}
                  className="text-sm text-gray-700"
                >
                  {targetLabel(target)}
                </p>
              ))
            ) : (
              <p className="text-sm text-gray-500">{t("no_targets")}</p>
            )}
            {targetList.length > visibleTargets.length ? (
              <p className="text-xs font-medium text-indigo-700">
                {t("more_targets", {
                  count: targetList.length - visibleTargets.length,
                })}
              </p>
            ) : null}
          </div>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={items as ReviewQueueRow[]}
      getRowKey={(row) => row.approvalId}
      onRowClick={(row) => onOpen(row)}
      isLoading={isLoading}
      searchQuery={searchQuery}
      emptyTitle={t("empty_title")}
      emptyDescription={t("empty_description")}
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
