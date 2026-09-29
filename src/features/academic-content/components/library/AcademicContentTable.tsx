"use client";

import { useLocale } from "next-intl";
import DataTable, { type Column } from "@/components/ui/data-table/DataTable";
import AcademicContentStatusBadge from "./AcademicContentStatusBadge";
import AcademicContentSummary from "./AcademicContentSummary";
import type { AcademicContentLibraryItem } from "../../types/contracts";

type AcademicContentTableRow = AcademicContentLibraryItem &
  Record<string, unknown>;

function enumLabel(enumValue: string): string {
  return enumValue
    .toLowerCase()
    .split("_")
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

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
  const columns: Column<AcademicContentTableRow>[] = [
    { key: "title", label: "Title", searchable: true },
    {
      key: "type",
      label: "Type",
      render: (type) => enumLabel(String(type)),
    },
    {
      key: "status",
      label: "Status",
      render: (status) => (
        <AcademicContentStatusBadge
          status={status as AcademicContentLibraryItem["status"]}
        />
      ),
    },
    {
      key: "audience",
      label: "Audience",
      render: (audience) => enumLabel(String(audience)),
    },
    {
      key: "summary",
      label: "Summary",
      render: (_, row) => <AcademicContentSummary summary={row.summary} />,
    },
    {
      key: "updatedAt",
      label: "Updated",
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
      emptyTitle="No academic content yet"
      emptyDescription="Create content or change the current filters."
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
