// FILE: src/features/admissions/decisions/pages/DecisionsList.tsx

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Search,
  X,
  CheckCircle,
  XCircle,
  Clock,
  Download,
} from "lucide-react";
import { Button, DataTable, EmptyState, FilterPanel, Input, Select } from "@/components/ui";
import { KPICardV2 } from "@/components/ui/kpi-card";
import PartialLoader from "@/components/ui/loaders/PartialLoader";
import { Decision, DecisionType } from "@/features/admissions/types/admissions";
import { useAdmissionsUrlQueryState } from "@/features/admissions/shared/hooks/useAdmissionsUrlQueryState";
import AdmissionsGlobalExportModal from "@/features/admissions/shared/components/export/AdmissionsGlobalExportModal";
import { downloadAdmissionsExport } from "@/features/admissions/shared/utils/admissionsExport";
import { formatVisibleDecisionsForExport } from "@/features/admissions/applications/utils/admissionsExportUtils";
import { fetchDecisions } from "@/features/admissions/decisions/services/decisionsApiService";
import { useToast } from "@/components/ui/toast/Toast";
import { usePermissions } from "@/hooks/usePermissions";
import { AdmissionsAccessDenied } from "@/features/admissions/shared/components/AdmissionsAccessGuard";
import DecisionDetailsDrawer from "@/features/admissions/decisions/components/DecisionDetailsDrawer";
import type { AdmissionsPagination } from "@/features/admissions/shared/services/admissionsApiUtils";

const DEFAULT_PAGE_SIZE = 20;

export default function DecisionsList() {
  const t = useTranslations("admissions.decisions");
  const locale = useLocale();
  const { showToast } = useToast();
  const { hasPermission } = usePermissions();
  const canViewDecisions = hasPermission("admissions.decisions.view");

  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDecisionId, setSelectedDecisionId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [pagination, setPagination] = useState<AdmissionsPagination>({
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    total: 0,
  });
  const latestRequestId = useRef(0);
  const closeDecisionDrawer = useCallback(() => {
    setSelectedDecisionId(null);
  }, []);
  const openDecisionDrawer = useCallback((decision: Decision) => {
    setSelectedDecisionId(decision.id);
  }, []);

  const normalizeQueryValues = useCallback(
    (
      values: Record<
        "search" | "decision" | "dateFrom" | "dateTo",
        string
      >,
    ) => {
      const updates: Partial<Record<keyof typeof values, string | null>> = {};
      const validDecisions = new Set(["all", "accept", "waitlist", "reject"]);

      if (!validDecisions.has(values.decision)) {
        updates.decision = null;
      }

      return Object.keys(updates).length > 0 ? updates : null;
    },
    [],
  );

  const { values, setValue, reset } = useAdmissionsUrlQueryState<{
    search: string;
    decision: string;
    dateFrom: string;
    dateTo: string;
  }>({
    defaults: {
      search: "",
      decision: "all",
      dateFrom: "",
      dateTo: "",
    },
    debouncedKeys: ["search"],
    modeByKey: {
      search: "replace",
    },
    normalize: normalizeQueryValues,
  });

  const searchQuery = values.search;
  const decisionFilter = values.decision as DecisionType | "all";
  const dateFrom = values.dateFrom;
  const dateTo = values.dateTo;

  const loadDecisions = useCallback(async () => {
    const requestId = ++latestRequestId.current;
    if (!canViewDecisions) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const decisionsPage = await fetchDecisions({
        search: searchQuery,
        decision: decisionFilter === "all" ? undefined : decisionFilter,
        dateFrom,
        dateTo,
        page,
        limit: pageSize,
      });
      if (requestId !== latestRequestId.current) return;
      setDecisions(decisionsPage.items);
      setPagination(decisionsPage.pagination);
    } catch (err) {
      if (requestId !== latestRequestId.current) return;
      console.error("Failed to fetch decisions:", err);
      showToast("Failed to load decisions", "error");
    } finally {
      if (requestId === latestRequestId.current) setIsLoading(false);
    }
  }, [
    canViewDecisions,
    dateFrom,
    dateTo,
    decisionFilter,
    page,
    pageSize,
    searchQuery,
    showToast,
  ]);

  useEffect(() => {
    void Promise.resolve().then(loadDecisions);
  }, [loadDecisions]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const total = pagination.total;
    const accepted = decisions.filter((d) => d.decision === "accept").length;
    const waitlisted = decisions.filter((d) => d.decision === "waitlist").length;
    const rejected = decisions.filter((d) => d.decision === "reject").length;
    const acceptanceRate =
      total > 0 ? ((accepted / total) * 100).toFixed(1) : "0.0";

    return { total, accepted, waitlisted, rejected, acceptanceRate };
  }, [decisions, pagination.total]);

  const columns = useMemo(() => [
    {
      key: "studentName",
      label: t("student_name"),
      searchable: true,
      render: (value: unknown) =>
        typeof value === "string" && value.trim() ? value : "—",
    },
    {
      key: "decision",
      label: t("decision"),
      render: (value: unknown) => {
        const decision = value as DecisionType;
        const colors = {
          accept: "bg-green-100 text-green-700",
          waitlist: "bg-amber-100 text-amber-700",
          reject: "bg-red-100 text-red-700",
        };
        return (
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${colors[decision]}`}
          >
            {decision === "accept" && t("accepted")}
            {decision === "waitlist" && t("waitlisted")}
            {decision === "reject" && t("rejected")}
          </span>
        );
      },
    },
    {
      key: "decisionDate",
      label: t("decision_date"),
      render: (value: unknown) =>
        value ? new Date(value as string).toLocaleDateString() : "-",
    },
    { key: "decidedBy", label: t("decided_by"), searchable: true },
    { key: "reason", label: t("reason") },
    // Rebuild translated column labels only when the active locale changes.
    // `useTranslations()` can return a new function reference across renders,
    // which would defeat memoization and make the table churn when opening the drawer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [locale]);

  const hasActiveFilters =
    searchQuery !== "" ||
    decisionFilter !== "all" ||
    dateFrom !== "" ||
    dateTo !== "";

  const clearFilters = () => {
    setPage(1);
    reset(undefined, "replace");
  };

  const handleExport = async (format: "csv" | "json" | "excel") => {
    const exportLocale = format === "json" ? "en" : locale;
    const exportData = decisions.map((d) => ({
      ...d,
      studentName: d.studentName ?? "",
      grade: "",
    }));
    downloadAdmissionsExport({
      data: formatVisibleDecisionsForExport(exportData, exportLocale),
      format,
      filenameBase: "decisions",
      emptyMessage: hasActiveFilters ? t("no_match") : t("no_decisions"),
    });
  };

  if (!canViewDecisions) {
    return <AdmissionsAccessDenied />;
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICardV2
          title={t("total_decisions")}
          value={kpis.total}
          subtitle={`${kpis.acceptanceRate}% ${t("acceptance")}`}
          icon={CheckCircle}
          iconColor="#3b82f6"
          iconBgColor="#dbeafe"
        />
        <KPICardV2
          title={t("accepted")}
          value={kpis.accepted}
          subtitle={t("approved_applications")}
          icon={CheckCircle}
          iconColor="#10b981"
          iconBgColor="#d1fae5"
        />
        <KPICardV2
          title={t("waitlisted")}
          value={kpis.waitlisted}
          subtitle={t("pending_final_decision")}
          icon={Clock}
          iconColor="#f59e0b"
          iconBgColor="#fef3c7"
        />
        <KPICardV2
          title={t("rejected")}
          value={kpis.rejected}
          subtitle={t("declined_applications")}
          icon={XCircle}
          iconColor="#ef4444"
          iconBgColor="#fee2e2"
        />
      </div>


      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{t("title")}</h2>
          <p className="text-sm text-gray-500 mt-1">{t("subtitle")}</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setIsExportModalOpen(true)}
          leftIcon={<Download className="w-4 h-4" />}
        >
          {t("export")}
        </Button>
      </div>

      {/* Filters */}
      <FilterPanel
        searchSlot={
          <div className="flex items-center gap-3 flex-wrap">
            <div className="min-w-[200px] max-w-md flex-1">
              <Input
                type="text"
                placeholder={t("search_placeholder")}
                value={searchQuery}
                onChange={(e) => {
                  setPage(1);
                  setValue("search", e.target.value, "replace");
                }}
                leftIcon={<Search className="w-4 h-4" />}
                className={searchQuery ? "border-primary ring-2 ring-primary/20" : ""}
              />
            </div>
            {hasActiveFilters && (
              <Button
                type="button"
                variant="danger"
                onClick={clearFilters}
                leftIcon={<X className="w-4 h-4" />}
              >
                {t("clear_filters")}
              </Button>
            )}
          </div>
        }
        filtersSlot={
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <Select
              label={t("decision")}
              value={decisionFilter}
              onChange={(value) => {
                setPage(1);
                setValue(
                  "decision",
                  value as DecisionType | "all",
                  "push",
                );
              }}
              options={[
                { value: "all", label: t("all_decisions") },
                { value: "accept", label: t("accept") },
                { value: "waitlist", label: t("waitlist") },
                { value: "reject", label: t("reject") },
              ]}
              className="max-w-xs"
            />
            <Input
              type="date"
              aria-label={t("date_from")}
              value={dateFrom}
              onChange={(event) => {
                setPage(1);
                setValue("dateFrom", event.target.value, "push");
              }}
            />
            <Input
              type="date"
              aria-label={t("date_to")}
              value={dateTo}
              onChange={(event) => {
                setPage(1);
                setValue("dateTo", event.target.value, "push");
              }}
            />
          </div>
        }
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        clearAction={null}
        hasActiveFilters={hasActiveFilters}
        toggleTitle={t("filters")}
        toggleAriaLabel={t("filters")}
        className="p-0 bg-transparent shadow-none"
      />

      {/* Table */}
      {isLoading ? (
        <div className="bg-white rounded-xl p-12 shadow-sm">
          <PartialLoader />
        </div>
      ) : decisions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm">
          <EmptyState
            message={hasActiveFilters ? t("no_match") : t("no_decisions")}
            action={hasActiveFilters ? (
              <Button
                type="button"
                variant="ghost"
              onClick={clearFilters}
            >
              {t("clear_filters")}
              </Button>
            ) : undefined}
          />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={decisions as (Decision & { [key: string]: unknown })[]}
          onRowClick={openDecisionDrawer}
          searchQuery={searchQuery}
          urlState={{
            keyPrefix: "decisionsTable",
            syncSorting: true,
          }}
          serverPagination={{
            enabled: true,
            currentPage: pagination.page,
            pageSize: pagination.limit,
            totalItems: pagination.total,
            onPageChange: setPage,
            onPageSizeChange: (nextPageSize) => {
              setPage(1);
              setPageSize(nextPageSize);
            },
          }}
        />
      )}

      <AdmissionsGlobalExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={({ format }) => handleExport(format)}
        mode="list"
        confirmLabel={t("export")}
        datasetCount={decisions.length}
        emptyStateMessage={hasActiveFilters ? t("no_match") : t("no_decisions")}
      />
      <DecisionDetailsDrawer
        decisionId={selectedDecisionId}
        isOpen={selectedDecisionId !== null}
        onClose={closeDecisionDrawer}
      />
    </div>
  );
}
