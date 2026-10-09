"use client";

import { useLocale } from "next-intl";
import DataTable, { type Column } from "@/components/ui/data-table/DataTable";
import AcademicContentStatusBadge from "./AcademicContentStatusBadge";
import AcademicContentSummary from "./AcademicContentSummary";
import type { AcademicContentLibraryItem } from "../../types/contracts";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";

type AcademicContentTableRow = AcademicContentLibraryItem &
  Record<string, unknown>;

interface AcademicContentTableProps {
  items: AcademicContentLibraryItem[];
  page: number;
  limit: number;
  total: number;
  isLoading: boolean;
  searchQuery: string;
  onOpen: (content: AcademicContentLibraryItem) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export default function AcademicContentTable({
  items,
  page,
  limit,
  total,
  isLoading,
  searchQuery,
  onOpen,
  onPageChange,
  onPageSizeChange,
}: AcademicContentTableProps) {
  const locale = useLocale();
  const t = useAcademicContentTranslations();
  const columns: Column<AcademicContentTableRow>[] = [
    {
      key: "title",
      label: t("library.columns.title"),
      searchable: true,
      render: (title, row) => (
        <div className="min-w-44 space-y-1">
          <p className="font-semibold text-gray-900">{String(title)}</p>
          <p className="text-xs font-medium text-indigo-700">
            {t(`types.${row.type}`)}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      label: t("library.columns.status"),
      render: (status) => (
        <AcademicContentStatusBadge
          status={status as AcademicContentLibraryItem["status"]}
        />
      ),
    },
    {
      key: "details",
      label: t("library.columns.details"),
      render: (_, row) => (
        <div className="min-w-40 space-y-1">
          <p className="text-sm font-medium text-gray-800">
            {t(`audiences.${row.audience}`)}
          </p>
          <div className="text-xs text-gray-600">
            <AcademicContentSummary summary={row.summary} />
          </div>
        </div>
      ),
    },
    {
      key: "updatedAt",
      label: t("library.columns.updated"),
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
  const rows = items as AcademicContentTableRow[];

  return (
    <DataTable
      columns={columns}
      data={rows}
      getRowKey={(row) => row.id}
      onRowClick={(row) => onOpen(row)}
      isLoading={isLoading}
      searchQuery={searchQuery}
      emptyTitle={t("library.empty_title")}
      emptyDescription={t("library.empty_description")}
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
