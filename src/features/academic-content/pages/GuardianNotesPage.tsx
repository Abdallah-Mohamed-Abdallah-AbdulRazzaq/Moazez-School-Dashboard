"use client";

import { useMemo } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";
import GuardianNoteFilters from "../components/guardian-notes/GuardianNoteFilters";
import GuardianNoteResults from "../components/guardian-notes/GuardianNoteResults";
import GuardianNoteStatsGrid from "../components/guardian-notes/GuardianNoteStatsGrid";
import GuardianNotesHeader from "../components/guardian-notes/GuardianNotesHeader";
import { academicContentOverviewHref } from "../components/overview/overviewRoutes";
import { useAcademicContentBrowseOptions } from "../hooks/useAcademicContentBrowseOptions";
import { useGuardianNotes } from "../hooks/useGuardianNotes";
import { guardianNotePageStats } from "../model/guardianNotes";

export default function GuardianNotesPage() {
  const locale = useLocale();
  const router = useRouter();
  const { academicYearId, termId } = useAcademicYearTermLayoutContext();
  const guardianNotes = useGuardianNotes();
  const browseOptions = useAcademicContentBrowseOptions({
    includeTeachers: false,
  });
  const stats = useMemo(
    () => guardianNotePageStats(guardianNotes.items, guardianNotes.total),
    [guardianNotes.items, guardianNotes.total],
  );

  if (!academicYearId || !termId) return null;

  const hasFilters = Boolean(
    guardianNotes.search ||
    guardianNotes.filters.status ||
    guardianNotes.filters.priority ||
    guardianNotes.filters.stageId ||
    guardianNotes.filters.gradeId ||
    guardianNotes.filters.classroomId ||
    guardianNotes.filters.subjectId,
  );
  const openNote = (contentId: string) =>
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
      <GuardianNotesHeader yearId={academicYearId} termId={termId} />
      <GuardianNoteStatsGrid
        stats={stats}
        isLoading={guardianNotes.isLoading}
        isUnavailable={Boolean(guardianNotes.error)}
      />
      <GuardianNoteFilters
        filters={guardianNotes.filters}
        search={guardianNotes.search}
        browseOptions={browseOptions}
        onSearchChange={guardianNotes.setSearch}
        onFiltersChange={guardianNotes.setFilters}
        onClear={guardianNotes.clearFilters}
      />
      <GuardianNoteResults
        items={guardianNotes.items}
        page={guardianNotes.filters.page}
        limit={guardianNotes.filters.limit}
        total={guardianNotes.total}
        search={guardianNotes.search}
        view={guardianNotes.filters.view}
        isLoading={guardianNotes.isLoading}
        error={guardianNotes.error}
        hasFilters={hasFilters}
        onOpen={openNote}
        onRetry={guardianNotes.reload}
        onClearFilters={guardianNotes.clearFilters}
        onViewChange={guardianNotes.setView}
        onPageChange={guardianNotes.setPage}
        onPageSizeChange={guardianNotes.setLimit}
      />
    </main>
  );
}
