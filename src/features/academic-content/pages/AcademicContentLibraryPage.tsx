"use client";

import { LibraryBig, RefreshCw } from "lucide-react";
import { useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button/Button";
import EmptyState from "@/components/ui/empty-state/EmptyState";
import AcademicContentFilters from "../components/library/AcademicContentFilters";
import AcademicContentTable from "../components/library/AcademicContentTable";
import { useAcademicContentLibrary } from "../hooks/useAcademicContentLibrary";
import {
  useAcademicContentBrowseOptions,
  type AcademicContentBrowseOptionsState,
} from "../hooks/useAcademicContentBrowseOptions";
import { useAcademicContentTranslations } from "../hooks/useAcademicContentTranslations";

export function AcademicContentLibraryView({
  library,
  browseOptions,
}: {
  library: ReturnType<typeof useAcademicContentLibrary>;
  browseOptions: AcademicContentBrowseOptionsState;
}) {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useAcademicContentTranslations();

  const openContent = (contentId: string) => {
    const query = searchParams.toString();
    router.push(
      `/${locale}/academic-content-hub/${encodeURIComponent(contentId)}${
        query ? `?${query}` : ""
      }`,
      { scroll: false },
    );
  };

  const content = library.error ? (
    <div
      role="alert"
      className="rounded-xl border border-red-200 bg-white shadow-sm"
    >
      <EmptyState
        title={t("library.unavailable_title")}
        message={library.error.message}
        icon={<RefreshCw aria-hidden="true" className="size-10" />}
        action={<Button onClick={library.reload}>{t("common.retry")}</Button>}
      />
    </div>
  ) : !library.isLoading && library.total === 0 ? (
    <div className="rounded-xl bg-white shadow-sm">
      <EmptyState
        title={t("library.empty_title")}
        message={t("library.empty_description")}
        icon={<LibraryBig aria-hidden="true" className="size-10" />}
      />
    </div>
  ) : (
    <AcademicContentTable
      items={library.items}
      page={library.filters.page}
      limit={library.filters.limit}
      total={library.total}
      isLoading={library.isLoading}
      searchQuery={library.search}
      onOpen={(contentItem) => openContent(contentItem.id)}
      onPageChange={library.setPage}
      onPageSizeChange={library.setLimit}
    />
  );

  return (
    <main className="mx-auto min-w-0 max-w-screen-2xl space-y-4 p-4 sm:p-6">
      <AcademicContentFilters
        filters={library.filters}
        search={library.search}
        resultCount={library.total}
        browseOptions={browseOptions}
        onSearchChange={library.setSearch}
        onFiltersChange={library.setFilters}
        onClear={library.clearFilters}
      />
      {content}
    </main>
  );
}

export default function AcademicContentLibraryPage() {
  const library = useAcademicContentLibrary();
  const browseOptions = useAcademicContentBrowseOptions();
  return (
    <AcademicContentLibraryView
      library={library}
      browseOptions={browseOptions}
    />
  );
}
