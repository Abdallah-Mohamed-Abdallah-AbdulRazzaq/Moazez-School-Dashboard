"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { Button } from "@/components/ui/button/Button";
import DataTable, { type Column } from "@/components/ui/data-table/DataTable";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import { localizedAcademicName } from "../../model/academicContentDisplay";
import type { AcademicTargetOptions } from "../../services/academicContentSelectors";
import type { AcademicContentPreparationTemplateListItem } from "../../types/contracts";

type PreparationTemplateRow = AcademicContentPreparationTemplateListItem &
  Record<string, unknown>;

interface PreparationTemplateTableProps {
  items: AcademicContentPreparationTemplateListItem[];
  page: number;
  limit: number;
  total: number;
  isLoading: boolean;
  searchQuery: string;
  targetOptions: AcademicTargetOptions | null;
  canManage: boolean;
  editHref: (templateId: string) => string;
  onDelete: (template: AcademicContentPreparationTemplateListItem) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export default function PreparationTemplateTable({
  items,
  page,
  limit,
  total,
  isLoading,
  searchQuery,
  targetOptions,
  canManage,
  editHref,
  onDelete,
  onPageChange,
  onPageSizeChange,
}: PreparationTemplateTableProps) {
  const locale = useLocale();
  const t = useAcademicContentTranslations("templates");
  const columns: Column<PreparationTemplateRow>[] = [
    {
      key: "name",
      label: t("columns.name"),
      searchable: true,
      render: (name, row) => (
        <div className="min-w-48 space-y-1">
          <p className="font-semibold text-gray-900">{String(name)}</p>
          <p className="line-clamp-2 text-xs text-gray-600">
            {row.description || t("no_description")}
          </p>
        </div>
      ),
    },
    {
      key: "stageId",
      label: t("columns.scope"),
      render: (_, row) => {
        const stageName = row.stageId
          ? (localizedAcademicName(
              targetOptions?.structure.stages.find(
                (stage) => stage.id === row.stageId,
              ),
              locale,
            ) ?? t("name_unavailable"))
          : t("all_stages");
        const subjectName = row.subjectId
          ? (localizedAcademicName(
              targetOptions?.subjects.find(
                (subject) => subject.id === row.subjectId,
              ),
              locale,
            ) ?? t("name_unavailable"))
          : t("all_subjects");
        return (
          <div className="flex min-w-36 flex-wrap gap-1.5">
            <span className="rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-800">
              {stageName}
            </span>
            <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800">
              {subjectName}
            </span>
          </div>
        );
      },
    },
    {
      key: "objectivesCount",
      label: t("columns.contents"),
      render: (_, row) => (
        <div className="min-w-44 space-y-1 text-xs text-gray-700">
          <p>
            {t("content_summary", {
              objectives: row.objectivesCount,
              outcomes: row.learningOutcomesCount,
            })}
          </p>
          <p>
            {t("content_summary_secondary", {
              strategies: row.teachingStrategiesCount,
              activities: row.activitiesCount,
            })}
          </p>
        </div>
      ),
    },
    {
      key: "updatedAt",
      label: t("columns.updated"),
      render: (updatedAt) => (
        <time dateTime={String(updatedAt)}>
          {new Intl.DateTimeFormat(locale, {
            dateStyle: "medium",
            timeStyle: "short",
          }).format(new Date(String(updatedAt)))}
        </time>
      ),
    },
  ];

  if (canManage) {
    columns.push({
      key: "actions",
      label: t("columns.actions"),
      render: (_, row) => (
        <div className="flex flex-wrap justify-end gap-2">
          <Link
            href={editHref(row.id)}
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <Pencil aria-hidden="true" className="size-3.5" />
            {t("edit")}
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
            leftIcon={<Trash2 aria-hidden="true" className="size-3.5" />}
            onClick={() => onDelete(row)}
          >
            {t("delete")}
          </Button>
        </div>
      ),
    });
  }

  return (
    <DataTable
      columns={columns}
      data={items as PreparationTemplateRow[]}
      getRowKey={(row) => row.id}
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
