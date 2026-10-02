"use client";

import { useLocale } from "next-intl";
import DataTable, { type Column } from "@/components/ui/data-table/DataTable";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import type { AcademicContentReviewQueueItem } from "../../types/contracts";

type ReviewQueueRow = AcademicContentReviewQueueItem & Record<string, unknown>;

interface ReviewQueueTableProps {
  items: AcademicContentReviewQueueItem[];
  page: number;
  limit: number;
  total: number;
  isLoading: boolean;
  searchQuery: string;
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
  onOpen,
  onPageChange,
  onPageSizeChange,
}: ReviewQueueTableProps) {
  const locale = useLocale();
  const t = useAcademicContentTranslations("review");
  const columns: Column<ReviewQueueRow>[] = [
    { key: "title", label: t("columns.title"), searchable: true },
    {
      key: "roundNumber",
      label: t("columns.round"),
      render: (roundNumber) => t("round", { round: Number(roundNumber) }),
    },
    {
      key: "submittedAt",
      label: t("columns.submitted"),
      render: (submittedAt) =>
        new Intl.DateTimeFormat(locale, {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(String(submittedAt))),
    },
    {
      key: "submittedByUserId",
      label: t("columns.submitted_by"),
    },
    {
      key: "targets",
      label: t("columns.targets"),
      render: (targets) =>
        t("target_count", {
          count: (targets as AcademicContentReviewQueueItem["targets"]).length,
        }),
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
