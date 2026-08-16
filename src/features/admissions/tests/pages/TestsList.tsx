// FILE: src/features/admissions/tests/pages/TestsList.tsx

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  X,
  Calendar,
  CheckCircle,
  Clock,
  Edit,
  Download,
} from "lucide-react";
import {
  Button,
  DataTable,
  EmptyState,
  FilterPanel,
  Input,
  Select,
} from "@/components/ui";
import PartialLoader from "@/components/ui/loaders/PartialLoader";
import StatusBadge from "@/features/admissions/shared/StatusBadge";
import ScheduleTestModal from "@/features/admissions/tests/components/ScheduleTestModal";
import TestScoreModal from "@/features/admissions/tests/components/TestScoreModal";
import { Test, TestStatus } from "@/features/admissions/types/admissions";
import { KPICardV2 } from "@/components/ui";
import { useAdmissionsUrlQueryState } from "@/features/admissions/shared/hooks/useAdmissionsUrlQueryState";
import AdmissionsGlobalExportModal from "@/features/admissions/shared/components/export/AdmissionsGlobalExportModal";
import { downloadAdmissionsExport } from "@/features/admissions/shared/utils/admissionsExport";
import { formatVisibleTestsForExport } from "@/features/admissions/applications/utils/admissionsExportUtils";
import {
  fetchPlacementTests,
  createPlacementTest,
  completePlacementTest,
} from "@/features/admissions/tests/services/testsApiService";
import { useToast } from "@/components/ui/toast/Toast";
import { usePermissions } from "@/hooks/usePermissions";
import { AdmissionsAccessDenied } from "@/features/admissions/shared/components/AdmissionsAccessGuard";
import type { AdmissionsPagination } from "@/features/admissions/shared/services/admissionsApiUtils";

const DEFAULT_PAGE_SIZE = 20;

export default function TestsList() {
  const t = useTranslations("admissions.tests");
  const locale = useLocale();
  const router = useRouter();
  const { showToast } = useToast();
  const { hasPermission } = usePermissions();
  const canViewTests = hasPermission("admissions.tests.view");
  const canManageTests = hasPermission("admissions.tests.manage");
  const canScheduleTests =
    canManageTests && hasPermission("admissions.applications.view");

  const [tests, setTests] = useState<(Test & { studentName: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState<
    (Test & { studentName: string }) | null
  >(null);
  const [isScheduleTestOpen, setIsScheduleTestOpen] = useState(false);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [pagination, setPagination] = useState<AdmissionsPagination>({
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    total: 0,
  });
  const latestRequestId = useRef(0);

  const normalizeQueryValues = useCallback(
    (
      values: Record<
        "search" | "status" | "type" | "dateFrom" | "dateTo",
        string
      >,
    ) => {
      const updates: Partial<Record<keyof typeof values, string | null>> = {};
      const validStatuses = new Set([
        "all",
        "scheduled",
        "completed",
        "failed",
      ]);

      if (!validStatuses.has(values.status)) {
        updates.status = null;
      }

      return Object.keys(updates).length > 0 ? updates : null;
    },
    [],
  );

  const { values, setValue, reset } = useAdmissionsUrlQueryState<{
    search: string;
    status: string;
    type: string;
    dateFrom: string;
    dateTo: string;
  }>({
    defaults: {
      search: "",
      status: "all",
      type: "",
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
  const statusFilter = values.status as TestStatus | "all";
  const typeFilter = values.type;
  const dateFrom = values.dateFrom;
  const dateTo = values.dateTo;

  const loadTests = useCallback(async () => {
    const requestId = ++latestRequestId.current;
    if (!canViewTests) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const testsPage = await fetchPlacementTests({
        search: searchQuery,
        status: statusFilter === "all" ? undefined : statusFilter,
        type: typeFilter,
        dateFrom,
        dateTo,
        page,
        limit: pageSize,
      });
      if (requestId !== latestRequestId.current) return;
      setTests(
        testsPage.items.map((test) => ({
          ...test,
          studentName: test.studentName || "",
        })),
      );
      setPagination(testsPage.pagination);
    } catch (err) {
      if (requestId !== latestRequestId.current) return;
      console.error("Failed to fetch tests:", err);
      showToast("Failed to load tests", "error");
    } finally {
      if (requestId === latestRequestId.current) setIsLoading(false);
    }
  }, [
    canViewTests,
    dateFrom,
    dateTo,
    page,
    pageSize,
    searchQuery,
    showToast,
    statusFilter,
    typeFilter,
  ]);

  useEffect(() => {
    void Promise.resolve().then(loadTests);
  }, [loadTests]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const total = pagination.total;
    const scheduled = tests.filter((t) => t.status === "scheduled").length;
    const completed = tests.filter((t) => t.status === "completed").length;
    const failed = tests.filter((t) => t.status === "failed").length;

    const completedWithScores = tests.filter(
      (t) => t.status === "completed" && t.score !== undefined,
    );
    const avgScore =
      completedWithScores.length > 0
        ? Math.round(
            completedWithScores.reduce((sum, t) => sum + (t.score || 0), 0) /
              completedWithScores.length,
          )
        : 0;

    return { total, scheduled, completed, failed, avgScore };
  }, [pagination.total, tests]);

  const columns = [
    { key: "studentName", label: t("student_name"), searchable: true },
    { key: "type", label: t("test_type") },
    {
      key: "scheduledAt",
      label: t("date"),
      render: (value: unknown) =>
        value ? new Date(value as string).toLocaleDateString() : "-",
    },
    {
      key: "status",
      label: t("status"),
      render: (value: unknown) => <StatusBadge status={value as TestStatus} />,
    },
    {
      key: "score",
      label: t("score"),
      render: (value: unknown) =>
        value !== undefined && value !== null ? `${value}` : "-",
    },
    {
      key: "actions",
      label: t("actions_col"),
      render: (_value: unknown, row: Test & { studentName: string }) =>
        !canManageTests || row.status === "cancelled" ? null : (
          <Button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTest(row);
              setIsScoreModalOpen(true);
            }}
            variant="outline"
            size="sm"
            leftIcon={<Edit className="w-3 h-3" />}
            className="px-3 py-1.5"
            title="Enter/Edit Score"
          >
            {row.score !== undefined ? t("edit") : t("enter")}{" "}
            {t("enter_score")}
          </Button>
        ),
    },
  ];

  const hasActiveFilters =
    searchQuery !== "" ||
    statusFilter !== "all" ||
    typeFilter !== "" ||
    dateFrom !== "" ||
    dateTo !== "";

  const clearFilters = () => {
    setPage(1);
    reset(undefined, "replace");
  };

  const handleRowClick = (
    test: Test & { studentName: string; [key: string]: unknown },
  ) => {
    router.push(`/${locale}/admissions/tests/${test.id}`);
  };

  const handleTestSubmit = async (data: {
    applicationId: string;
    studentName: string;
    date: string;
    time: string;
    type: string;
    subjectId: string;
    subjectName: string;
  }) => {
    try {
      await createPlacementTest({
        applicationId: data.applicationId,
        subjectId: data.subjectId,
        type: data.type || "Placement Test",
        date: data.date,
        time: data.time,
      });
      showToast("Test scheduled successfully!", "success");
      setIsScheduleTestOpen(false);
      await loadTests();
    } catch (err) {
      console.error("Failed to schedule test:", err);
      showToast("Failed to schedule test. Please try again.", "error");
    }
  };

  const handleScoreSubmit = async (
    testId: string,
    score: number,
    result?: string,
  ) => {
    try {
      await completePlacementTest(testId, {
        score,
        result,
      });
      showToast("Test score saved successfully!", "success");
      setIsScoreModalOpen(false);
      setSelectedTest(null);
      await loadTests();
    } catch (err) {
      console.error("Failed to save test score:", err);
      showToast("Failed to save test score. Please try again.", "error");
    }
  };

  const handleExport = async (format: "csv" | "json" | "excel") => {
    const exportLocale = format === "json" ? "en" : locale;
    downloadAdmissionsExport({
      data: formatVisibleTestsForExport(tests, exportLocale),
      format,
      filenameBase: "tests",
      emptyMessage: hasActiveFilters ? t("no_match") : t("no_tests"),
    });
  };

  if (!canViewTests) {
    return <AdmissionsAccessDenied />;
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICardV2
          title={t("total_tests")}
          value={kpis.total}
          subtitle={`${kpis.scheduled} ${t("scheduled")}`}
          icon={Calendar}
          iconColor="#3b82f6"
          iconBgColor="#dbeafe"
        />
        <KPICardV2
          title={t("scheduled")}
          value={kpis.scheduled}
          subtitle={t("upcoming_tests")}
          icon={Clock}
          iconColor="#f59e0b"
          iconBgColor="#fef3c7"
        />
        <KPICardV2
          title={t("completed")}
          value={kpis.completed}
          subtitle={`${kpis.failed} ${t("failed")}`}
          icon={CheckCircle}
          iconColor="#10b981"
          iconBgColor="#d1fae5"
        />
        <KPICardV2
          title={t("average_score")}
          value={`${kpis.avgScore}%`}
          subtitle={t("overall_performance")}
          icon={CheckCircle}
          iconColor="#8b5cf6"
          iconBgColor="#ede9fe"
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{t("title")}</h2>
          <p className="text-sm text-gray-500 mt-1">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            variant="secondary"
            leftIcon={<Download className="w-4 h-4" />}
          >
            {t("export")}
          </Button>
          {canScheduleTests && (
            <Button
              type="button"
              onClick={() => setIsScheduleTestOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              {t("schedule_test")}
            </Button>
          )}
        </div>
      </div>


      {/* Filters */}
      <FilterPanel
        searchSlot={
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px] max-w-md">
              <Input
                type="text"
                placeholder={t("search_placeholder")}
                value={searchQuery}
                onChange={(e) => {
                  setPage(1);
                  setValue("search", e.target.value, "replace");
                }}
                suppressHydrationWarning
                leftIcon={<Search className="w-4 h-4" />}
                className={`placeholder:text-black/60 ${
                  searchQuery ? "border-primary ring-2 ring-primary/20" : ""
                }`}
              />
            </div>
            {hasActiveFilters && (
              <Button
                type="button"
                onClick={clearFilters}
                variant="danger"
                leftIcon={<X className="w-4 h-4" />}
              >
                {t("clear_filters")}
              </Button>
            )}
          </div>
        }
        filtersSlot={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <Select
                label={t("status")}
                value={statusFilter}
                onChange={(value) => {
                  setPage(1);
                  setValue("status", value as TestStatus | "all", "push")
                }}
                options={[
                  { value: "all", label: t("all_statuses") },
                  { value: "scheduled", label: t("scheduled") },
                  { value: "completed", label: t("completed") },
                  { value: "failed", label: t("failed") },
                ]}
              />
            </div>
            <Input
              type="text"
              placeholder={t("all_types")}
              value={typeFilter}
              onChange={(event) => {
                setPage(1);
                setValue("type", event.target.value, "replace");
              }}
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
        <div className="rounded-xl bg-white p-12 shadow-sm">
          <PartialLoader />
        </div>
      ) : tests.length === 0 ? (
        <div className="rounded-xl bg-white shadow-sm">
          <EmptyState
            message={hasActiveFilters ? t("no_match") : t("no_tests")}
            action={
              hasActiveFilters ? (
                <Button type="button" variant="ghost" onClick={clearFilters}>
                  {t("clear_filters")}
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={
            tests as (Test & {
              studentName: string;
              [key: string]: unknown;
            })[]
          }
          onRowClick={handleRowClick}
          searchQuery={searchQuery}
          urlState={{
            keyPrefix: "testsTable",
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

      {/* Schedule Test Modal */}
      {canScheduleTests && (
        <ScheduleTestModal
          isOpen={isScheduleTestOpen}
          onClose={() => setIsScheduleTestOpen(false)}
          onSubmit={handleTestSubmit}
          studentName=""
        />
      )}

      {/* Test Score Modal */}
      {selectedTest && (
        <TestScoreModal
          test={selectedTest}
          isOpen={isScoreModalOpen}
          onClose={() => {
            setIsScoreModalOpen(false);
            setSelectedTest(null);
          }}
          onSubmit={handleScoreSubmit}
        />
      )}
      <AdmissionsGlobalExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={({ format }) => handleExport(format)}
        mode="list"
        confirmLabel={t("export")}
        datasetCount={tests.length}
        emptyStateMessage={hasActiveFilters ? t("no_match") : t("no_tests")}
      />
    </div>
  );
}
