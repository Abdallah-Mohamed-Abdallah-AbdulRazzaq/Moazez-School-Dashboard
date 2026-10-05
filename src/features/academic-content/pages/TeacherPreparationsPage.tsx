"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";
import PreparationStatsGrid from "../components/preparations/PreparationStatsGrid";
import TeacherPreparationFilters from "../components/preparations/TeacherPreparationFilters";
import TeacherPreparationResults from "../components/preparations/TeacherPreparationResults";
import TeacherPreparationsHeader from "../components/preparations/TeacherPreparationsHeader";
import { academicContentOverviewHref } from "../components/overview/overviewRoutes";
import { useAcademicContentBrowseOptions } from "../hooks/useAcademicContentBrowseOptions";
import { useTeacherPreparations } from "../hooks/useTeacherPreparations";

export default function TeacherPreparationsPage() {
  const locale = useLocale();
  const router = useRouter();
  const { academicYearId, termId } = useAcademicYearTermLayoutContext();
  const preparations = useTeacherPreparations();
  const browseOptions = useAcademicContentBrowseOptions();

  if (!academicYearId || !termId) return null;

  const hasFilters = Boolean(
    preparations.search ||
      preparations.filters.status ||
      preparations.filters.teacherUserId ||
      preparations.filters.stageId ||
      preparations.filters.gradeId ||
      preparations.filters.classroomId ||
      preparations.filters.subjectId,
  );
  const openContent = (contentId: string) =>
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
      <TeacherPreparationsHeader yearId={academicYearId} termId={termId} />
      <PreparationStatsGrid counts={preparations.counts} onRetry={preparations.retryCount} />
      <TeacherPreparationFilters filters={preparations.filters} search={preparations.search} resultCount={preparations.total} browseOptions={browseOptions} onSearchChange={preparations.setSearch} onFiltersChange={preparations.setFilters} onClear={preparations.clearFilters} />
      <TeacherPreparationResults items={preparations.items} page={preparations.filters.page} limit={preparations.filters.limit} total={preparations.total} search={preparations.search} isLoading={preparations.isLoading} error={preparations.error} hasFilters={hasFilters} onOpen={openContent} onRetry={preparations.reload} onClearFilters={preparations.clearFilters} onPageChange={preparations.setPage} onPageSizeChange={preparations.setLimit} />
    </main>
  );
}
