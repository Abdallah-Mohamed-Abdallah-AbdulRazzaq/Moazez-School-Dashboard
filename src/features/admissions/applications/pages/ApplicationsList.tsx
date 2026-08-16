// FILE: src/components/admissions/ApplicationsList.tsx

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  X,
  Users,
  Clock,
  CheckCircle,
  TrendingUp,
  Download,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Button, DataTable, EmptyState, FilterPanel, Input, Select } from "@/components/ui";
import StatusBadge from "@/features/admissions/shared/StatusBadge";
import StatusTagsBar from "@/features/admissions/shared/StatusTagsBar";
import { KPICardV2 } from "@/components/ui/kpi-card";
import ApplicationCreateStepper from "@/features/admissions/applications/components/ApplicationCreateStepper";
import { formatApplicationsForExport } from "@/features/admissions/applications/utils/admissionsExportUtils";
import AdmissionsGlobalExportModal from "@/features/admissions/shared/components/export/AdmissionsGlobalExportModal";
import { downloadAdmissionsExport } from "@/features/admissions/shared/utils/admissionsExport";
import type { ApplicationCreationPayload } from "@/features/admissions/applications/services/applicationCreationService";
import {
  fetchApplications,
  submitApplication,
} from "@/features/admissions/applications/services/applicationsApiService";
import { createApplicationIntake } from "@/features/admissions/applications/services/applicationIntakeService";
import {
  Application,
  ApplicationStatus,
} from "@/features/admissions/types/admissions";
import { useAdmissionsUrlQueryState } from "@/features/admissions/shared/hooks/useAdmissionsUrlQueryState";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/components/ui/toast/Toast";
import { applicationSourceLabel } from "@/features/admissions/applications/utils/applicationSourceLabel";
import { AdmissionsAccessDenied } from "@/features/admissions/shared/components/AdmissionsAccessGuard";
import { useAdmissionsGradeLabels } from "@/features/admissions/applications/hooks/useAdmissionsGradeLabels";

export default function ApplicationsList() {
  const t = useTranslations("admissions.applications");
  const tFilters = useTranslations("admissions.filters");
  const tStatus = useTranslations("admissions.status");
  const tSource = useTranslations("admissions.source");
  const locale = useLocale();
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const { showToast } = useToast();
  const canViewApplications = hasPermission("admissions.applications.view");
  const canManageApplications = hasPermission("admissions.applications.manage");
  const sourceLabels: Record<string, string> = {
    in_app: tSource("in_app"),
    referral: tSource("referral"),
    walk_in: tSource("walk_in"),
    other: tSource("other"),
  };

  const [isCreateAppOpen, setIsCreateAppOpen] = useState(false);
  const [creationRecovery, setCreationRecovery] = useState<{
    applicationId: string;
    failedDocuments: string[];
  } | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoadingApplications, setIsLoadingApplications] = useState(true);
  const [applicationsError, setApplicationsError] = useState<string | null>(
    null,
  );
  const [showFilters, setShowFilters] = useState(false);
  const gradeLabels = useAdmissionsGradeLabels(applications, locale);

  const scopedApplications = applications;

  const normalizeQueryValues = useCallback(
    (
      values: Record<
        "search" | "status",
        string
      >,
    ) => {
      const updates: Partial<Record<keyof typeof values, string | null>> = {};
      const validStatuses = new Set([
        "all",
        "submitted",
        "documents_pending",
        "under_review",
        "accepted",
        "waitlisted",
        "rejected",
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
  }>({
    defaults: {
      search: "",
      status: "all",
    },
    debouncedKeys: ["search"],
    modeByKey: {
      search: "replace",
    },
    normalize: normalizeQueryValues,
  });

  const searchQuery = values.search;
  const statusFilter = values.status as ApplicationStatus | "all";
  const loadApplications = useCallback(async () => {
    if (!canViewApplications) {
      setIsLoadingApplications(false);
      return;
    }
    setIsLoadingApplications(true);
    setApplicationsError(null);
    try {
      const nextApplications = await fetchApplications({
        status: statusFilter === "all" ? undefined : statusFilter,
      });
      setApplications(nextApplications);
    } catch (error) {
      console.error("Failed to load applications:", error);
      setApplications([]);
      setApplicationsError(t("load_error"));
    } finally {
      setIsLoadingApplications(false);
    }
  }, [canViewApplications, statusFilter, t]);

  useEffect(() => {
    void Promise.resolve().then(loadApplications);
  }, [loadApplications]);

  const filteredApplications = useMemo(() => {
    const normalizedSearchQuery = searchQuery.trim().toLowerCase();
    return scopedApplications.filter((app) => {
      const matchesSearch =
        normalizedSearchQuery === "" ||
        app.studentName.toLowerCase().includes(normalizedSearchQuery) ||
        app.id.toLowerCase().includes(normalizedSearchQuery) ||
        (app.source ?? "").toLowerCase().includes(normalizedSearchQuery) ||
        (app.requestedGradeId ?? "").toLowerCase().includes(normalizedSearchQuery);

      const matchesStatus =
        statusFilter === "all" || app.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [scopedApplications, searchQuery, statusFilter]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Get start of current week (Sunday)
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    // 1. Total Applications
    const total = scopedApplications.length;

    const newToday = scopedApplications.filter((app) => {
      const submittedDate = new Date(app.submittedDate);
      const submittedDay = new Date(
        submittedDate.getFullYear(),
        submittedDate.getMonth(),
        submittedDate.getDate(),
      );
      return submittedDay.getTime() === today.getTime();
    }).length;

    const newThisWeek = scopedApplications.filter((app) => {
      const submittedDate = new Date(app.submittedDate);
      return submittedDate >= weekStart;
    }).length;

    // 2. Pending Review (submitted + documents_pending)
    const pendingReview = scopedApplications.filter(
      (app) => app.status === "submitted" || app.status === "documents_pending",
    ).length;

    // 3. Missing Documents
    const missingDocuments = scopedApplications.filter((app) =>
      app.documentsSummary?.hasMissingDocuments ?? app.documents.some((doc) => doc.status === "missing"),
    ).length;

    // 4. Approved
    const approved = scopedApplications.filter(
      (app) => app.status === "accepted",
    ).length;

    // 5. Rejected
    const rejected = scopedApplications.filter(
      (app) => app.status === "rejected",
    ).length;

    // 6. Average Processing Time
    const decidedApps = scopedApplications.filter(
      (app) =>
        (app.status === "accepted" || app.status === "rejected") &&
        app.decision?.decisionDate,
    );

    let avgProcessingDisplay = t("not_available");

    if (decidedApps.length > 0) {
      const totalProcessingTime = decidedApps.reduce((sum, app) => {
        const submitted = new Date(app.submittedDate);
        const decided = new Date(app.decision!.decisionDate);

        const diffMs = decided.getTime() - submitted.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        return sum + diffHours;
      }, 0);

      const avgHours = totalProcessingTime / decidedApps.length;

      if (avgHours < 48) {
        avgProcessingDisplay = t("processing_hours", {
          hours: Math.round(avgHours),
        });
      } else {
        const days = avgHours / 24;
        avgProcessingDisplay = t("processing_days", {
          days: days.toFixed(1),
        });
      }
    }

    return {
      total,
      newToday,
      newThisWeek,
      pendingReview,
      missingDocuments,
      approved,
      rejected,
      avgProcessingDisplay,
    };
  }, [scopedApplications, t]);

  const handleSubmitApp = async (appId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await submitApplication(appId);
      await loadApplications();
    } catch (err) {
      console.error("Failed to submit application:", err);
      showToast(t("submit_error"), "error");
    }
  };

  const columns = [
    {
      key: "studentName",
      label: t("student_name"),
      searchable: true,
      render: (_: unknown, row: Application) =>
        locale === "ar"
          ? row.full_name_ar || row.studentName
          : row.full_name_en || row.studentName,
    },
    {
      key: "requestedGradeId",
      label: t("grade_requested"),
      render: (value: unknown) =>
        typeof value === "string"
          ? gradeLabels.get(value) ?? t("not_available")
          : t("not_available"),
    },
    {
      key: "source",
      label: t("source"),
      render: (value: unknown) => applicationSourceLabel(value, sourceLabels),
    },
    {
      key: "status",
      label: t("status"),
      render: (value: unknown) => (
        <StatusBadge status={value as ApplicationStatus} />
      ),
    },
    {
      key: "submittedAt",
      label: t("submitted"),
      render: (value: unknown) => formatDate(value, t("not_available")),
    },
    {
      key: "createdAt",
      label: t("created"),
      render: (value: unknown) => formatDate(value, t("not_available")),
    },
    {
      key: "registrationState",
      label: t("registered"),
      render: (_: unknown, row: Application) =>
        row.registrationState?.registered ? t("yes") : t("no"),
    },
    {
      key: "actions",
      label: "",
      sortable: false,
      render: (_: unknown, row: Application) =>
        row.status === "documents_pending" && row.submittedAt === null ? (
          <Button
            type="button"
            onClick={(e) => handleSubmitApp(row.id, e)}
            disabled={!canManageApplications}
            size="sm"
            className="px-3 py-1"
          >
            {t("submit")}
          </Button>
        ) : null,
    },
  ];

  const hasActiveFilters =
    searchQuery !== "" ||
    statusFilter !== "all";

  const clearFilters = () => {
    reset(undefined, "replace");
  };

  const handleRowClick = (app: Application) => {
    router.push(`/${locale}/admissions/applications/${app.id}`);
  };

  const handleCreateApplicationSubmit = async (
    data: ApplicationCreationPayload,
  ) => {
    try {
      const intakeOutcome = await createApplicationIntake(data);
      await loadApplications();
      setIsCreateAppOpen(false);
      setCreationRecovery(
        intakeOutcome.failedDocumentLabels.length > 0
          ? {
              applicationId: intakeOutcome.application.id,
              failedDocuments: intakeOutcome.failedDocumentLabels,
            }
          : null,
      );
    } catch (error) {
      console.error("Failed to create application:", error);
      showToast(t("create_error"), "error");
    }
  };

  const handleExport = async (format: "csv" | "json" | "excel") => {
    const exportLocale = format === "json" ? "en" : locale;
    downloadAdmissionsExport({
      data: formatApplicationsForExport(filteredApplications, exportLocale),
      format,
      filenameBase: "applications",
      emptyMessage: hasActiveFilters ? t("no_match") : t("no_applications"),
    });
  };

  if (!canViewApplications) {
    return <AdmissionsAccessDenied />;
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICardV2
          title={t("total_applications")}
          value={kpis.total}
          subtitle={t("today_week_stats", {
            today: kpis.newToday,
            week: kpis.newThisWeek,
          })}
          icon={Users}
          iconColor="#3b82f6"
          iconBgColor="#dbeafe"
          showChart={false}
        />
        <KPICardV2
          title={t("pending_review")}
          value={kpis.pendingReview}
          subtitle={t("awaiting_action")}
          icon={Clock}
          iconColor="#f59e0b"
          iconBgColor="#fef3c7"
          showChart={false}
        />
        <KPICardV2
          title={t("missing_documents")}
          value={kpis.missingDocuments}
          subtitle={t("applications_incomplete")}
          icon={Users}
          iconColor="#ef4444"
          iconBgColor="#fee2e2"
          showChart={false}
        />
        <KPICardV2
          title={t("approved")}
          value={kpis.approved}
          subtitle={t("accepted_applications")}
          icon={CheckCircle}
          iconColor="#10b981"
          iconBgColor="#d1fae5"
          showChart={false}
        />
        <KPICardV2
          title={t("rejected")}
          value={kpis.rejected}
          subtitle={t("declined_applications")}
          icon={Users}
          iconColor="#6b7280"
          iconBgColor="#f3f4f6"
          showChart={false}
        />
        <KPICardV2
          title={t("avg_processing_time")}
          value={kpis.avgProcessingDisplay}
          subtitle={t("time_to_decision")}
          icon={TrendingUp}
          iconColor="#8b5cf6"
          iconBgColor="#ede9fe"
          showChart={false}
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{t("title")}</h2>
          <p className="text-sm text-gray-500 mt-1">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            variant="secondary"
            leftIcon={<Download className="w-4 h-4" />}
          >
            {t("export")}
          </Button>
          {canManageApplications && (
            <Button
              type="button"
              onClick={() => setIsCreateAppOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              {t("new_application")}
            </Button>
          )}
        </div>
      </div>

      {creationRecovery && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-semibold">{t("partial_creation.title")}</p>
          <p className="mt-1">
            {t("partial_creation.description", {
              documents: creationRecovery.failedDocuments.join(", "),
            })}
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-3"
            onClick={() =>
              router.push(
                `/${locale}/admissions/applications/${creationRecovery.applicationId}/documents`,
              )
            }
          >
            {t("partial_creation.open_documents")}
          </Button>
        </div>
      )}

      {/* Filters */}
      <FilterPanel
        searchSlot={
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px] max-w-md">
              <Input
                type="text"
                placeholder={t("search_placeholder")}
                aria-label={t("search_placeholder")}
                value={searchQuery}
                onChange={(e) => setValue("search", e.target.value, "replace")}
                leftIcon={<Search className="w-4 h-4" />}
                className={`placeholder:text-black/60 ${
                  searchQuery
                    ? "border-primary ring-2 ring-primary/20"
                    : ""
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <Select
                label={tFilters("status")}
                value={statusFilter}
                onChange={(value) =>
                  setValue(
                    "status",
                    value as ApplicationStatus | "all",
                    "push",
                  )
                }
                options={[
                  { value: "all", label: tFilters("all") },
                  { value: "submitted", label: tStatus("pending") },
                  { value: "documents_pending", label: t("documents_pending") },
                  { value: "under_review", label: tStatus("under_review") },
                  { value: "accepted", label: tStatus("accepted") },
                  { value: "waitlisted", label: t("waitlisted") },
                  { value: "rejected", label: tStatus("rejected") },
                ]}
              />
            </div>
          </div>
        }
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        clearAction={null}
        hasActiveFilters={hasActiveFilters}
        toggleTitle={tFilters("filters_button")}
        toggleAriaLabel={tFilters("filters_button")}
        className="p-0 bg-transparent shadow-none"
      />

      {/* Status Tags Bar */}
      <StatusTagsBar
        data={filteredApplications}
        totalLabel={t("applications")}
      />

      {applicationsError ? (
        <div className="rounded-xl border border-red-200 bg-red-50">
          <EmptyState message={applicationsError} className="text-red-700" />
        </div>
      ) : isLoadingApplications ? (
        <DataTable<Application>
          columns={columns}
          data={[]}
          isLoading
          skeletonRows={6}
          showPagination={false}
        />
      ) : filteredApplications.length === 0 ? (
        <div className="rounded-xl bg-white shadow-sm">
          <EmptyState
            message={hasActiveFilters ? t("no_match") : t("no_applications")}
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
        <DataTable<Application>
          columns={columns}
          data={filteredApplications}
          onRowClick={handleRowClick}
          searchQuery={searchQuery}
          urlState={{
            keyPrefix: "applicationsTable",
            syncPagination: true,
            syncSorting: true,
          }}
        />
      )}

      {/* New Application Modal */}
      <ApplicationCreateStepper
        isOpen={isCreateAppOpen}
        onClose={() => setIsCreateAppOpen(false)}
        onSubmit={handleCreateApplicationSubmit}
      />
      <AdmissionsGlobalExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={({ format }) => handleExport(format)}
        mode="list"
        confirmLabel={t("export")}
        datasetCount={filteredApplications.length}
        emptyStateMessage={
          hasActiveFilters ? t("no_match") : t("no_applications")
        }
      />
    </div>
  );
}

function formatDate(value: unknown, fallback: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    return fallback;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return date.toLocaleDateString();
}
