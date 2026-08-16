"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useParams, useRouter, useSearchParams, usePathname } from "next/navigation";
import AcademicsGlobalExportModal from "@/features/academics/shared/components/export/AcademicsGlobalExportModal";
import KPICards from "../components/KPICards";
import SetupChecklist from "../components/SetupChecklist";
import OverviewCharts from "../components/OverviewCharts";

import QuickLinks from "../components/QuickLinks";
import UpcomingEventsPanel from "../components/UpcomingEventsPanel";
import AcademicsOverviewFiltersBar, {
  type AcademicsOverviewExportDataset,
} from "../components/AcademicsOverviewFiltersBar";
import {
  generateChecklist,
  type ChecklistItem,
} from "../services/overviewService";
import {
  fetchAcademicsOverview,
  type AcademicsOverviewResponse,
} from "../services/overviewApiAdapter";
import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";
import type {
  AcademicYear,
  Term,
} from "@/features/academics/academic-structure-tree/services/structureService";
import {
  type AcademicsExportFormat,
  exportAcademicsData,
  formatExportDate,
  generateExportFilename,
  type ExportColumn,
  type ExportMetadata,
} from "@/features/academics/utils/exportAdapter";
import Link from "next/link";
import Button from "@/components/ui/button/Button";
import { PlusCircle } from "lucide-react";

type OverviewErrorInfo = {
  status?: number;
  code?: string;
  message?: string;
};

function getOverviewErrorInfo(error: unknown): OverviewErrorInfo {
  if (typeof error !== "object" || error === null) {
    return {};
  }

  const candidate = error as {
    status?: unknown;
    code?: unknown;
    message?: unknown;
    response?: {
      status?: unknown;
      data?: {
        code?: unknown;
        error?: unknown;
        message?: unknown;
      };
    };
  };

  return {
    status:
      typeof candidate.status === "number"
        ? candidate.status
        : typeof candidate.response?.status === "number"
          ? candidate.response.status
          : undefined,
    code:
      typeof candidate.code === "string"
        ? candidate.code
        : typeof candidate.response?.data?.code === "string"
          ? candidate.response.data.code
          : undefined,
    message:
      typeof candidate.message === "string"
        ? candidate.message
        : typeof candidate.response?.data?.message === "string"
          ? candidate.response.data.message
          : typeof candidate.response?.data?.error === "string"
            ? candidate.response.data.error
            : undefined,
  };
}

export default function AcademicsOverviewPage() {
  const t = useTranslations("academics.overview");
  const tExport = useTranslations("academics.export");
  const tTypes = useTranslations("academics.overview.upcomingEvents.types");
  const tScopes = useTranslations("academics.overview.upcomingEvents.scopes");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const lang = params.lang as string;
  const { academicYearId, termId, isInitializing, academicYears, terms } =
    useAcademicYearTermLayoutContext();

  const [response, setResponse] = useState<AcademicsOverviewResponse | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);

  // Chart data
  const [readinessData, setReadinessData] = useState<
    Array<{
      key: "ready" | "notReady";
      name: string;
      value: number;
      color: string;
    }>
  >([]);



  const exportDataset = useMemo<AcademicsOverviewExportDataset>(() => {
    const value = searchParams.get("exportDataset");
    if (value === "checklist" || value === "upcomingEvents") {
      return value;
    }
    return "summary";
  }, [searchParams]);

  const exportLabels = useMemo(
    () => t.raw("exportLabels") as Record<string, string>,
    [t],
  );

  const tGlobal = useTranslations();

  const resetOverviewState = useCallback(() => {
    setResponse(null);
    setChecklist([]);
    setReadinessData([]);
  }, []);

  const loadOverview = useCallback(async () => {
    try {
      setIsLoading(true);
      const overviewResponse = await fetchAcademicsOverview({
        academicYearId: academicYearId || undefined,
        termId: termId || undefined,
      });

      setResponse(overviewResponse);
      setError(null);

      const checklistItems = generateChecklist(overviewResponse, lang);
      setChecklist(checklistItems);

      const { setupIndicators } = overviewResponse;
      const totalCount = 10;
      const readyCount = [
        setupIndicators.hasAcademicYear,
        setupIndicators.hasTerm,
        setupIndicators.hasStructure,
        setupIndicators.hasSubjects,
        setupIndicators.hasRooms,
        setupIndicators.hasTeacherAllocations,
        setupIndicators.hasCurriculum,
        setupIndicators.hasLessonPlans,
        setupIndicators.hasTimetable,
        setupIndicators.hasCalendarEvents,
      ].filter(Boolean).length;

      const readyPercentage = Math.round((readyCount / totalCount) * 100);
      const notReadyPercentage = 100 - readyPercentage;

      setReadinessData([
        {
          key: "ready",
          name: t("charts.readiness.ready"),
          value: readyPercentage,
          color: "#10b981",
        },
        {
          key: "notReady",
          name: t("charts.readiness.notReady"),
          value: notReadyPercentage,
          color: "#ef4444",
        },
      ]);
    } catch (err: unknown) {
      console.error("Failed to load overview data:", err);
      resetOverviewState();

      const errorInfo = getOverviewErrorInfo(err);
      if (errorInfo.status === 403) {
        setError(t("error.accessDenied"));
      } else if (errorInfo.status === 400) {
        setError(t("error.invalidFilter"));
      } else if (
        errorInfo.status === 422 ||
        errorInfo.code === "academics.overview.invalid_context"
      ) {
        setError(t("error.invalidContext"));
      } else {
        setError(t("error.loadFailed"));
      }
    } finally {
      setIsLoading(false);
    }
  }, [academicYearId, termId, lang, t, resetOverviewState]);

  useEffect(() => {
    if (isInitializing) return;
    void Promise.resolve().then(loadOverview);
  }, [isInitializing, loadOverview]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    let changed = false;

    if (params.has("chart")) {
      params.delete("chart");
      changed = true;
    }

    const currentExportDataset = params.get("exportDataset");
    if (
      currentExportDataset &&
      currentExportDataset !== "summary" &&
      currentExportDataset !== "checklist" &&
      currentExportDataset !== "upcomingEvents"
    ) {
      params.delete("exportDataset");
      changed = true;
    }

    if (changed) {
      const nextQuery = params.toString();
      const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
      router.replace(nextUrl, { scroll: false });
    }
  }, [searchParams, router, pathname]);

  const overviewExportData = useMemo(() => {
    if (!response) {
      return null;
    }

    // Provide generic name for the fallback "Zero State" scenario when there's no year
    const activeYearName =
      academicYears.find((item: AcademicYear) => item.id === academicYearId)
        ? (lang === "ar"
            ? academicYears.find((item: AcademicYear) => item.id === academicYearId)?.nameAr
            : academicYears.find((item: AcademicYear) => item.id === academicYearId)?.nameEn)
        : academicYearId || t("filters.options.all");

    const activeTermName =
      terms.find((item: Term) => item.id === termId)
        ? (lang === "ar"
            ? terms.find((item: Term) => item.id === termId)?.nameAr
            : terms.find((item: Term) => item.id === termId)?.nameEn)
        : termId || t("filters.options.all");

    const metadata: ExportMetadata = {
      yearName: activeYearName,
      termName: activeTermName,
      exportDate: formatExportDate(locale),
    };

    let title = t("title");
    let filename = generateExportFilename(
      "academics-overview",
      termId || "all",
    );
    let columns: ExportColumn[] = [];
    let rows: Record<string, unknown>[] = [];

    if (exportDataset === "summary") {
      title = t("filters.options.summary");
      columns = [
        { key: "group", label: exportLabels.group },
        { key: "metric", label: exportLabels.metric },
        { key: "value", label: exportLabels.value },
      ];
      rows = [
        {
          group: exportLabels.structure,
          metric: t("kpi.structure.title"),
          value: response.structure.gradesCount,
        },
        {
          group: exportLabels.subjects,
          metric: t("kpi.subjects.title"),
          value: response.subjects.subjectsCount,
        },
        {
          group: exportLabels.rooms,
          metric: t("kpi.rooms.title"),
          value: response.rooms.roomsCount,
        },
        {
          group: exportLabels.teacherAllocation,
          metric: t("kpi.teacherAllocation.title"),
          value: response.teacherAllocation.allocationsCount,
        },
        {
          group: exportLabels.curriculum,
          metric: t("kpi.curriculum.title"),
          value: response.curriculum.curriculaCount,
        },
        {
          group: exportLabels.lessonPlans,
          metric: t("kpi.lessonPlans.title"),
          value: response.lessonPlans.lessonPlansCount,
        },
        {
          group: exportLabels.timetable,
          metric: t("kpi.timetable.title"),
          value: response.timetable.entriesCount,
        },
        {
          group: exportLabels.calendar,
          metric: t("kpi.calendar.title"),
          value: response.calendar.eventsCount,
        },
      ];
    } else if (exportDataset === "checklist") {
      title = t("checklist.title");
      filename = generateExportFilename(
        "academics-overview-checklist",
        termId || "all",
      );
      columns = [
        { key: "title", label: exportLabels.title },
        { key: "status", label: exportLabels.status },
        { key: "description", label: exportLabels.description },
        { key: "link", label: exportLabels.link },
      ];
      rows = checklist.map((item) => ({
        title: tGlobal(item.titleKey),
        status:
          exportLabels[item.status as keyof typeof exportLabels] || item.status,
        description: tGlobal(item.descriptionKey),
        link: item.link,
      }));
    } else if (exportDataset === "upcomingEvents") {
      title = t("events.sectionTitle");
      filename = generateExportFilename(
        "academics-overview-events",
        termId || "all",
      );
      columns = [
        { key: "title", label: exportLabels.title },
        { key: "type", label: exportLabels.type },
        { key: "scope", label: exportLabels.scope },
        { key: "allDay", label: exportLabels.allDay },
        { key: "startDate", label: exportLabels.startDate },
        { key: "endDate", label: exportLabels.endDate },
      ];
      rows = (response.upcomingEvents || []).map((event) => {
        let typeLabel = tTypes("other");
        const typeKey = event.type?.toLowerCase();
        if (typeKey === "holiday") typeLabel = tTypes("holiday");
        if (typeKey === "exam") typeLabel = tTypes("exam");
        if (typeKey === "activity") typeLabel = tTypes("activity");

        let scopeLabel = tScopes("other");
        const scopeKey = event.scope.type?.toLowerCase();
        if (scopeKey === "school") scopeLabel = tScopes("school");
        if (scopeKey === "stage") scopeLabel = tScopes("stage");
        if (scopeKey === "grade") scopeLabel = tScopes("grade");
        if (scopeKey === "section") scopeLabel = tScopes("section");

        return {
          title: event.title,
          type: typeLabel,
          scope: scopeLabel,
          allDay: event.allDay ? tCommon("yes") : tCommon("no"),
          startDate: new Date(event.startDate).toLocaleDateString(locale),
          endDate: new Date(event.endDate).toLocaleDateString(locale),
        };
      });
    }

    return { title, metadata, filename, columns, rows };
  }, [
    academicYearId,
    academicYears,
    exportDataset,
    exportLabels,
    checklist,
    lang,
    locale,
    response,
    t,
    tGlobal,
    termId,
    terms,
    tTypes,
    tScopes,
    tCommon,
  ]);

  const handleExport = (format: AcademicsExportFormat) => {
    if (!overviewExportData) {
      return;
    }

    exportAcademicsData({
      ...overviewExportData,
      format,
      locale,
      jsonData: {
        title: overviewExportData.title,
        metadata: overviewExportData.metadata,
        dataset: exportDataset,
        rows: overviewExportData.rows,
      },
    });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-gray-50">
      <div className="px-4 sm:px-6 my-6 space-y-6">
        {isLoading ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        ) : error || !response ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center bg-white rounded-2xl border border-gray-200 px-4 text-center">
            <h2 className="mb-2 text-xl font-bold text-gray-900">
              {t("error.title")}
            </h2>
            <p className="mb-6 text-gray-500 max-w-md">
              {error || t("error.loadFailed")}
            </p>
            <Button onClick={loadOverview}>{t("error.retry")}</Button>
          </div>
        ) : (
          <>
            {!response.setupIndicators.hasAcademicYear && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900">
                    {t("noActiveYearCallout.title")}
                  </h3>
                  <p className="text-sm text-blue-800 mt-1">
                    {t("noActiveYearCallout.description")}
                  </p>
                </div>
                <Link href={`/${lang}/academics/structure`}>
                  <Button leftIcon={<PlusCircle className="w-4 h-4 mr-2" />}>
                    {t("noActiveYearCallout.action")}
                  </Button>
                </Link>
              </div>
            )}

            {/* Section A: Academic Context & Filter */}
            <div className="flex flex-col gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {(lang === "ar" ? response.academicContext?.academicYear?.nameAr : response.academicContext?.academicYear?.nameEn) || t("context.noYear")}
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    {(lang === "ar" ? response.academicContext?.term?.nameAr : response.academicContext?.term?.nameEn) || t("context.noTerm")}
                  </p>
                </div>
                {response.generatedAt && (
                  <div className="text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                    {t("context.lastUpdated", {
                      date: new Date(response.generatedAt).toLocaleString(locale),
                    })}
                  </div>
                )}
              </div>

              <AcademicsOverviewFiltersBar
                exportDataset={exportDataset}
                onExportDatasetChange={(value) => {
                  const newParams = new URLSearchParams(searchParams.toString());
                  if (value === "summary") {
                    newParams.delete("exportDataset");
                  } else {
                    newParams.set("exportDataset", value);
                  }
                  const nextQuery = newParams.toString();
                  const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
                  router.replace(nextUrl, { scroll: false });
                }}
                onExportClick={() => setShowExportModal(true)}
              />
            </div>

            {/* Section B: Summary (KPIs) */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {t("summary.title")}
              </h2>
              <KPICards response={response} isLoading={isLoading} />
            </div>

            {/* Section C: Setup Checklist */}
            <div className="grid grid-cols-1 gap-6">
              <SetupChecklist
                items={checklist}
                response={response}
                isLoading={isLoading}
              />
            </div>

            {/* Section C: Readiness & Events */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <OverviewCharts
                  readinessData={readinessData}
                  readyForScheduling={
                    response.setupIndicators.readyForScheduling
                  }
                  readyForLearningFlow={
                    response.setupIndicators.readyForLearningFlow
                  }
                  isLoading={isLoading}
                />
              </div>
              <div className="lg:col-span-2">
                <UpcomingEventsPanel
                  events={response.upcomingEvents || []}
                  isLoading={isLoading}
                />
              </div>
            </div>

            {/* Quick Links */}
            <QuickLinks lang={lang} />
          </>
        )}
      </div>

      <AcademicsGlobalExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        title={tExport("title")}
        subtitle={t("title")}
        datasetCount={overviewExportData?.rows.length ?? 0}
      />
    </div>
  );
}
