"use client";

import { useMemo } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";
import GeneralResourceFilters from "../components/general-resources/GeneralResourceFilters";
import GeneralResourceResults from "../components/general-resources/GeneralResourceResults";
import GeneralResourceStatsGrid from "../components/general-resources/GeneralResourceStatsGrid";
import GeneralResourcesHeader from "../components/general-resources/GeneralResourcesHeader";
import { academicContentOverviewHref } from "../components/overview/overviewRoutes";
import { useAcademicContentBrowseOptions } from "../hooks/useAcademicContentBrowseOptions";
import { useGeneralResources } from "../hooks/useGeneralResources";
import { generalResourcePageStats } from "../model/generalResources";

export default function GeneralResourcesPage() {
  const locale = useLocale();
  const router = useRouter();
  const { academicYearId, termId } = useAcademicYearTermLayoutContext();
  const resources = useGeneralResources();
  const browseOptions = useAcademicContentBrowseOptions({
    includeTeachers: true,
  });
  const stats = useMemo(
    () => generalResourcePageStats(resources.items, resources.total),
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
    resources.filters.tag,
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
      <GeneralResourcesHeader yearId={academicYearId} termId={termId} />
      <GeneralResourceStatsGrid
        stats={stats}
        isLoading={resources.isLoading}
        isUnavailable={Boolean(resources.error)}
      />
      <GeneralResourceFilters
        filters={resources.filters}
        search={resources.search}
        browseOptions={browseOptions}
        onSearchChange={resources.setSearch}
        onFiltersChange={resources.setFilters}
        onClear={resources.clearFilters}
      />
      <GeneralResourceResults
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
