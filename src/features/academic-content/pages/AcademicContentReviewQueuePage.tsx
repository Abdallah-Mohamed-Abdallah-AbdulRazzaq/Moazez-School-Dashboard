"use client";

import { ClipboardCheck, RefreshCw } from "lucide-react";
import { useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button/Button";
import EmptyState from "@/components/ui/empty-state/EmptyState";
import AcademicContentAccessGuard from "../components/AcademicContentAccessGuard";
import ReviewQueueFilters from "../components/review/ReviewQueueFilters";
import ReviewQueueTable from "../components/review/ReviewQueueTable";
import { useAcademicContentReviewQueue } from "../hooks/useAcademicContentReviewQueue";
import {
  useAcademicContentBrowseOptions,
  type AcademicContentBrowseOptionsState,
} from "../hooks/useAcademicContentBrowseOptions";
import { useAcademicContentTranslations } from "../hooks/useAcademicContentTranslations";
import type { AcademicContentReviewQueueItem } from "../types/contracts";

const APPROVE_PERMISSION = "academics.academic_content.approve" as const;

export function AcademicContentReviewQueueAccess({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AcademicContentAccessGuard requiredPermission={APPROVE_PERMISSION}>
      {children}
    </AcademicContentAccessGuard>
  );
}

export function AcademicContentReviewQueueView({
  queue,
  browseOptions,
}: {
  queue: ReturnType<typeof useAcademicContentReviewQueue>;
  browseOptions: AcademicContentBrowseOptionsState;
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
    <div
      role="alert"
      className="rounded-xl border border-red-200 bg-white shadow-sm"
    >
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
      targetOptions={browseOptions.targetOptions}
      teachers={browseOptions.teachers}
      onOpen={openReview}
      onPageChange={queue.setPage}
      onPageSizeChange={queue.setLimit}
    />
  );

  return (
    <main className="mx-auto min-w-0 max-w-screen-2xl space-y-4 p-4 sm:p-6">
      <section className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 sm:flex sm:items-center sm:justify-between">
        <p className="text-lg font-semibold text-indigo-950">
          {t("pending_total", { count: queue.total })}
        </p>
        <p className="mt-1 text-sm text-indigo-800 sm:mt-0">
          {t("oldest_first_help")}
        </p>
      </section>
      {browseOptions.targetOptionsUnavailable ||
      browseOptions.teachersUnavailable ? (
        <p
          role="status"
          className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
        >
          {t("options_warning")}
        </p>
      ) : null}
      <ReviewQueueFilters
        filters={queue.filters}
        search={queue.search}
        browseOptions={browseOptions}
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
  const browseOptions = useAcademicContentBrowseOptions();
  return (
    <AcademicContentReviewQueueView
      queue={queue}
      browseOptions={browseOptions}
    />
  );
}
