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
    { key: "title", label: t("library.columns.title"), searchable: true },
    {
      key: "type",
      label: t("library.columns.type"),
      render: (type) => t(`types.${String(type)}`),
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
      key: "audience",
      label: t("library.columns.audience"),
      render: (audience) => t(`audiences.${String(audience)}`),
    },
    {
      key: "summary",
      label: t("library.columns.summary"),
      render: (_, row) => <AcademicContentSummary summary={row.summary} />,
    },
    {
      key: "updatedAt",
      label: t("library.columns.updated"),
      render: (updatedAt) =>
        new Intl.DateTimeFormat(locale, {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(String(updatedAt))),
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
