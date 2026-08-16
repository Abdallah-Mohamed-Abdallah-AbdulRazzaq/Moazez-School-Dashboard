// FILE: src/features/admissions/interviews/pages/InterviewsList.tsx

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import {
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
import { KPICardV2 } from "@/components/ui/kpi-card";
import InterviewRatingModal from "@/features/admissions/interviews/components/InterviewRatingModal";
import {
  Interview,
  InterviewStatus,
} from "@/features/admissions/types/admissions";
import { useAdmissionsUrlQueryState } from "@/features/admissions/shared/hooks/useAdmissionsUrlQueryState";
import AdmissionsGlobalExportModal from "@/features/admissions/shared/components/export/AdmissionsGlobalExportModal";
import { downloadAdmissionsExport } from "@/features/admissions/shared/utils/admissionsExport";
import { formatVisibleInterviewsForExport } from "@/features/admissions/applications/utils/admissionsExportUtils";
import {
  fetchInterviews,
  completeInterview,
} from "@/features/admissions/interviews/services/interviewsApiService";
import { useToast } from "@/components/ui/toast/Toast";
import { usePermissions } from "@/hooks/usePermissions";
import { AdmissionsAccessDenied } from "@/features/admissions/shared/components/AdmissionsAccessGuard";
import type { AdmissionsPagination } from "@/features/admissions/shared/services/admissionsApiUtils";

const DEFAULT_PAGE_SIZE = 20;

export default function InterviewsList() {
  const t = useTranslations("admissions.interviews");
  const locale = useLocale();
  const router = useRouter();
  const { showToast } = useToast();
  const { hasPermission } = usePermissions();
  const canViewInterviews = hasPermission("admissions.interviews.view");
  const canManageInterviews = hasPermission("admissions.interviews.manage");

  const [interviews, setInterviews] = useState<
    (Interview & { studentName: string })[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInterview, setSelectedInterview] = useState<
    (Interview & { studentName: string }) | null
  >(null);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
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
        "search" | "status" | "dateFrom" | "dateTo",
        string
      >,
    ) => {
      const updates: Partial<Record<keyof typeof values, string | null>> = {};
      const validStatuses = new Set([
        "all",
        "scheduled",
        "completed",
        "cancelled",
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
    dateFrom: string;
    dateTo: string;
  }>({
    defaults: {
      search: "",
      status: "all",
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
  const statusFilter = values.status as InterviewStatus | "all";
  const dateFrom = values.dateFrom;
  const dateTo = values.dateTo;

  const loadInterviews = useCallback(async () => {
    const requestId = ++latestRequestId.current;
    if (!canViewInterviews) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const interviewsPage = await fetchInterviews({
        search: searchQuery,
        status: statusFilter === "all" ? undefined : statusFilter,
        dateFrom,
        dateTo,
        page,
        limit: pageSize,
      });
      if (requestId !== latestRequestId.current) return;
      setInterviews(
        interviewsPage.items.map((interview) => ({
          ...interview,
          studentName: interview.studentName || "",
        })),
      );
      setPagination(interviewsPage.pagination);
    } catch (err) {
      if (requestId !== latestRequestId.current) return;
      console.error("Failed to fetch interviews:", err);
      showToast("Failed to load interviews", "error");
    } finally {
      if (requestId === latestRequestId.current) setIsLoading(false);
    }
  }, [
    canViewInterviews,
    dateFrom,
    dateTo,
    page,
    pageSize,
    searchQuery,
    showToast,
    statusFilter,
  ]);

  useEffect(() => {
    void Promise.resolve().then(loadInterviews);
  }, [loadInterviews]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const total = pagination.total;
    const scheduled = interviews.filter((i) => i.status === "scheduled").length;
    const completed = interviews.filter((i) => i.status === "completed").length;

    return { total, scheduled, completed };
  }, [interviews, pagination.total]);

  const columns = [
    { key: "studentName", label: t("student_name"), searchable: true },
    {
      key: "scheduledAt",
      label: t("date"),
      render: (value: unknown) =>
        value ? new Date(value as string).toLocaleDateString() : "-",
    },
    { key: "interviewer", label: t("interviewer"), searchable: true },
    {
      key: "status",
      label: t("status"),
      render: (value: unknown) => (
        <StatusBadge status={value as InterviewStatus} />
      ),
    },
    {
      key: "actions",
      label: t("actions_col"),
      render: (_value: unknown, row: Interview & { studentName: string }) =>
        !canManageInterviews || row.status === "cancelled" ? null : (
          <Button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedInterview(row);
              setIsRatingModalOpen(true);
            }}
            variant="outline"
            size="sm"
            leftIcon={<Edit className="w-3 h-3" />}
            className="px-3 py-1.5"
            title="Complete Interview"
          >
            {t("complete")}
          </Button>
        ),
    },
  ];

  const hasActiveFilters =
    searchQuery !== "" ||
    statusFilter !== "all" ||
    dateFrom !== "" ||
    dateTo !== "";

  const clearFilters = () => {
    setPage(1);
    reset(undefined, "replace");
  };

  const handleRowClick = (
    interview: Interview & { studentName: string; [key: string]: unknown },
  ) => {
    router.push(`/${locale}/admissions/interviews/${interview.id}`);
  };

  const handleRatingSubmit = async (interviewId: string, notes?: string) => {
    try {
      await completeInterview(interviewId, {
        status: "completed",
        notes,
      });
      showToast("Interview completed successfully!", "success");
      setIsRatingModalOpen(false);
      setSelectedInterview(null);
      await loadInterviews();
    } catch (err) {
      console.error("Failed to complete interview:", err);
      showToast("Failed to complete interview.", "error");
    }
  };

  const handleExport = async (format: "csv" | "json" | "excel") => {
    const exportLocale = format === "json" ? "en" : locale;
    downloadAdmissionsExport({
      data: formatVisibleInterviewsForExport(interviews, exportLocale),
      format,
      filenameBase: "interviews",
      emptyMessage: hasActiveFilters ? t("no_match") : t("no_interviews"),
    });
  };

  if (!canViewInterviews) {
    return <AdmissionsAccessDenied />;
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICardV2
          title={t("total_interviews")}
          value={kpis.total}
          subtitle={`${kpis.scheduled} ${t("scheduled")}`}
          icon={Calendar}
          iconColor="#3b82f6"
          iconBgColor="#dbeafe"
        />
        <KPICardV2
          title={t("scheduled")}
          value={kpis.scheduled}
          subtitle={t("upcoming_interviews")}
          icon={Clock}
          iconColor="#f59e0b"
          iconBgColor="#fef3c7"
        />
        <KPICardV2
          title={t("completed")}
          value={kpis.completed}
          subtitle={t("finished_interviews")}
          icon={CheckCircle}
          iconColor="#10b981"
          iconBgColor="#d1fae5"
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <Select
              label={t("status")}
              value={statusFilter}
              onChange={(value) => {
                setPage(1);
                setValue("status", value as InterviewStatus | "all", "push")
              }}
              className="max-w-xs"
              options={[
                { value: "all", label: t("all_statuses") },
                { value: "scheduled", label: t("scheduled") },
                { value: "completed", label: t("completed") },
              ]}
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
      ) : interviews.length === 0 ? (
        <div className="rounded-xl bg-white shadow-sm">
          <EmptyState
            message={hasActiveFilters ? t("no_match") : t("no_interviews")}
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
            interviews as (Interview & {
              studentName: string;
              [key: string]: unknown;
            })[]
          }
          onRowClick={handleRowClick}
          searchQuery={searchQuery}
          urlState={{
            keyPrefix: "interviewsTable",
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

      {/* Interview Rating Modal */}
      {selectedInterview && (
        <InterviewRatingModal
          interview={selectedInterview}
          isOpen={isRatingModalOpen}
          onClose={() => {
            setIsRatingModalOpen(false);
            setSelectedInterview(null);
          }}
          onSubmit={handleRatingSubmit}
        />
      )}
      <AdmissionsGlobalExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={({ format }) => handleExport(format)}
        mode="list"
        confirmLabel={t("export")}
        datasetCount={interviews.length}
        emptyStateMessage={
          hasActiveFilters ? t("no_match") : t("no_interviews")
        }
      />
    </div>
  );
}
