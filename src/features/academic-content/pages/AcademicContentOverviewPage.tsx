"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";
import { usePermissions } from "@/hooks/usePermissions";
import AcademicContentQuickLinks from "../components/overview/AcademicContentQuickLinks";
import ContentTypeGrid from "../components/overview/ContentTypeGrid";
import RecentlyUpdatedPanel from "../components/overview/RecentlyUpdatedPanel";
import UpcomingSessionsPanel from "../components/overview/UpcomingSessionsPanel";
import WorkInProgressPanel from "../components/overview/WorkInProgressPanel";
import { academicContentOverviewHref } from "../components/overview/overviewRoutes";
import { useAcademicContentOverview } from "../hooks/useAcademicContentOverview";

export default function AcademicContentOverviewPage() {
  const locale = useLocale();
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const { academicYearId, termId } = useAcademicYearTermLayoutContext();
  const overview = useAcademicContentOverview({ academicYearId, termId });

  if (!academicYearId || !termId) return null;

  const openContent = (contentId: string) => {
    router.push(
      academicContentOverviewHref({
        locale,
        routeSuffix: `/${encodeURIComponent(contentId)}`,
        yearId: academicYearId,
        termId,
      }),
    );
  };

  return (
    <main className="mx-auto min-w-0 max-w-screen-2xl space-y-4 p-4 sm:p-6">
      <ContentTypeGrid
        yearId={academicYearId}
        termId={termId}
        totals={overview.totals}
        onRetryType={overview.retryType}
      />
      <div className="grid gap-4 xl:grid-cols-2">
        <WorkInProgressPanel
          resource={overview.workInProgress}
          onRetry={overview.retryWorkInProgress}
          onOpen={openContent}
        />
        <UpcomingSessionsPanel
          resource={overview.upcomingSessions}
          onRetry={overview.retryUpcomingSessions}
          onOpen={openContent}
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(16rem,1fr)]">
        <RecentlyUpdatedPanel
          resource={overview.recentlyUpdated}
          onRetry={overview.retryRecentlyUpdated}
          onOpen={openContent}
        />
        <AcademicContentQuickLinks
          yearId={academicYearId}
          termId={termId}
          canApprove={hasPermission("academics.academic_content.approve")}
        />
      </div>
    </main>
  );
}
