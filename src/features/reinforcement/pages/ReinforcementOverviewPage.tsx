"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Award,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Coins,
  FileCheck2,
  ListChecks,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Users,
  XCircle,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { BarChart } from "@mui/x-charts/BarChart";
import { PieChart } from "@mui/x-charts/PieChart";
import Button from "@/components/ui/button/Button";
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/usePermissions";
import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";
import ReinforcementAcademicContextFilter, {
  type ReinforcementAcademicContextSelection,
  type ReinforcementAcademicContextValue,
} from "../components/ReinforcementAcademicContextFilter";
import ReinforcementPageHeader from "../components/shared/ReinforcementPageHeader";
import { useReinforcementUrlFilters } from "../hooks/useReinforcementUrlFilters";
import { getReinforcementOverview } from "../services/reinforcementOverviewService";
import type {
  OverviewRecentActivity,
  OverviewTopStudent,
  ReinforcementOverviewResponse,
} from "../types";

/* ---------- small reusable pieces ---------- */

const PIE_COLORS = [
  "#036b80",
  "#0ea5e9",
  "#14b8a6",
  "#f59e0b",
  "#22c55e",
  "#ef4444",
  "#94a3b8",
];

const STATUS_COLORS: Record<string, string> = {
  not_completed: "#f59e0b",
  in_progress: "#0ea5e9",
  under_review: "#8b5cf6",
  completed: "#22c55e",
  cancelled: "#ef4444",
};

const COLLAPSED_LIST_SIZE = 5;

function ExpandableList({ items }: { items: React.ReactNode[] }) {
  const t = useTranslations("reinforcement");
  const [isExpanded, setIsExpanded] = useState(false);
  const hasMoreItems = items.length > COLLAPSED_LIST_SIZE;
  const visibleItems = isExpanded
    ? items
    : items.slice(0, COLLAPSED_LIST_SIZE);

  return (
    <div>
      <div className="space-y-2">{visibleItems}</div>
      {hasMoreItems ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          fullWidth
          className="mt-3 cursor-pointer text-primary hover:bg-primary/5 hover:text-primary focus:ring-2 focus:ring-primary/30"
          rightIcon={
            isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )
          }
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded((currentValue) => !currentValue)}
        >
          {t(isExpanded ? "showLess" : "showMore")}
        </Button>
      ) : null}
    </div>
  );
}


function AccessNotice() {
  const t = useTranslations("reinforcement.common");
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-amber-100 p-2 text-amber-700">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-amber-900">
            {t("accessDenied")}
          </h1>
          <p className="mt-1 text-sm text-amber-800">{t("unauthorized")}</p>
        </div>
      </div>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  const t = useTranslations("reinforcement.actions");
  return (
    <div className="rounded-lg border border-red-100 bg-red-50 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
          <p className="text-sm text-red-700">{message}</p>
        </div>
        <Button variant="secondary" size="sm" onClick={onRetry}>
          {t("refresh")}
        </Button>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-200 bg-white px-6 py-10 text-center">
      <BarChart3 className="mx-auto mb-3 h-10 w-10 text-gray-300" />
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}

/* ---------- section wrapper ---------- */

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {subtitle ? (
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

/* ---------- mini stat inside a section ---------- */

function MiniStat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-lg bg-gray-50 px-3 py-3">
      <div className="text-xs font-medium uppercase text-gray-500">{label}</div>
      <div className="mt-1 text-lg font-bold" style={{ color }}>
        {new Intl.NumberFormat().format(value)}
      </div>
    </div>
  );
}

/* ---------- top students row ---------- */

function TopStudentRow({
  student,
  rank,
  locale,
  href,
}: {
  student: OverviewTopStudent;
  rank: number;
  locale: string;
  href: string;
}) {
  const name =
    locale === "ar" && student.student.nameAr
      ? student.student.nameAr
      : student.student.name;

  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2.5 transition-colors hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/30"
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
        {rank}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-900">{name}</p>
        <p className="text-xs text-gray-500">
          {student.completedAssignments} completed ·{" "}
          {student.completionRate}%
        </p>
      </div>
      <div className="flex items-center gap-1 text-sm font-bold text-amber-600">
        <Sparkles className="h-3.5 w-3.5" />
        {new Intl.NumberFormat().format(student.totalXp)} XP
      </div>
    </Link>
  );
}

/* ---------- recent activity row ---------- */

function ActivityRow({
  activity,
  locale,
  studentHref,
}: {
  activity: OverviewRecentActivity;
  locale: string;
  studentHref?: string;
}) {
  const t = useTranslations("reinforcement");
  const name =
    locale === "ar" && activity.student.nameAr
      ? activity.student.nameAr
      : activity.student.name;

  const isXpActivity = activity.type === "xp_ledger";
  const typeLabel = isXpActivity
    ? activity.sourceType
      ? t(`sourceType.${activity.sourceType}`, {
          defaultValue: activity.sourceType,
        })
      : t("sourceType.unknown")
    : activity.type === "submission"
      ? t("activityType.submission")
      : activity.type === "review"
        ? t("activityType.review")
        : t("activityType.unknown");
  const activityDetail = isXpActivity
    ? [typeLabel, activity.reason].filter(Boolean).join(" · ")
    : typeLabel;

  return (
    <div className="flex items-start gap-3 rounded-lg border border-gray-50 px-3 py-3 transition-colors hover:bg-gray-50">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-cyan-700">
        {isXpActivity ? (
          <Coins className="h-4 w-4" />
        ) : (
          <FileCheck2 className="h-4 w-4" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        {studentHref ? (
          <Link
            href={studentHref}
            className="text-sm font-semibold text-gray-900 transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {name}
          </Link>
        ) : (
          <p className="text-sm font-semibold text-gray-900">{name}</p>
        )}
        <p className="mt-0.5 text-xs text-gray-500">
          {activityDetail}
        </p>
      </div>
      <div className="shrink-0 text-end">
        {isXpActivity ? (
          <span className="text-sm font-bold text-emerald-600">
            +{activity.amount} XP
          </span>
        ) : (
          <span className="inline-flex rounded-full bg-cyan-50 px-2 py-1 text-xs font-medium text-cyan-700">
            {typeLabel}
          </span>
        )}
        <p className="mt-1 text-xs text-gray-500" dir="ltr">
          {new Intl.DateTimeFormat(locale, {
            dateStyle: "medium",
            timeStyle: "short",
          }).format(new Date(activity.timestamp))}
        </p>
      </div>
    </div>
  );
}

/* ---------- main page ---------- */

export default function ReinforcementOverviewPage() {
  const locale = useLocale();
  const t = useTranslations("reinforcement");
  const { isLoading: authLoading } = useAuth();
  const { hasPermission } = usePermissions();
  const { academicYearId, termId } = useAcademicYearTermLayoutContext();

  // ─── URL-synced filters ──────────────────────────────────────────────────
  const {
    values,
    setValue,
  } = useReinforcementUrlFilters({
    paramKeys: ["stageId", "gradeId", "sectionId", "classroomId"],
    defaults: {},
  });

  // ─── Academic context derived from URL params ────────────────────────────
  const context: ReinforcementAcademicContextValue = useMemo(
    () => ({
      academicYearId,
      termId,
      stageId: values.stageId || undefined,
      gradeId: values.gradeId || undefined,
      sectionId: values.sectionId || undefined,
      classroomId: values.classroomId || undefined,
    }),
    [academicYearId, termId, values.stageId, values.gradeId, values.sectionId, values.classroomId],
  );

  const [overview, setOverview] = useState<ReinforcementOverviewResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canView = hasPermission("reinforcement.overview.view");

  const params = useMemo(
    () => ({
      academicYearId: context.academicYearId,
      termId: context.termId,
      classroomId: context.classroomId,
    }),
    [context.academicYearId, context.classroomId, context.termId],
  );

  const buildReinforcementQuery = useCallback(
    (
      extra?: Record<string, string | undefined | null>,
      options?: { includeClassroom?: boolean },
    ) => {
      const queryParams = new URLSearchParams();

      if (context.academicYearId) {
        queryParams.set("academicYearId", context.academicYearId);
      }

      if (context.termId) {
        queryParams.set("termId", context.termId);
      }

      if (options?.includeClassroom !== false && context.classroomId) {
        queryParams.set("classroomId", context.classroomId);
      }

      Object.entries(extra ?? {}).forEach(([key, value]) => {
        if (value) {
          queryParams.set(key, value);
        }
      });

      const query = queryParams.toString();
      return query ? `?${query}` : "";
    },
    [context.academicYearId, context.classroomId, context.termId],
  );

  const classroomSummaryHref = context.classroomId
    ? `/${locale}/reinforcement/classrooms/${
        context.classroomId
      }/summary${buildReinforcementQuery(undefined, {
        includeClassroom: false,
      })}`
    : undefined;

  const getStudentProgressHref = useCallback(
    (studentId: string) =>
      `/${locale}/reinforcement/students/${studentId}/progress${buildReinforcementQuery()}`,
    [buildReinforcementQuery, locale],
  );

  const refreshOverview = useCallback(async () => {
    if (!canView) return;
    setLoading(true);
    setError(null);
    try {
      const nextOverview = await getReinforcementOverview(params);
      setOverview(nextOverview);
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : t("common.error"),
      );
      setOverview(null);
    } finally {
      setLoading(false);
    }
  }, [canView, params, t]);

  useEffect(() => {
    void Promise.resolve().then(refreshOverview);
  }, [refreshOverview]);

  /* chart data */
  const statusChartData = useMemo(() => {
    if (!overview) return [];
    return overview.tasks.byStatus.map((item, i) => ({
      id: item.status,
      value: item.count,
      label: t(`status.${item.status}`, { defaultValue: item.status }),
      color: STATUS_COLORS[item.status] || PIE_COLORS[i % PIE_COLORS.length],
    }));
  }, [overview, t]);

  const sourceChartData = useMemo(() => {
    if (!overview) return [];
    return overview.tasks.bySource.map((item, i) => ({
      id: item.source,
      value: item.count,
      label: t(`source.${item.source}`, { defaultValue: item.source }),
      color: PIE_COLORS[i % PIE_COLORS.length],
    }));
  }, [overview, t]);

  const xpSourceChartData = useMemo(() => {
    if (!overview) return [];
    return overview.xp.bySourceType
      .filter((item) => item.totalXp > 0 || item.count > 0)
      .map((item) => ({
        label: item.sourceType
          ? t(`sourceType.${item.sourceType}`, {
              defaultValue: item.sourceType,
            })
          : t("sourceType.unknown"),
        totalXp: item.totalXp,
        count: item.count,
      }));
  }, [overview, t]);

  if (authLoading) return <MainLoader />;
  if (!canView) return <AccessNotice />;

  return (
    <div
      className="min-h-screen space-y-6 bg-gray-50"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      {/* header */}
      <ReinforcementPageHeader
        title={t("overview.title")}
        description={t("overview.description")}
        actions={
          <>
            {classroomSummaryHref ? (
              <Link
                href={classroomSummaryHref}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                <BarChart3 className="h-4 w-4" />
                <span>{t("overview.viewClassroomSummary")}</span>
              </Link>
            ) : null}
            <Button
              variant="secondary"
              leftIcon={<RefreshCw className="h-4 w-4" />}
              loading={loading}
              onClick={refreshOverview}
            >
              {t("actions.refresh")}
            </Button>
          </>
        }
      />

      {/* filters */}
      <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-gray-900">
            {t("overview.filtersTitle")}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {t("overview.filtersDescription")}
          </p>
        </div>
        <ReinforcementAcademicContextFilter
          value={context}
          showAcademicYearTerm={false}
          showSubject={false}
          showStudent={false}
          onChange={(selection: ReinforcementAcademicContextSelection) => {
            setValue("stageId", selection.stageId || "");
            setValue("gradeId", selection.gradeId || "");
            setValue("sectionId", selection.sectionId || "");
            setValue("classroomId", selection.classroomId || "");
          }}
        />
      </section>

      {/* error */}
      {error ? (
        <ErrorState message={error} onRetry={refreshOverview} />
      ) : null}

      {/* loading state */}
      {loading && !overview ? (
        <MainLoader />
      ) : !overview ? (
        <EmptyState message={t("emptyStates.overview")} />
      ) : (
        <>
          {/* KPI cards */}
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <KPICardV2
              title={t("charts.tasksByStatus", { defaultValue: "Total Tasks" })}
              value={overview.tasks.total}
              icon={ListChecks}
              iconColor="#036b80"
              iconBgColor="#e0f2f5"
              showChart={false}
            />
            <KPICardV2
              title={t("overview.activeAssignments")}
              value={overview.assignments.total}
              icon={Users}
              iconColor="#7c3aed"
              iconBgColor="#ede9fe"
              showChart={false}
            />
            <KPICardV2
              title={t("overview.completionRate")}
              value={`${overview.assignments.completionRate}%`}
              icon={CheckCircle2}
              iconColor="#16a34a"
              iconBgColor="#dcfce7"
              showChart={false}
            />
            <KPICardV2
              title={t("xp.summary.totalXp")}
              value={overview.xp.totalXp}
              icon={Sparkles}
              iconColor="#d97706"
              iconBgColor="#fef3c7"
              showChart={false}
            />
          </section>

          {/* tasks breakdown charts */}
          <div className="grid gap-4 xl:grid-cols-2">
            <SectionCard
              title={t("charts.tasksByStatus")}
              subtitle={t("charts.tasksByStatusSubtitle")}
            >
              {statusChartData.length > 0 ? (
                <>
                  <PieChart
                    height={260}
                    series={[
                      {
                        data: statusChartData,
                        innerRadius: 45,
                        outerRadius: 90,
                      },
                    ]}
                  />
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {statusChartData.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-sm text-gray-700">
                            {item.label}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="py-8 text-center text-sm text-gray-400">
                  {t("emptyStates.overview")}
                </p>
              )}
            </SectionCard>

            <SectionCard
              title={t("charts.tasksBySource")}
              subtitle={t("charts.tasksBySourceSubtitle")}
            >
              {sourceChartData.length > 0 ? (
                <>
                  <BarChart
                    dataset={
                      sourceChartData as unknown as Array<
                        Record<string, string | number>
                      >
                    }
                    xAxis={[{ scaleType: "band", dataKey: "label" }]}
                    series={[{ dataKey: "value", color: "#036b80" }]}
                    height={260}
                    margin={{ top: 16, right: 20, left: 32, bottom: 36 }}
                  />
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {sourceChartData.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-sm text-gray-700">
                            {item.label}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="py-8 text-center text-sm text-gray-400">
                  {t("emptyStates.overview")}
                </p>
              )}
            </SectionCard>
          </div>

          {/* assignments + review queue */}
          <div className="grid gap-4 xl:grid-cols-2">
            <SectionCard title={t("overview.assignmentsSummary")}>
              <div className="grid gap-3 sm:grid-cols-3">
                <MiniStat
                  label={t("kpi.notCompleted")}
                  value={overview.assignments.notCompleted}
                  color="#d97706"
                />
                <MiniStat
                  label={t("kpi.inProgress")}
                  value={overview.assignments.inProgress}
                  color="#0ea5e9"
                />
                <MiniStat
                  label={t("status.under_review")}
                  value={overview.assignments.underReview}
                  color="#8b5cf6"
                />
                <MiniStat
                  label={t("status.completed")}
                  value={overview.assignments.completed}
                  color="#22c55e"
                />
                <MiniStat
                  label={t("status.cancelled")}
                  value={overview.assignments.cancelled}
                  color="#ef4444"
                />
                <MiniStat
                  label={t("overview.completionRate")}
                  value={overview.assignments.completionRate}
                  color="#036b80"
                />
              </div>
            </SectionCard>

            <SectionCard title={t("overview.reviewQueue")}>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-3">
                  <Clock className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="text-xs font-medium text-gray-500">
                      {t("overview.pendingReview")}
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      {overview.reviewQueue.pendingReview}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-3">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-xs font-medium text-gray-500">
                      {t("overview.submitted")}
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      {overview.reviewQueue.submitted}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <div>
                    <p className="text-xs font-medium text-gray-500">
                      {t("overview.approved")}
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      {overview.reviewQueue.approved}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-3">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-xs font-medium text-gray-500">
                      {t("overview.rejected")}
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      {overview.reviewQueue.rejected}
                    </p>
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>

          {/* XP distribution */}
          <SectionCard title={t("overview.xpDistribution")} subtitle={t("overview.xpEarnedBySource")}>
            <div className="mb-4 grid gap-3 sm:grid-cols-3">
              <MiniStat
                label={t("xp.summary.totalXp")}
                value={overview.xp.totalXp}
                color="#d97706"
              />
              <MiniStat
                label={t("overview.studentsWithXp")}
                value={overview.xp.studentsWithXp}
                color="#7c3aed"
              />
              <MiniStat
                label={t("overview.averageXp")}
                value={overview.xp.averageXp}
                color="#036b80"
              />
            </div>
            {xpSourceChartData.length > 0 ? (
              <BarChart
                dataset={
                  xpSourceChartData as unknown as Array<
                    Record<string, string | number>
                  >
                }
                xAxis={[{ scaleType: "band", dataKey: "label" }]}
                series={[
                  { dataKey: "totalXp", label: "Total XP", color: "#0ea5e9" },
                  { dataKey: "count", label: "Count", color: "#14b8a6" },
                ]}
                height={300}
                margin={{ top: 16, right: 20, left: 40, bottom: 60 }}
              />
            ) : (
              <p className="py-8 text-center text-sm text-gray-400">
                {t("overview.noXpData")}
              </p>
            )}
          </SectionCard>

          {/* top students + recent activity */}
          <div className="grid gap-4 xl:grid-cols-[1fr,1.2fr]">
            <SectionCard title={t("charts.topStudents")}>
              {overview.topStudents.length > 0 ? (
                <ExpandableList
                  items={overview.topStudents.map((student, index) => (
                    <TopStudentRow
                      key={student.studentId}
                      student={student}
                      rank={index + 1}
                      locale={locale}
                      href={getStudentProgressHref(student.studentId)}
                    />
                  ))}
                />
              ) : (
                <div className="flex flex-col items-center gap-2 py-8 text-gray-400">
                  <Award className="h-8 w-8" />
                  <p className="text-sm">{t("emptyStates.overview")}</p>
                </div>
              )}
            </SectionCard>

            <SectionCard
              title={t("recentActivity")}
              subtitle={t("recentActivitySubtitle")}
            >
              {overview.recentActivity.length > 0 ? (
                <ExpandableList
                  items={overview.recentActivity.map((activity) => (
                    <ActivityRow
                      key={activity.id}
                      activity={activity}
                      locale={locale}
                      studentHref={
                        activity.student.id
                          ? getStudentProgressHref(activity.student.id)
                          : undefined
                      }
                    />
                  ))}
                />
              ) : (
                <div className="flex flex-col items-center gap-2 py-8 text-gray-400">
                  <Clock className="h-8 w-8" />
                  <p className="text-sm">{t("emptyStates.overview")}</p>
                </div>
              )}
            </SectionCard>
          </div>
        </>
      )}
    </div>
  );
}
