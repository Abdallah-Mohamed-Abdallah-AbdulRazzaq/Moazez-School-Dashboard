"use client";

import { useState } from "react";
import { FilePlus2, LayoutTemplate, RefreshCw } from "lucide-react";
import { useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button/Button";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";
import EmptyState from "@/components/ui/empty-state/EmptyState";
import { usePermissions } from "@/hooks/usePermissions";
import PreparationTemplateFilters from "../components/templates/PreparationTemplateFilters";
import PreparationTemplateTable from "../components/templates/PreparationTemplateTable";
import { usePreparationTemplates } from "../hooks/usePreparationTemplates";
import { useAcademicContentTranslations } from "../hooks/useAcademicContentTranslations";
import type { AcademicContentPreparationTemplateListItem } from "../types/contracts";

const MANAGE_PERMISSION = "academics.academic_content.settings.manage" as const;

export function PreparationTemplatesView({
  templates,
}: {
  templates: ReturnType<typeof usePreparationTemplates>;
}) {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission, isPermissionsReady } = usePermissions();
  const [templateToDelete, setTemplateToDelete] =
    useState<AcademicContentPreparationTemplateListItem | null>(null);
  const t = useAcademicContentTranslations("templates");
  const canManage = hasPermission(MANAGE_PERMISSION);
  const rootPath = `/${locale}/academic-content-hub/templates`;
  const currentQuery = searchParams.toString();
  const withQuery = (path: string) =>
    currentQuery ? `${path}?${currentQuery}` : path;

  if (!isPermissionsReady) return null;

  const confirmDelete = async () => {
    if (!templateToDelete) return;
    if (await templates.deleteTemplate(templateToDelete.id)) {
      setTemplateToDelete(null);
    }
  };

  const content = templates.error ? (
    <div role="alert" className="rounded-xl border border-red-200 bg-white shadow-sm">
      <EmptyState
        title={t("unavailable_title")}
        message={templates.error.message}
        icon={<RefreshCw aria-hidden="true" className="size-10" />}
        action={<Button onClick={templates.reload}>{t("retry")}</Button>}
      />
    </div>
  ) : !templates.isLoading && templates.total === 0 ? (
    <div className="rounded-xl bg-white shadow-sm">
      <EmptyState
        title={t("empty_title")}
        message={t("empty_description")}
        icon={<LayoutTemplate aria-hidden="true" className="size-10" />}
      />
    </div>
  ) : (
    <PreparationTemplateTable
      items={templates.items}
      page={templates.filters.page}
      limit={templates.filters.limit}
      total={templates.total}
      isLoading={templates.isLoading}
      searchQuery={templates.search}
      canManage={canManage}
      editHref={(templateId) =>
        withQuery(`${rootPath}/${encodeURIComponent(templateId)}/edit`)
      }
      onDelete={setTemplateToDelete}
      onPageChange={templates.setPage}
      onPageSizeChange={templates.setLimit}
    />
  );

  return (
    <main className="mx-auto min-w-0 max-w-screen-2xl space-y-4 p-4 sm:p-6">
      <div className="flex justify-end">
        {canManage && (
          <Button
            size="sm"
            leftIcon={<FilePlus2 aria-hidden="true" className="size-4" />}
            onClick={() => router.push(withQuery(`${rootPath}/new`))}
          >
            {t("new")}
          </Button>
        )}
      </div>
      <PreparationTemplateFilters
        filters={templates.filters}
        search={templates.search}
        onSearchChange={templates.setSearch}
        onFiltersChange={templates.setFilters}
        onClear={templates.clearFilters}
      />
      {content}

      <ConfirmDialog
        isOpen={Boolean(templateToDelete)}
        onClose={() => setTemplateToDelete(null)}
        onConfirm={() => void confirmDelete()}
        title={t("delete_title", { name: templateToDelete?.name ?? "" })}
        description={t("delete_description")}
        confirmLabel={t("delete_confirm")}
        cancelLabel={t("cancel")}
        loading={templates.isDeleting}
        severity="danger"
      />
    </main>
  );
}

export default function PreparationTemplatesPage() {
  const templates = usePreparationTemplates();
  return <PreparationTemplatesView templates={templates} />;
}
