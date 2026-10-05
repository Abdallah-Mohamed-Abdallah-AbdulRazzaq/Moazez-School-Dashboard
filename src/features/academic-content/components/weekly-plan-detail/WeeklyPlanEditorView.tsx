"use client";

import { useEffect, useMemo, useState } from "react";
import { LockKeyhole } from "lucide-react";
import { useLocale } from "next-intl";
import AcademicTargetsSection from "../editor/AcademicTargetsSection";
import LifecycleActions from "../editor/LifecycleActions";
import ReadinessPanel from "../editor/ReadinessPanel";
import RevisionHistoryPanel from "../editor/RevisionHistoryPanel";
import AcademicContentPublicationPanel from "../publication/AcademicContentPublicationPanel";
import { useAcademicContentEditor } from "../../hooks/useAcademicContentEditor";
import { useWeeklyPlanDetailDraft } from "../../hooks/useWeeklyPlanDetailDraft";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import { isPublicationSurfaceAvailable } from "../../model/academicContentPublicationPolicy";
import {
  emptyWeeklyPlanDetail,
  type WeeklyPlanPanel,
} from "../../model/weeklyPlanDetail";
import { resolveTeacherPreparationTargets } from "../../model/teacherPreparationDetail";
import {
  loadAcademicTargetOptions,
  type AcademicTargetOptions,
} from "../../services/academicContentSelectors";
import {
  EMPTY_WEEKLY_PLAN_DETAIL_OPTIONS,
  loadWeeklyPlanDetailOptions,
  type WeeklyPlanDetailOptions,
} from "../../services/weeklyPlanDetailOptions";
import type { AcademicContentBase } from "../../types/contracts";
import WeeklyPlanContextRail from "./WeeklyPlanContextRail";
import WeeklyPlanDetailsPanel from "./WeeklyPlanDetailsPanel";
import WeeklyPlanHeader from "./WeeklyPlanHeader";
import WeeklyPlanNotesPanel from "./WeeklyPlanNotesPanel";
import WeeklyPlanOrderedListPanel from "./WeeklyPlanOrderedListPanel";
import WeeklyPlanReferenceNotesPanel from "./WeeklyPlanReferenceNotesPanel";
import WeeklyPlanResources from "./WeeklyPlanResources";
import WeeklyPlanSectionNav from "./WeeklyPlanSectionNav";

type EditorState = ReturnType<typeof useAcademicContentEditor>;
type WeeklyPlanEditor = EditorState & {
  content: NonNullable<EditorState["content"]> & { type: "WEEKLY_PLAN" };
};

interface WeeklyPlanEditorViewProps {
  editor: WeeklyPlanEditor;
  canManage: boolean;
  canPublish?: boolean;
  termBounds?: { startDate: string; endDate: string };
  onLifecycleChanged: (content: AcademicContentBase) => Promise<unknown>;
  onDeleted: () => void;
}

export default function WeeklyPlanEditorView({
  editor,
  canManage,
  canPublish = false,
  termBounds,
  onLifecycleChanged,
  onDeleted,
}: WeeklyPlanEditorViewProps) {
  const { content } = editor;
  const locale = useLocale();
  const t = useAcademicContentTranslations("weekly_plan_detail");
  const editorT = useAcademicContentTranslations("editor");
  const [activePanel, setActivePanel] = useState<WeeklyPlanPanel>("details");
  const [targetOptions, setTargetOptions] =
    useState<AcademicTargetOptions | null>(null);
  const [targetError, setTargetError] = useState<string | null>(null);
  const [detailOptions, setDetailOptions] = useState<WeeklyPlanDetailOptions>(
    EMPTY_WEEKLY_PLAN_DETAIL_OPTIONS,
  );
  const disabled = editor.isReadOnly || !canManage;
  const controller = useWeeklyPlanDetailDraft({
    initial: content.details ?? emptyWeeklyPlanDetail(termBounds?.startDate),
    contentVersion: `${content.id}:${content.updatedAt}`,
    sectionState: editor.sections.details,
    termBounds,
    onDirty: () => editor.markSectionDirty("details", true),
    onSave: editor.saveWeeklyPlanDetails,
  });

  useEffect(() => {
    let active = true;
    void Promise.allSettled([
      loadAcademicTargetOptions({
        academicYearId: content.academicYearId,
        termId: content.termId,
      }),
      loadWeeklyPlanDetailOptions(content),
    ]).then(([targets, details]) => {
      if (!active) return;
      if (targets.status === "fulfilled") setTargetOptions(targets.value);
      else
        setTargetError(
          targets.reason instanceof Error
            ? targets.reason.message
            : t("context.unavailable"),
        );
      if (details.status === "fulfilled") setDetailOptions(details.value);
    });
    return () => {
      active = false;
    };
  }, [content, t]);

  const targets = useMemo(
    () =>
      targetOptions
        ? resolveTeacherPreparationTargets(
            content.targets,
            targetOptions,
            [],
            locale,
          )
        : content.targets.map(({ id }) => ({
            targetId: id,
            scope: null,
            subject: null,
            assignedTeacher: null,
          })),
    [content.targets, locale, targetOptions],
  );
  const publicationAvailable = isPublicationSurfaceAvailable(
    content.type,
    content.audience,
  );
  const indicators = {
    details:
      editor.sections.metadata.dirty ||
      editor.sections.details.dirty ||
      editor.sections.tags.dirty
        ? ("unsaved" as const)
        : undefined,
    targets: editor.sections.targets.dirty ? ("unsaved" as const) : undefined,
    objectives: editor.sections.details.dirty
      ? ("unsaved" as const)
      : undefined,
    topics: editor.sections.details.dirty ? ("unsaved" as const) : undefined,
    homework: editor.sections.details.dirty ? ("unsaved" as const) : undefined,
    assessments: editor.sections.details.dirty
      ? ("unsaved" as const)
      : undefined,
    notes: editor.sections.details.dirty ? ("unsaved" as const) : undefined,
    resources: editor.sections.links.dirty ? ("unsaved" as const) : undefined,
    readiness: editor.readiness?.canAdvance
      ? ("ready" as const)
      : ("blocked" as const),
  };
  const refreshFiles = async () => {
    await Promise.all([editor.refreshAggregate(), editor.refreshReadiness()]);
  };

  const panels: Record<WeeklyPlanPanel, React.ReactNode> = {
    details: (
      <WeeklyPlanDetailsPanel
        content={content}
        controller={controller}
        disabled={disabled}
        termBounds={termBounds}
        metadataState={editor.sections.metadata}
        detailState={editor.sections.details}
        tagsState={editor.sections.tags}
        onMetadataDirtyChange={(dirty) =>
          editor.markSectionDirty("metadata", dirty)
        }
        onSaveMetadata={editor.saveMetadata}
        onTagsDirty={() => editor.markSectionDirty("tags", true)}
        onSaveTags={editor.saveTags}
      />
    ),
    targets: (
      <AcademicTargetsSection
        content={content}
        disabled={disabled}
        sectionState={editor.sections.targets}
        onDirtyChange={(dirty) => editor.markSectionDirty("targets", dirty)}
        onSave={editor.saveTargets}
      />
    ),
    objectives: (
      <WeeklyPlanOrderedListPanel
        title={t("sections.objectives")}
        description={t("objectives.description")}
        saveLabel={t("objectives.save")}
        emptyItemError={t("details.errors.empty_items")}
        field="objectives"
        controller={controller}
        sectionState={editor.sections.details}
        disabled={disabled}
      />
    ),
    topics: (
      <WeeklyPlanOrderedListPanel
        title={t("sections.topics")}
        description={t("topics.description")}
        saveLabel={t("topics.save")}
        emptyItemError={t("details.errors.empty_items")}
        field="topics"
        controller={controller}
        sectionState={editor.sections.details}
        disabled={disabled}
      />
    ),
    homework: (
      <WeeklyPlanReferenceNotesPanel
        kind="homework"
        title={t("sections.homework")}
        description={t("homework.description")}
        notesLabel={t("homework.notes")}
        referencesLabel={t("homework.references")}
        saveLabel={t("homework.save")}
        controller={controller}
        sectionState={editor.sections.details}
        options={detailOptions}
        disabled={disabled}
      />
    ),
    assessments: (
      <WeeklyPlanReferenceNotesPanel
        kind="assessments"
        title={t("sections.assessments")}
        description={t("assessments.description")}
        notesLabel={t("assessments.notes")}
        referencesLabel={t("assessments.references")}
        saveLabel={t("assessments.save")}
        controller={controller}
        sectionState={editor.sections.details}
        options={detailOptions}
        disabled={disabled}
      />
    ),
    notes: (
      <WeeklyPlanNotesPanel
        title={t("sections.notes")}
        description={t("notes.description")}
        fieldLabel={t("notes.field")}
        saveLabel={t("notes.save")}
        controller={controller}
        sectionState={editor.sections.details}
        disabled={disabled}
      />
    ),
    resources: (
      <WeeklyPlanResources
        content={content}
        disabled={disabled}
        linksState={editor.sections.links}
        onLinksDirty={() => editor.markSectionDirty("links", true)}
        onSaveLinks={editor.saveLinks}
        onFilesChanged={refreshFiles}
      />
    ),
    readiness: (
      <ReadinessPanel
        readiness={editor.readiness}
        onRefresh={editor.refreshReadiness}
      />
    ),
    publication: (
      <AcademicContentPublicationPanel
        content={content}
        canMutate={canPublish}
        onContentChanged={refreshFiles}
      />
    ),
    revisions: (
      <RevisionHistoryPanel
        key={`${content.id}:${content.updatedAt}`}
        contentId={content.id}
      />
    ),
  };
  const resolvedPanel =
    activePanel === "publication" && !publicationAvailable
      ? "details"
      : activePanel;

  return (
    <main
      aria-label={t("workspace_label")}
      className="mx-auto max-w-screen-2xl space-y-4 p-4 sm:p-6"
    >
      {editor.isReadOnly ? (
        <div
          role="status"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700"
        >
          <LockKeyhole aria-hidden="true" className="size-4" />
          {editorT("read_only")}
        </div>
      ) : null}
      <WeeklyPlanHeader
        content={content}
        locale={locale}
        targets={targets}
        lifecycleActions={
          <LifecycleActions
            content={content}
            canManage={canManage}
            onChanged={onLifecycleChanged}
            onDeleted={onDeleted}
          />
        }
      />
      <WeeklyPlanSectionNav
        variant="mobile"
        activePanel={resolvedPanel}
        showPublication={publicationAvailable}
        indicators={indicators}
        onChange={setActivePanel}
      />
      <div className="grid min-w-0 gap-4 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_320px]">
        <div className="hidden lg:block">
          <WeeklyPlanSectionNav
            variant="desktop"
            activePanel={resolvedPanel}
            showPublication={publicationAvailable}
            indicators={indicators}
            onChange={setActivePanel}
          />
        </div>
        <div className="min-w-0">{panels[resolvedPanel]}</div>
        <div className="lg:col-start-2 xl:col-start-auto">
          <WeeklyPlanContextRail
            content={content}
            readiness={editor.readiness}
            targets={targets}
            targetError={targetError}
            onRefreshReadiness={editor.refreshReadiness}
          />
        </div>
      </div>
    </main>
  );
}
