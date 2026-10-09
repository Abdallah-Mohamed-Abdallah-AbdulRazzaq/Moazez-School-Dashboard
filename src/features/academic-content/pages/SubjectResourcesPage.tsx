"use client";

import { useMemo } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";
import SubjectResourceFilters from "../components/subject-resources/SubjectResourceFilters";
import SubjectResourceResults from "../components/subject-resources/SubjectResourceResults";
import SubjectResourceStatsGrid from "../components/subject-resources/SubjectResourceStatsGrid";
import SubjectResourcesHeader from "../components/subject-resources/SubjectResourcesHeader";
import { academicContentOverviewHref } from "../components/overview/overviewRoutes";
import { useAcademicContentBrowseOptions } from "../hooks/useAcademicContentBrowseOptions";
import { useSubjectResources } from "../hooks/useSubjectResources";
import { subjectResourcePageStats } from "../model/subjectResources";

export default function SubjectResourcesPage() {
  const locale = useLocale();
  const router = useRouter();
  const { academicYearId, termId } = useAcademicYearTermLayoutContext();
  const resources = useSubjectResources();
  const browseOptions = useAcademicContentBrowseOptions({
    includeTeachers: true,
  });
  const stats = useMemo(
    () => subjectResourcePageStats(resources.items, resources.total),
    [resources.items, resources.total],
  );
  if (!academicYearId || !termId) return null;
  const hasFilters = Boolean(
    resources.search ||
    resources.filters.status ||
    resources.filters.audience ||
    resources.filters.stageId ||
    resources.filters.gradeId ||
    resources.filters.classroomId ||
    resources.filters.subjectId ||
    resources.filters.teacherUserId ||
    resources.filters.resourceCategory,
  );
  const openResource = (contentId: string) =>
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
      <SubjectResourcesHeader yearId={academicYearId} termId={termId} />
      <SubjectResourceStatsGrid
        stats={stats}
        isLoading={resources.isLoading}
        isUnavailable={Boolean(resources.error)}
      />
      <SubjectResourceFilters
        filters={resources.filters}
        search={resources.search}
        browseOptions={browseOptions}
        onSearchChange={resources.setSearch}
        onFiltersChange={resources.setFilters}
        onClear={resources.clearFilters}
      />
      <SubjectResourceResults
        items={resources.items}
        page={resources.filters.page}
        limit={resources.filters.limit}
        total={resources.total}
        search={resources.search}
        view={resources.filters.view}
        isLoading={resources.isLoading}
        error={resources.error}
        hasFilters={hasFilters}
        onOpen={openResource}
        onRetry={resources.reload}
        onClearFilters={resources.clearFilters}
        onViewChange={resources.setView}
        onPageChange={resources.setPage}
        onPageSizeChange={resources.setLimit}
      />
    </main>
  );
}
