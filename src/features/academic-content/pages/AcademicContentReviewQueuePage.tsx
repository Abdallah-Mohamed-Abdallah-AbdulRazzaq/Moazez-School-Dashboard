"use client";

import { ClipboardCheck, RefreshCw } from "lucide-react";
import { useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { AccessDenied } from "@/components/ui/access-denied/AccessDenied";
import { Button } from "@/components/ui/button/Button";
import EmptyState from "@/components/ui/empty-state/EmptyState";
import { usePermissions } from "@/hooks/usePermissions";
import ReviewQueueFilters from "../components/review/ReviewQueueFilters";
import ReviewQueueTable from "../components/review/ReviewQueueTable";
import { useAcademicContentReviewQueue } from "../hooks/useAcademicContentReviewQueue";
import { useAcademicContentTranslations } from "../hooks/useAcademicContentTranslations";
import type { AcademicContentReviewQueueItem } from "../types/contracts";

const APPROVE_PERMISSION = "academics.academic_content.approve" as const;

export function AcademicContentReviewQueueAccess({
  children,
}: {
  children: React.ReactNode;
}) {
  const { hasPermission, isPermissionsReady } = usePermissions();

  if (!isPermissionsReady) return null;
  if (hasPermission(APPROVE_PERMISSION)) return <>{children}</>;

  return (
    <main className="flex min-h-80 items-center justify-center p-4 sm:p-6">
      <AccessDenied requiredPermissions={[APPROVE_PERMISSION]} />
    </main>
  );
}

export function AcademicContentReviewQueueView({
  queue,
}: {
  queue: ReturnType<typeof useAcademicContentReviewQueue>;
}) {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useAcademicContentTranslations("review");

  const openReview = (item: AcademicContentReviewQueueItem) => {
    const query = searchParams.toString();
    router.push(
      `/${locale}/academic-content-hub/review/${encodeURIComponent(
        item.contentId,
      )}/${encodeURIComponent(item.submittedRevisionId)}${
        query ? `?${query}` : ""
      }`,
      { scroll: false },
    );
  };

  const content = queue.error ? (
    <div role="alert" className="rounded-xl border border-red-200 bg-white shadow-sm">
      <EmptyState
        title={t("unavailable_title")}
        message={queue.error.message}
        icon={<RefreshCw aria-hidden="true" className="size-10" />}
        action={<Button onClick={queue.reload}>{t("retry")}</Button>}
      />
    </div>
  ) : !queue.isLoading && queue.total === 0 ? (
    <div className="rounded-xl bg-white shadow-sm">
      <EmptyState
        title={t("empty_title")}
        message={t("empty_description")}
        icon={<ClipboardCheck aria-hidden="true" className="size-10" />}
      />
    </div>
  ) : (
    <ReviewQueueTable
      items={queue.items}
      page={queue.filters.page}
      limit={queue.filters.limit}
      total={queue.total}
      isLoading={queue.isLoading}
      searchQuery={queue.search}
      onOpen={openReview}
      onPageChange={queue.setPage}
      onPageSizeChange={queue.setLimit}
    />
  );

  return (
    <main className="mx-auto min-w-0 max-w-screen-2xl space-y-4 p-4 sm:p-6">
      <ReviewQueueFilters
        filters={queue.filters}
        search={queue.search}
        onSearchChange={queue.setSearch}
        onFiltersChange={queue.setFilters}
        onClear={queue.clearFilters}
      />
      {content}
    </main>
  );
}

export default function AcademicContentReviewQueuePage() {
  return (
    <AcademicContentReviewQueueAccess>
      <AuthorizedReviewQueuePage />
    </AcademicContentReviewQueueAccess>
  );
}

function AuthorizedReviewQueuePage() {
  const queue = useAcademicContentReviewQueue();
  return <AcademicContentReviewQueueView queue={queue} />;
}
