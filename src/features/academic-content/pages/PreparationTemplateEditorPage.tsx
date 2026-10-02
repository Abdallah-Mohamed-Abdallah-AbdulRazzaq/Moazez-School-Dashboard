"use client";

import { RefreshCw } from "lucide-react";
import { useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button/Button";
import EmptyState from "@/components/ui/empty-state/EmptyState";
import PartialLoader from "@/components/ui/loaders/PartialLoader";
import AcademicContentAccessGuard from "../components/AcademicContentAccessGuard";
import PreparationTemplateForm from "../components/templates/PreparationTemplateForm";
import { usePreparationTemplateEditor } from "../hooks/usePreparationTemplates";
import { useAcademicContentTranslations } from "../hooks/useAcademicContentTranslations";
import type { CreateAcademicContentPreparationTemplateRequest } from "../types/contracts";

const MANAGE_PERMISSION = "academics.academic_content.settings.manage" as const;

function TemplateEditorAccess({ children }: { children: React.ReactNode }) {
  return (
    <AcademicContentAccessGuard requiredPermission={MANAGE_PERMISSION}>
      {children}
    </AcademicContentAccessGuard>
  );
}

function LoadedPreparationTemplateEditor({
  templateId,
}: {
  templateId?: string;
}) {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editor = usePreparationTemplateEditor(templateId);
  const t = useAcademicContentTranslations("templates");
  const query = searchParams.toString();
  const returnPath = `/${locale}/academic-content-hub/templates${
    query ? `?${query}` : ""
  }`;

  if (editor.isLoading) {
    return (
      <main className="flex min-h-80 items-center justify-center p-4 sm:p-6">
        <PartialLoader />
      </main>
    );
  }

  if (templateId && (editor.error || !editor.template)) {
    return (
      <main className="mx-auto max-w-3xl p-4 sm:p-6">
        <div role="alert" className="rounded-xl border border-red-200 bg-white shadow-sm">
          <EmptyState
            title={t("editor_unavailable")}
            message={editor.error?.message ?? t("editor_unavailable")}
            icon={<RefreshCw aria-hidden="true" className="size-10" />}
            action={<Button onClick={editor.reload}>{t("retry")}</Button>}
          />
        </div>
      </main>
    );
  }

  const save = async (
    request: CreateAcademicContentPreparationTemplateRequest,
  ) => {
    await editor.save(request);
    router.push(returnPath, { scroll: false });
    return true;
  };

  return (
    <main className="mx-auto min-w-0 max-w-screen-xl space-y-4 p-4 sm:p-6">
      <div>
        <p className="text-sm font-medium text-primary">{t("editor_eyebrow")}</p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">
          {t(templateId ? "edit_title" : "create_title")}
        </h1>
        <p className="mt-1 text-sm text-gray-500">{t("editor_description")}</p>
      </div>
      <PreparationTemplateForm
        initial={editor.template ?? undefined}
        onSubmit={save}
        onCancel={() => router.push(returnPath, { scroll: false })}
      />
    </main>
  );
}

export default function PreparationTemplateEditorPage({
  templateId,
}: {
  templateId?: string;
}) {
  return (
    <TemplateEditorAccess>
      <LoadedPreparationTemplateEditor templateId={templateId} />
    </TemplateEditorAccess>
  );
}
