"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { Button } from "@/components/ui/button/Button";
import DataTable, { type Column } from "@/components/ui/data-table/DataTable";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
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
  canManage,
  editHref,
  onDelete,
  onPageChange,
  onPageSizeChange,
}: PreparationTemplateTableProps) {
  const locale = useLocale();
  const t = useAcademicContentTranslations("templates");
  const columns: Column<PreparationTemplateRow>[] = [
    { key: "name", label: t("columns.name"), searchable: true },
    {
      key: "description",
      label: t("columns.description"),
      render: (description) => String(description || t("no_description")),
    },
    {
      key: "stageId",
      label: t("columns.scope"),
      render: (_, row) =>
        t("scope_summary", {
          stage: row.stageId || t("all_stages"),
          subject: row.subjectId || t("all_subjects"),
        }),
    },
    {
      key: "objectivesCount",
      label: t("columns.contents"),
      render: (_, row) =>
        t("content_summary", {
          objectives: row.objectivesCount,
          outcomes: row.learningOutcomesCount,
        }),
    },
    {
      key: "updatedAt",
      label: t("columns.updated"),
      render: (updatedAt) =>
        new Intl.DateTimeFormat(locale, {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(String(updatedAt))),
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
