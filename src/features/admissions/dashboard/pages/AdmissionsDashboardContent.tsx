// FILE: src/components/admissions/AdmissionsDashboard.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { Users, TrendingUp, Clock, Download } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { KPICardV2 } from "@/components/ui/kpi-card";
import { DataTable } from "@/components/ui/data-table";
import ApplicationSourcesChart from "@/features/admissions/dashboard/components/charts/ApplicationSourcesChart";
import ConversionFunnelChart from "@/features/admissions/dashboard/components/charts/ConversionFunnelChart";
import WeeklyInquiriesChart from "@/features/admissions/dashboard/components/charts/WeeklyInquiriesChart";
import ApplicationsByGradeChart from "@/features/admissions/dashboard/components/charts/ApplicationsByGradeChart";
import DateRangeFilter, { DateRangeValue } from "@/features/admissions/shared/DateRangeFilter";
import AdmissionsGlobalExportModal from "@/features/admissions/shared/components/export/AdmissionsGlobalExportModal";
import StatusBadge from "@/features/admissions/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { getDateFilterBoundaries, isDateInRange } from "@/utils/dateFilters";
import { getAdmissionsAnalytics } from "@/features/admissions/dashboard/services/admissionsAnalytics";
import { ApplicationStatus, Application } from "@/features/admissions/types/admissions";
import { fetchLeads } from "@/features/admissions/leads/services/leadsApiService";
import { fetchApplications } from "@/features/admissions/applications/services/applicationsApiService";
import type { Lead } from "@/features/admissions/leads/types/lead";
import { createAdmissionsDashboardExportHandler } from "@/features/admissions/shared/utils/admissionsDashboardExport";
import { usePermissions } from "@/hooks/usePermissions";

export default function AdmissionsDashboardContent() {
  const t = useTranslations("admissions");
  const locale = useLocale();
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const canViewLeads = hasPermission("admissions.leads.view");
  const canViewApplications = hasPermission("admissions.applications.view");

  // Date range state
  const [dateRange, setDateRange] = useState<DateRangeValue>("30");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isAdmissionsLoading, setIsAdmissionsLoading] = useState(true);
  const [admissionsError, setAdmissionsError] = useState<string | null>(null);
  const handleExport = createAdmissionsDashboardExportHandler(locale, {
    value: dateRange,
    customStart: customStartDate,
    customEnd: customEndDate,
  }, {
    applications,
    leads,
  });
  const scopedApplications = applications;
  const scopedLeads = leads;

  useEffect(() => {
    let isMounted = true;

    const loadAdmissionsDashboardData = async () => {
      setIsAdmissionsLoading(true);
      setAdmissionsError(null);
      try {
        const [nextLeads, nextApplications] = await Promise.all([
          canViewLeads ? fetchLeads() : Promise.resolve([]),
          canViewApplications ? fetchApplications() : Promise.resolve([]),
        ]);
        if (isMounted) {
          setLeads(nextLeads);
          setApplications(nextApplications);
        }
      } catch (error) {
        console.error("Failed to load dashboard admissions data:", error);
        if (isMounted) {
          setLeads([]);
          setApplications([]);
          setAdmissionsError("Failed to load admissions analytics.");
        }
      } finally {
        if (isMounted) {
          setIsAdmissionsLoading(false);
        }
      }
    };

    void loadAdmissionsDashboardData();

    return () => {
      isMounted = false;
    };
  }, [canViewApplications, canViewLeads]);

  // Calculate days back for analytics based on date range
  const daysBack = useMemo(() => {
    if (dateRange === "all") return 365; // Show 1 year for "all"
    if (dateRange === "custom") {
      // Calculate days between custom dates
      if (customStartDate && customEndDate) {
        const start = new Date(customStartDate);
        const end = new Date(customEndDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
      }
      return 30; // Default to 30 if custom dates not set
    }
    return parseInt(dateRange);
  }, [dateRange, customStartDate, customEndDate]);

  // Get analytics data based on selected date range
  const analyticsData = useMemo(
    () =>
      getAdmissionsAnalytics(daysBack, {
        applications: scopedApplications,
        leads: scopedLeads,
      }),
    [daysBack, scopedApplications, scopedLeads],
  );

  // Calculate KPIs based on selected date range
  const kpis = useMemo(() => {
    const filterResult = getDateFilterBoundaries(
      dateRange,
      customStartDate,
      customEndDate,
    );

    // 1. Applications in selected period
    const applicationsInPeriodList = scopedApplications.filter((app) =>
      isDateInRange(app.submittedDate, filterResult),
    );

    const applicationsInPeriod = applicationsInPeriodList.length;

    // 2. Conversion Rate (Approved / Total in period)

    const totalApplications = applicationsInPeriodList.length;
    const approvedApplications = applicationsInPeriodList.filter(
      (app) => app.status === "accepted",
    ).length;

    const conversionRate =
      totalApplications > 0
        ? ((approvedApplications / totalApplications) * 100).toFixed(1)
        : "0.0";

    // 3. Average Processing Time (for applications in period)
    const decidedApps = applicationsInPeriodList.filter(
      (app) =>
        (app.status === "accepted" || app.status === "rejected") &&
        app.decision?.decisionDate,
    );

    let avgProcessingDisplay = "N/A";

    if (decidedApps.length > 0) {
      const totalProcessingTime = decidedApps.reduce((sum, app) => {
        const submitted = new Date(app.submittedDate);
        const decided = new Date(app.decision!.decisionDate);

        const diffMs = decided.getTime() - submitted.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        return sum + diffHours;
      }, 0);

      const avgHours = totalProcessingTime / decidedApps.length;

      // Display in hours if < 48h, otherwise in days
      if (avgHours < 48) {
        avgProcessingDisplay = `${Math.round(avgHours)}h`;
      } else {
        const days = avgHours / 24;
        avgProcessingDisplay = `${days.toFixed(1)} days`;
      }
    }

    return {
      applicationsInPeriod,
      conversionRate,
      approvedApplications,
      totalApplications,
      avgProcessingDisplay,
    };
  }, [customEndDate, customStartDate, dateRange, scopedApplications]);

  const columns = [
    {
      key: "id",
      label: t("applications.application_id"),
      searchable: true,
    },
    {
      key: "studentName",
      label: t("applications.student_name"),
      searchable: true,
      render: (_: unknown, row: Application) => {
        // Use Arabic name if locale is Arabic, otherwise English
        return locale === "ar" ? row.full_name_ar : row.full_name_en;
      },
    },
    {
      key: "dateOfBirth",
      label: t("applications.date_of_birth"),
      render: (value: unknown) =>
        value ? new Date(value as string).toLocaleDateString() : "N/A",
    },
    {
      key: "gender",
      label: t("applications.gender"),
      render: (value: unknown) => (value ? String(value) : "N/A"),
    },
    {
      key: "nationality",
      label: t("applications.nationality"),
      render: (value: unknown) => (value ? String(value) : "N/A"),
    },
    {
      key: "gradeRequested",
      label: t("applications.grade"),
      render: (value: unknown) => {
        if (!value) return "—";
        const grade = String(value);
        // Convert grade to translation key (e.g., "Grade 6" -> "grade_6")
        const gradeKey = grade.toLowerCase().replace(/\s+/g, "_");
        return t.has(`grades.${gradeKey}`) ? t(`grades.${gradeKey}`) : grade;
      },
    },
    {
      key: "status",
      label: t("applications.status"),
      render: (value: unknown) => (
        <StatusBadge status={value as ApplicationStatus} />
      ),
    },
    {
      key: "guardianName",
      label: t("applications.guardian"),
      searchable: true,
    },
    {
      key: "submittedDate",
      label: t("applications.submitted"),
      render: (value: unknown) =>
        new Date(value as string).toLocaleDateString(),
    },
  ];

  const handleRowClick = (app: Application) => {
    router.push(`/${locale}/admissions/applications/${app.id}`);
  };

  // Calculate Application Sources data based on selected date range
  const applicationSourcesData = useMemo(() => {
    const filterResult = getDateFilterBoundaries(
      dateRange,
      customStartDate,
      customEndDate,
    );

    // Filter applications by date range
    const applicationsInPeriod = scopedApplications.filter((app) =>
      isDateInRange(app.submittedDate, filterResult),
    );

    // Count applications by source
    const sourceMap: Record<string, number> = {
      "In App": 0,
      Referral: 0,
      "Walk-in": 0,
      Other: 0,
    };

    applicationsInPeriod.forEach((app) => {
      if (app.source === "in_app") {
        sourceMap["In App"]++;
      } else if (app.source === "referral") {
        sourceMap["Referral"]++;
      } else if (app.source === "walk_in") {
        sourceMap["Walk-in"]++;
      } else {
        sourceMap["Other"]++;
      }
    });

    // Convert to array format and filter out zero counts
    return Object.entries(sourceMap)
      .map(([source, count]) => ({ source, count }))
      .filter((item) => item.count > 0);
  }, [customEndDate, customStartDate, dateRange, scopedApplications]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with Export Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
            {t("dashboard.title")}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {t("dashboard.subtitle")}
          </p>
        </div>
        <button
          onClick={() => setIsExportModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-hover text-white rounded-lg font-medium text-sm transition-colors shadow-sm whitespace-nowrap min-h-[44px]"
        >
          <Download className="w-4 h-4 shrink-0" />
          <span>{t("dashboard.export")}</span>
        </button>
      </div>

      {/* Date Range Filter */}
      <DateRangeFilter
        value={dateRange}
        onChange={setDateRange}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        onCustomDateChange={(start, end) => {
          setCustomStartDate(start);
          setCustomEndDate(end);
        }}
        showAllTime={false}
      />

      {/* KPI Cards */}
      {(isAdmissionsLoading || admissionsError) && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            admissionsError
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-blue-200 bg-blue-50 text-blue-700"
          }`}
        >
          {admissionsError || "Loading admissions analytics..."}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <KPICardV2
          title={t("kpi.applications")}
          value={kpis.applicationsInPeriod}
          icon={Users}
          iconColor="#036b80"
          iconBgColor="#e0f2f5"
          chartData={[
            { label: "W1", value: 45 },
            { label: "W2", value: 52 },
            { label: "W3", value: 48 },
            { label: "W4", value: kpis.applicationsInPeriod },
          ]}
          chartColor="#036b80"
        />
        <KPICardV2
          title={t("kpi.conversion_rate")}
          value={`${kpis.conversionRate}%`}
          subtitle={`${kpis.approvedApplications}/${kpis.totalApplications}`}
          icon={TrendingUp}
          iconColor="#10b981"
          iconBgColor="#d1fae5"
          chartData={[
            { label: "W1", value: 65 },
            { label: "W2", value: 68 },
            { label: "W3", value: 70 },
            { label: "W4", value: parseFloat(kpis.conversionRate) },
          ]}
          chartColor="#10b981"
        />
        <KPICardV2
          title={t("kpi.avg_processing_time")}
          value={kpis.avgProcessingDisplay}
          subtitle={t("kpi.avg_time_to_decision")}
          icon={Clock}
          iconColor="#f59e0b"
          iconBgColor="#fef3c7"
          chartData={[
            { label: "W1", value: 48 },
            { label: "W2", value: 45 },
            { label: "W3", value: 42 },
            { label: "W4", value: 40 },
          ]}
          chartColor="#f59e0b"
        />
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
        <div className="min-w-0">
          <ConversionFunnelChart data={analyticsData.funnel} />
        </div>
        <div className="min-w-0">
          <ApplicationsByGradeChart data={analyticsData.gradeDistribution} />
        </div>
      </div>

      {/* Additional Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
        <div className="min-w-0">
          <ApplicationSourcesChart data={applicationSourcesData} />
        </div>

        <div className="min-w-0">
          <WeeklyInquiriesChart data={analyticsData.weeklyInquiries} />
        </div>
      </div>

      {/* Latest Applications Table */}
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900">
              {t("applications.title")}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              {t("applications.subtitle")}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push(`/${locale}/admissions/applications`)}
          >
            {t("applications.view_all")}
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={scopedApplications
            .sort(
              (a, b) =>
                new Date(b.submittedDate).getTime() -
                new Date(a.submittedDate).getTime(),
            )
            .slice(0, 5)}
          searchQuery=""
          onRowClick={handleRowClick}
          showPagination={false}
          urlState={{
            keyPrefix: "admissionsDashboardTable",
            syncSorting: true,
          }}
        />
      </div>

      {/* Export Modal */}
      <AdmissionsGlobalExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExport}
        mode="dashboard"
        currentDateRange={{
          value: dateRange,
          customStart: customStartDate,
          customEnd: customEndDate,
        }}
      />
    </div>
  );
}
