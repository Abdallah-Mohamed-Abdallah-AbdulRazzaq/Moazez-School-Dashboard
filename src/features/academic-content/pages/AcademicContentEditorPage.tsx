"use client";

import { useCallback, useEffect, useState } from "react";
import { LockKeyhole, RefreshCw } from "lucide-react";
import { useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button/Button";
import EmptyState from "@/components/ui/empty-state/EmptyState";
import PartialLoader from "@/components/ui/loaders/PartialLoader";
import { useGuardedAcademicContextChange } from "@/features/academics/hooks/useGuardedAcademicContextChange";
import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";
import { usePermissions } from "@/hooks/usePermissions";
import BasicInformationSection from "../components/editor/BasicInformationSection";
import AcademicTargetsSection from "../components/editor/AcademicTargetsSection";
import LinksSection from "../components/editor/LinksSection";
import TagsSection from "../components/editor/TagsSection";
import FilesSection from "../components/editor/FilesSection";
import LifecycleActions from "../components/editor/LifecycleActions";
import ReadinessPanel from "../components/editor/ReadinessPanel";
import RevisionHistoryPanel from "../components/editor/RevisionHistoryPanel";
import AcademicContentPublicationPanel from "../components/publication/AcademicContentPublicationPanel";
import EditorSectionNav, {
  EDITOR_SECTIONS,
  type AcademicContentEditorPanel,
  type EditorSectionIndicator,
} from "../components/editor/EditorSectionNav";
import { useAcademicContentEditor } from "../hooks/useAcademicContentEditor";
import { useAcademicContentTranslations } from "../hooks/useAcademicContentTranslations";
import TypeDetailSection from "../components/editor/details/TypeDetailSection";
import type { AcademicContentBase } from "../types/contracts";
import { isPublicationSurfaceAvailable } from "../model/academicContentPublicationPolicy";
import TeacherPreparationEditorView from "../components/preparation-detail/TeacherPreparationEditorView";
import WeeklyPlanEditorView from "../components/weekly-plan-detail/WeeklyPlanEditorView";
import GuardianNoteEditorView from "../components/guardian-note-detail/GuardianNoteEditorView";
import SubjectResourceEditorView from "../components/subject-resource-detail/SubjectResourceEditorView";

type AcademicContentEditorState = ReturnType<typeof useAcademicContentEditor>;

function editorSectionIndicator(section: {
  dirty: boolean;
  saving: boolean;
  error: unknown;
}): EditorSectionIndicator | undefined {
  if (section.error) return "error";
  if (section.saving) return "saving";
  if (section.dirty) return "unsaved";
  return undefined;
}

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
  const [activeSection, setActiveSection] =
    useState<AcademicContentEditorPanel>("metadata");
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

  const editingDisabled = editor.isReadOnly || !canManage;
  const publicationAvailable = isPublicationSurfaceAvailable(
    content.type,
    content.audience,
  );
  const editorSections = publicationAvailable
    ? [
        ...EDITOR_SECTIONS.slice(0, -1),
        { id: "publication", labelKey: "publication" } as const,
        EDITOR_SECTIONS[EDITOR_SECTIONS.length - 1],
      ]
    : EDITOR_SECTIONS;
  const resolvedActiveSection = editorSections.some(
    (section) => section.id === activeSection,
  )
    ? activeSection
    : "metadata";
  const indicators = {
    metadata: editorSectionIndicator(editor.sections.metadata),
    targets: editorSectionIndicator(editor.sections.targets),
    details: editorSectionIndicator(editor.sections.details),
    links: editorSectionIndicator(editor.sections.links),
    tags: editorSectionIndicator(editor.sections.tags),
    files: editorSectionIndicator(editor.sections.files),
    readiness: editor.readiness
      ? editor.readiness.canAdvance
        ? ("ready" as const)
        : ("blocked" as const)
      : undefined,
  };

  return (
    <main className="mx-auto max-w-screen-2xl space-y-4 p-4 sm:p-6">
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-primary">
              {t(`statuses.${content.status}`)}
            </p>
            <h2 className="mt-1 truncate text-xl font-bold text-gray-900 sm:text-2xl">
              {content.title}
            </h2>
          </div>
          <div className="flex flex-col items-end gap-2">
            {editor.isReadOnly && (
              <div
                role="status"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700"
              >
                <LockKeyhole aria-hidden="true" className="size-4" />
                {t("editor.read_only")}
              </div>
            )}
            <LifecycleActions
              content={content}
              canManage={canManage}
              onChanged={onLifecycleChanged}
              onDeleted={onDeleted}
            />
          </div>
        </div>
        <dl className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            [t("editor.content_type"), t(`types.${content.type}`)],
            [t("editor.academic_year"), academicYearName],
            [t("editor.term"), termName],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg bg-gray-50 px-3 py-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                {label}
              </dt>
              <dd className="mt-1 text-sm font-semibold text-gray-900">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <EditorSectionNav
        variant="mobile"
        activeSection={resolvedActiveSection}
        sections={editorSections}
        indicators={indicators}
        onChange={setActiveSection}
      />

      <div className="grid min-w-0 gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
        <aside>
          <EditorSectionNav
            variant="desktop"
            activeSection={resolvedActiveSection}
            sections={editorSections}
            indicators={indicators}
            onChange={setActiveSection}
          />
        </aside>
        <div className="min-w-0">
          {resolvedActiveSection === "metadata" ? (
            <BasicInformationSection
              content={content}
              disabled={editingDisabled}
              sectionState={editor.sections.metadata}
              onDirtyChange={(dirty) =>
                editor.markSectionDirty("metadata", dirty)
              }
              onSave={editor.saveMetadata}
            />
          ) : resolvedActiveSection === "targets" ? (
            <AcademicTargetsSection
              content={content}
              disabled={editingDisabled}
              sectionState={editor.sections.targets}
              onDirtyChange={(dirty) =>
                editor.markSectionDirty("targets", dirty)
              }
              onSave={editor.saveTargets}
            />
          ) : resolvedActiveSection === "details" ? (
            <TypeDetailSection
              content={content}
              disabled={editingDisabled}
              sectionState={editor.sections.details}
              termStartDate={termBounds?.startDate}
              termEndDate={termBounds?.endDate}
              onDirty={() => editor.markSectionDirty("details", true)}
              onSavePreparation={editor.savePreparationDetails}
              onSaveWeeklyPlan={editor.saveWeeklyPlanDetails}
              onSaveGuardianNote={editor.saveGuardianNoteDetails}
              onSaveSubjectResource={editor.saveSubjectResourceDetails}
              onSaveOnlineSession={editor.saveOnlineSessionDetails}
            />
          ) : resolvedActiveSection === "links" ? (
            <LinksSection
              key={JSON.stringify(content.links)}
              initial={content.links}
              disabled={editingDisabled}
              sectionState={editor.sections.links}
              onDirty={() => editor.markSectionDirty("links", true)}
              onSave={editor.saveLinks}
            />
          ) : resolvedActiveSection === "tags" ? (
            <TagsSection
              key={JSON.stringify(content.tags)}
              initial={content.tags}
              disabled={editingDisabled}
              sectionState={editor.sections.tags}
              onDirty={() => editor.markSectionDirty("tags", true)}
              onSave={editor.saveTags}
            />
          ) : resolvedActiveSection === "files" ? (
            <FilesSection
              contentId={content.id}
              assets={content.assets}
              disabled={editingDisabled}
              onFilesChanged={async () => {
                await Promise.all([
                  editor.refreshAggregate(),
                  editor.refreshReadiness(),
                ]);
              }}
            />
          ) : resolvedActiveSection === "readiness" ? (
            <ReadinessPanel
              readiness={editor.readiness}
              onRefresh={editor.refreshReadiness}
            />
          ) : resolvedActiveSection === "publication" &&
            publicationAvailable ? (
            <AcademicContentPublicationPanel
              content={content}
              canMutate={canPublish}
              onContentChanged={async () => {
                await Promise.all([
                  editor.refreshAggregate(),
                  editor.refreshReadiness(),
                ]);
              }}
            />
          ) : (
            <RevisionHistoryPanel
              key={`${content.id}:${content.updatedAt}`}
              contentId={content.id}
            />
          )}
        </div>
      </div>
    </main>
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
