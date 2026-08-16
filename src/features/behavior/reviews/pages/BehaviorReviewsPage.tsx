"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import DataTable from "@/components/ui/data-table/DataTable";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import DatePicker from "@/components/ui/input/DatePicker";
import Button from "@/components/ui/button/Button";
import { X } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { usePermissions } from "@/hooks/usePermissions";
import { useBehaviorYearTermContext } from "@/features/behavior/shared/hooks/useBehaviorYearTermContext";
import { listBehaviorReviewQueue } from "@/features/behavior/services/behaviorApiService";
import { behaviorUiError } from "@/features/behavior/services/behaviorErrors";
import BehaviorActionModals, {
  type BehaviorModalMode,
  type BehaviorModalTarget,
} from "@/features/behavior/shared/components/BehaviorActionModals";
import {
  BehaviorCategorySearchSelect,
  BehaviorCreatedBySearchSelect,
} from "@/features/behavior/shared/components/BehaviorSearchSelects";
import {
  getBehaviorReviewCategoryLabel,
  getBehaviorReviewStudentLabel,
} from "@/features/behavior/shared/utils/behaviorUiRules";
import type {
  BehaviorRecord,
  BehaviorReviewQueueFilters,
  BehaviorReviewQueueItem,
} from "@/features/behavior/types";

function StatePanel({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-center py-16">
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>{title}</p>
    </div>
  );
}

export default function BehaviorReviewsPage() {
  const t = useTranslations("behavior");
  const locale = useLocale();
  const { yearId, termId, isReadOnly } = useBehaviorYearTermContext();
  const { hasPermission } = usePermissions();
  const canReview = !isReadOnly && hasPermission("behavior.records.review");

  const [reviewItems, setReviewItems] = useState<BehaviorReviewQueueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<BehaviorReviewQueueFilters>({});
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 350);

  const [modalMode, setModalMode] = useState<BehaviorModalMode | null>(null);
  const [modalTarget, setModalTarget] = useState<BehaviorModalTarget>({});

  const loadReviewQueue = useCallback(async () => {
    if (!yearId || !termId) return;
    const requestFilters: BehaviorReviewQueueFilters = {
      ...filters,
      academicYearId: yearId,
      termId,
      search: debouncedSearch || undefined,
    };
    setLoading(true);
    setError(null);
    try {
      const res = await listBehaviorReviewQueue(requestFilters);
      setReviewItems(res.items);
    } catch (error) {
      setError(behaviorUiError(error, t("messages.loadError"), t).message);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filters, yearId, termId, t]);

  useEffect(() => {
    void Promise.resolve().then(loadReviewQueue);
  }, [loadReviewQueue]);

  const handleApprove = (item: BehaviorReviewQueueItem) => {
    if (!canReview) return;
    const rec: BehaviorRecord = {
      id: item.id,
      termId: null,
      studentId: item.studentId,
      enrollmentId: null,
      categoryId: item.categoryId,
      category: null,
      term: null,
      enrollment: null,
      status: item.status,
      points: item.points,
      occurredAt: item.occurredAt,
      type: item.type,
    };
    setModalTarget({ record: rec });
    setModalMode("approve-record");
  };

  const handleReject = (item: BehaviorReviewQueueItem) => {
    if (!canReview) return;
    const rec: BehaviorRecord = {
      id: item.id,
      termId: null,
      studentId: item.studentId,
      enrollmentId: null,
      categoryId: item.categoryId,
      category: null,
      term: null,
      enrollment: null,
      status: item.status,
      points: item.points,
      occurredAt: item.occurredAt,
      type: item.type,
    };
    setModalTarget({ record: rec });
    setModalMode("reject-record");
  };

  if (error) return <StatePanel title={error} />;

  const fmt = (iso?: string) => (iso ? new Date(iso).toLocaleDateString() : "—");

  const updateFilter = <K extends keyof BehaviorReviewQueueFilters>(
    key: K,
    value: BehaviorReviewQueueFilters[K] | undefined,
  ) => {
    setFilters((previous) => ({ ...previous, [key]: value }));
  };

  const columns = [
    {
      key: "student",
      label: t("table.student"),
      searchable: true,
      render: (_: unknown, row: BehaviorReviewQueueItem) => (
        <span style={{ color: "var(--text-primary)" }}>
          {getBehaviorReviewStudentLabel(row)}
        </span>
      ),
    },
    {
      key: "category",
      label: t("table.category"),
      searchable: true,
      render: (_: unknown, row: BehaviorReviewQueueItem) => (
        <span style={{ color: "var(--text-primary)" }}>
          {getBehaviorReviewCategoryLabel(row, locale)}
        </span>
      ),
    },
    {
      key: "status",
      label: t("table.status"),
      render: (_: unknown, row: BehaviorReviewQueueItem) => (
        <span
          className="inline-flex px-2 py-0.5 text-xs rounded-full border"
          style={{ backgroundColor: "#fef3c7", color: "#78350f", borderColor: "#fde68a" }}
        >
          {t(`status.${row.status}`)}
        </span>
      ),
    },
    {
      key: "occurredAt",
      label: t("table.occurredAt"),
      sortable: true,
      render: (_: unknown, row: BehaviorReviewQueueItem) => (
        <span style={{ color: "var(--text-muted)" }}>{fmt(row.occurredAt)}</span>
      ),
    },
    {
      key: "actions",
      label: t("table.actions"),
      sortable: false,
      render: (_: unknown, row: BehaviorReviewQueueItem) => (
        <div className="flex items-center gap-2">
          {canReview && row.status === "submitted" && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); handleApprove(row); }}
                className="text-xs px-2 py-1 rounded border transition-colors hover:opacity-80"
                style={{ backgroundColor: "#dcfce7", color: "#14532d", borderColor: "#bbf7d0" }}
              >
                {t("actions.approve")}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleReject(row); }}
                className="text-xs px-2 py-1 rounded border transition-colors hover:opacity-80"
                style={{ backgroundColor: "#fef2f2", color: "#991b1b", borderColor: "#fecaca" }}
              >
                {t("actions.reject")}
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: "var(--border-color)" }}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <Input
            label={t("filters.search")}
            placeholder={t("advancedFilters.searchReviewPlaceholder")}
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            inputSize="sm"
          />
          <BehaviorCategorySearchSelect
            label={t("advancedFilters.categoryId")}
            value={filters.categoryId}
            onChange={(value) => updateFilter("categoryId", value || undefined)}
          />
          <BehaviorCreatedBySearchSelect
            label={t("advancedFilters.createdById")}
            value={filters.createdById}
            onChange={(value) => updateFilter("createdById", value || undefined)}
          />
          <Select
            label={t("filters.type")}
            value={filters.type ?? ""}
            onChange={(value) => updateFilter("type", value ? (value as "positive" | "negative") : undefined)}
            options={[{ value: "", label: t("filters.allTypes") }, { value: "positive", label: t("filters.positive") }, { value: "negative", label: t("filters.negative") }]}
            selectSize="sm"
          />
          <Select
            label={t("advancedFilters.severity")}
            value={filters.severity ?? ""}
            onChange={(value) => updateFilter("severity", value ? (value as "low" | "medium" | "high" | "critical") : undefined)}
            options={[{ value: "", label: t("advancedFilters.allSeverities") }, { value: "low", label: t("category.low") }, { value: "medium", label: t("category.medium") }, { value: "high", label: t("category.high") }, { value: "critical", label: t("overview.critical") }]}
            selectSize="sm"
          />
          <Select
            label={t("filters.status")}
            value={filters.status ?? ""}
            onChange={(value) => updateFilter("status", value ? (value as "submitted" | "approved" | "rejected" | "cancelled") : undefined)}
            options={[{ value: "", label: t("filters.allStatuses") }, { value: "submitted", label: t("filters.submitted") }, { value: "approved", label: t("filters.approved") }, { value: "rejected", label: t("filters.rejected") }, { value: "cancelled", label: t("status.cancelled") }]}
            selectSize="sm"
          />
          <DatePicker label={t("filters.dateFrom")} value={filters.occurredFrom ? new Date(filters.occurredFrom) : undefined} onChange={(date) => updateFilter("occurredFrom", date?.toISOString())} />
          <DatePicker label={t("filters.dateTo")} value={filters.occurredTo ? new Date(filters.occurredTo) : undefined} onChange={(date) => updateFilter("occurredTo", date?.toISOString())} />
          <DatePicker label={t("advancedFilters.submittedFrom")} value={filters.submittedFrom ? new Date(filters.submittedFrom) : undefined} onChange={(date) => updateFilter("submittedFrom", date?.toISOString())} />
          <DatePicker label={t("advancedFilters.submittedTo")} value={filters.submittedTo ? new Date(filters.submittedTo) : undefined} onChange={(date) => updateFilter("submittedTo", date?.toISOString())} />
          <Select
            label={t("advancedFilters.includeReviewed")}
            value={filters.includeReviewed ? "true" : "false"}
            onChange={(value) => updateFilter("includeReviewed", value === "true" ? true : undefined)}
            options={[{ value: "false", label: t("filters.submitted") }, { value: "true", label: t("advancedFilters.includeReviewed") }]}
            selectSize="sm"
          />
        </div>
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<X className="w-4 h-4" />}
            onClick={() => {
              setSearchInput("");
              setFilters({});
            }}
          >
            {t("filters.reset")}
          </Button>
        </div>
      </div>
      <DataTable
        columns={
          columns as unknown as {
            key: string;
            label: string;
            sortable?: boolean;
            searchable?: boolean;
            render?: (
              value: unknown,
              row: Record<string, unknown>,
            ) => React.ReactNode;
          }[]
        }
        data={reviewItems as unknown as Record<string, unknown>[]}
        isLoading={loading}
        showPagination={true}
        itemsPerPage={15}
      />

      <BehaviorActionModals
        mode={modalMode}
        target={modalTarget}
        onClose={() => setModalMode(null)}
        onSuccess={() => void loadReviewQueue()}
      />
    </div>
  );
}
