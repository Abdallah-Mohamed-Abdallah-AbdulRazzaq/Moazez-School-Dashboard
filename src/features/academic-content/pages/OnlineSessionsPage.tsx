"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";
import OnlineSessionFilters from "../components/online-sessions/OnlineSessionFilters";
import OnlineSessionResults from "../components/online-sessions/OnlineSessionResults";
import OnlineSessionStatsGrid from "../components/online-sessions/OnlineSessionStatsGrid";
import OnlineSessionsHeader from "../components/online-sessions/OnlineSessionsHeader";
import { academicContentOverviewHref } from "../components/overview/overviewRoutes";
import { useAcademicContentBrowseOptions } from "../hooks/useAcademicContentBrowseOptions";
import { useOnlineSessions } from "../hooks/useOnlineSessions";
import { onlineSessionPageStats } from "../model/onlineSessions";

export default function OnlineSessionsPage() {
  const locale = useLocale();
  const router = useRouter();
  const { academicYearId, termId } = useAcademicYearTermLayoutContext();
  const sessions = useOnlineSessions();
  const browseOptions = useAcademicContentBrowseOptions({
    includeTeachers: true,
  });
  const now = new Date();
  const stats = onlineSessionPageStats(sessions.items, sessions.total, now);
  if (!academicYearId || !termId) return null;
  const hasFilters = Boolean(
    sessions.search ||
    sessions.filters.status ||
    sessions.filters.audience ||
    sessions.filters.stageId ||
    sessions.filters.gradeId ||
    sessions.filters.classroomId ||
    sessions.filters.subjectId ||
    sessions.filters.teacherUserId ||
    sessions.filters.platform ||
    sessions.filters.dateFrom ||
    sessions.filters.dateTo,
  );
  const openSession = (contentId: string) =>
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
      <OnlineSessionsHeader yearId={academicYearId} termId={termId} />
      <OnlineSessionStatsGrid
        stats={stats}
        isLoading={sessions.isLoading}
        isUnavailable={Boolean(sessions.error)}
      />
      <OnlineSessionFilters
        filters={sessions.filters}
        search={sessions.search}
        browseOptions={browseOptions}
        onSearchChange={sessions.setSearch}
        onFiltersChange={sessions.setFilters}
        onClear={sessions.clearFilters}
      />
      <OnlineSessionResults
        items={sessions.items}
        page={sessions.filters.page}
        limit={sessions.filters.limit}
        total={sessions.total}
        search={sessions.search}
        isLoading={sessions.isLoading}
        error={sessions.error}
        hasFilters={hasFilters}
        now={now}
        onOpen={openSession}
        onRetry={sessions.reload}
        onClearFilters={sessions.clearFilters}
        onPageChange={sessions.setPage}
        onPageSizeChange={sessions.setLimit}
      />
    </main>
  );
}
