"use client";

import { useCallback, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button/Button";
import EmptyState from "@/components/ui/empty-state/EmptyState";
import PartialLoader from "@/components/ui/loaders/PartialLoader";
import { useGuardedAcademicContextChange } from "@/features/academics/hooks/useGuardedAcademicContextChange";
import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";
import { usePermissions } from "@/hooks/usePermissions";
import GenericAcademicContentEditorView from "../components/editor/GenericAcademicContentEditorView";
import { useAcademicContentEditor } from "../hooks/useAcademicContentEditor";
import { useAcademicContentTranslations } from "../hooks/useAcademicContentTranslations";
import type { AcademicContentBase } from "../types/contracts";
import TeacherPreparationEditorView from "../components/preparation-detail/TeacherPreparationEditorView";
import WeeklyPlanEditorView from "../components/weekly-plan-detail/WeeklyPlanEditorView";
import GuardianNoteEditorView from "../components/guardian-note-detail/GuardianNoteEditorView";
import SubjectResourceEditorView from "../components/subject-resource-detail/SubjectResourceEditorView";
import OnlineSessionEditorView from "../components/online-session-detail/OnlineSessionEditorView";
import GeneralResourceEditorView from "../components/general-resource-detail/GeneralResourceEditorView";

type AcademicContentEditorState = ReturnType<typeof useAcademicContentEditor>;

interface AcademicContentEditorViewProps {
  editor: AcademicContentEditorState;
  canManage: boolean;
  canPublish?: boolean;
  academicYearName: string;
  termName: string;
  termBounds?: { startDate: string; endDate: string };
  onLifecycleChanged?: (
    updatedContent: AcademicContentBase,
  ) => Promise<unknown>;
  onDeleted?: () => void;
}

export function AcademicContentEditorView({
  editor,
  canManage,
  canPublish = false,
  academicYearName,
  termName,
  termBounds,
  onLifecycleChanged = async () => undefined,
  onDeleted = () => undefined,
}: AcademicContentEditorViewProps) {
  const t = useAcademicContentTranslations();

  if (editor.isLoading) {
    return (
      <main className="flex min-h-80 items-center justify-center p-4 sm:p-6">
        <PartialLoader />
      </main>
    );
  }

  if (editor.error || !editor.content) {
    return (
      <main className="mx-auto max-w-3xl p-4 sm:p-6">
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-white shadow-sm"
        >
          <EmptyState
            title={t("editor.unavailable_title")}
            message={editor.error?.message ?? t("editor.unavailable_message")}
            icon={<RefreshCw aria-hidden="true" className="size-10" />}
            action={
              <Button onClick={editor.reload}>{t("common.retry")}</Button>
            }
          />
        </div>
      </main>
    );
  }

  const content = editor.content;

  if (content.type === "TEACHER_PREPARATION") {
    return (
      <TeacherPreparationEditorView
        editor={{ ...editor, content }}
        canManage={canManage}
        onLifecycleChanged={onLifecycleChanged}
        onDeleted={onDeleted}
      />
    );
  }

  if (content.type === "WEEKLY_PLAN") {
    return (
      <WeeklyPlanEditorView
        editor={{ ...editor, content }}
        canManage={canManage}
        canPublish={canPublish}
        termBounds={termBounds}
        onLifecycleChanged={onLifecycleChanged}
        onDeleted={onDeleted}
      />
    );
  }

  if (content.type === "GUARDIAN_WEEKLY_NOTE") {
    return (
      <GuardianNoteEditorView
        editor={{ ...editor, content }}
        canManage={canManage}
        canPublish={canPublish}
        onLifecycleChanged={onLifecycleChanged}
        onDeleted={onDeleted}
      />
    );
  }

  if (content.type === "SUBJECT_RESOURCE") {
    return (
      <SubjectResourceEditorView
        editor={{ ...editor, content }}
        canManage={canManage}
        canPublish={canPublish}
        onLifecycleChanged={onLifecycleChanged}
        onDeleted={onDeleted}
      />
    );
  }

  if (content.type === "ONLINE_SESSION") {
    return (
      <OnlineSessionEditorView
        editor={{ ...editor, content }}
        canManage={canManage}
        canPublish={canPublish}
        academicYearName={academicYearName}
        termName={termName}
        termBounds={termBounds}
        onLifecycleChanged={onLifecycleChanged}
        onDeleted={onDeleted}
      />
    );
  }

  if (content.type === "GENERAL_RESOURCE") {
    return (
      <GeneralResourceEditorView
        editor={{ ...editor, content }}
        canManage={canManage}
        canPublish={canPublish}
        academicYearName={academicYearName}
        termName={termName}
        onLifecycleChanged={onLifecycleChanged}
        onDeleted={onDeleted}
      />
    );
  }

  return (
    <GenericAcademicContentEditorView
      editor={{ ...editor, content }}
      canManage={canManage}
      canPublish={canPublish}
      academicYearName={academicYearName}
      termName={termName}
      termBounds={termBounds}
      onLifecycleChanged={onLifecycleChanged}
      onDeleted={onDeleted}
    />
  );
}

export default function AcademicContentEditorPage({
  contentId,
}: {
  contentId: string;
}) {
  const editor = useAcademicContentEditor(contentId);
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = usePermissions();
  const { academicYears, terms, selectedTerm } =
    useAcademicYearTermLayoutContext();
  const t = useAcademicContentTranslations("editor");
  const academicYear = academicYears.find(
    (year) => year.id === editor.content?.academicYearId,
  );
  const term = terms.find((item) => item.id === editor.content?.termId);
  const academicYearName =
    (locale === "ar" ? academicYear?.nameAr : academicYear?.nameEn) ||
    academicYear?.name ||
    t("context_unavailable");
  const termName =
    (locale === "ar" ? term?.nameAr : term?.nameEn) ||
    term?.name ||
    t("context_unavailable");
  const confirmDiscard = useCallback(
    () => window.confirm(t("discard_changes")),
    [t],
  );

  useGuardedAcademicContextChange({
    hasUnsavedChanges: editor.hasUnsavedChanges,
    confirmDiscard,
  });

  useEffect(() => {
    if (!editor.hasUnsavedChanges) return;

    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [editor.hasUnsavedChanges]);

  return (
    <AcademicContentEditorView
      editor={editor}
      canManage={hasPermission("academics.academic_content.manage")}
      canPublish={hasPermission("academics.academic_content.publish")}
      academicYearName={academicYearName}
      termName={termName}
      onLifecycleChanged={async (updatedContent) => {
        editor.applyContentBase(updatedContent);
        await Promise.all([
          editor.refreshAggregate(),
          editor.refreshReadiness(),
        ]);
      }}
      onDeleted={() => {
        const query = new URLSearchParams();
        for (const key of ["year", "term"]) {
          const value = searchParams.get(key);
          if (value) query.set(key, value);
        }
        const serializedQuery = query.toString();
        const routeSuffix =
          editor.content?.type === "SUBJECT_RESOURCE"
            ? "/subject-resources"
            : editor.content?.type === "ONLINE_SESSION"
              ? "/online-sessions"
              : editor.content?.type === "GENERAL_RESOURCE"
                ? "/general-resources"
                : "";
        router.push(
          `/${locale}/academic-content-hub${routeSuffix}${serializedQuery ? `?${serializedQuery}` : ""}`,
        );
      }}
      termBounds={
        selectedTerm && selectedTerm.id === editor.content?.termId
          ? { startDate: selectedTerm.startDate, endDate: selectedTerm.endDate }
          : undefined
      }
    />
  );
}
