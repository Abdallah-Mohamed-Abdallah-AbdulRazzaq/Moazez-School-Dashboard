"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";
import WeeklyPlanFilters from "../components/weekly-plans/WeeklyPlanFilters";
import WeeklyPlanResults from "../components/weekly-plans/WeeklyPlanResults";
import WeeklyPlanStatsGrid from "../components/weekly-plans/WeeklyPlanStatsGrid";
import WeeklyPlansHeader from "../components/weekly-plans/WeeklyPlansHeader";
import WeeklyPlanViewToolbar from "../components/weekly-plans/WeeklyPlanViewToolbar";
import { academicContentOverviewHref } from "../components/overview/overviewRoutes";
import { useAcademicContentBrowseOptions } from "../hooks/useAcademicContentBrowseOptions";
import { useWeeklyPlans } from "../hooks/useWeeklyPlans";

export default function WeeklyPlansPage() {
  const locale = useLocale();
  const router = useRouter();
  const { academicYearId, termId } = useAcademicYearTermLayoutContext();
  const weeklyPlans = useWeeklyPlans();
  const browseOptions = useAcademicContentBrowseOptions({
    includeTeachers: false,
  });

  if (!academicYearId || !termId) return null;

  const hasFilters = Boolean(
    weeklyPlans.search ||
    weeklyPlans.filters.status ||
    weeklyPlans.filters.audience ||
    weeklyPlans.filters.stageId ||
    weeklyPlans.filters.gradeId ||
    weeklyPlans.filters.classroomId ||
    weeklyPlans.filters.subjectId,
  );
  const openPlan = (contentId: string) =>
    router.push(
      academicContentOverviewHref({
        locale,
        routeSuffix: `/${encodeURIComponent(contentId)}`,
        yearId: academicYearId,
        termId,
      }),
    );

  return (
    <main className="mx-auto min-w-0 max-w-screen-2xl space-y-4 p-4 sm:p-6">
      <WeeklyPlansHeader yearId={academicYearId} termId={termId} />
      <WeeklyPlanStatsGrid
        counts={weeklyPlans.counts}
        onRetry={weeklyPlans.retryCount}
      />
      <WeeklyPlanViewToolbar
        view={weeklyPlans.filters.view}
        onViewChange={weeklyPlans.setView}
      />
      <WeeklyPlanFilters
        filters={weeklyPlans.filters}
        search={weeklyPlans.search}
        browseOptions={browseOptions}
        onSearchChange={weeklyPlans.setSearch}
        onFiltersChange={weeklyPlans.setFilters}
        onClear={weeklyPlans.clearFilters}
      />
      <WeeklyPlanResults
        items={weeklyPlans.items}
        page={weeklyPlans.filters.page}
        limit={weeklyPlans.filters.limit}
        total={weeklyPlans.total}
        search={weeklyPlans.search}
        view={weeklyPlans.filters.view}
        isLoading={weeklyPlans.isLoading}
        error={weeklyPlans.error}
        hasFilters={hasFilters}
        onOpen={openPlan}
        onRetry={weeklyPlans.reload}
        onClearFilters={weeklyPlans.clearFilters}
        onPageChange={weeklyPlans.setPage}
        onPageSizeChange={weeklyPlans.setLimit}
      />
    </main>
  );
}
