"use client";

import { useEffect, useMemo, useState } from "react";
import { LockKeyhole } from "lucide-react";
import { useLocale } from "next-intl";
import { teacherApi } from "@/features/teachers/services/teacherApi";
import type { TeacherDirectoryListItem } from "@/features/teachers/types";
import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";
import { usePermissions } from "@/hooks/usePermissions";
import AcademicTargetsSection from "../editor/AcademicTargetsSection";
import LifecycleActions from "../editor/LifecycleActions";
import ReadinessPanel from "../editor/ReadinessPanel";
import RevisionHistoryPanel from "../editor/RevisionHistoryPanel";
import AcademicContentPublicationPanel from "../publication/AcademicContentPublicationPanel";
import { useAcademicContentWorkflow } from "../../hooks/useAcademicContentWorkflow";
import { useAcademicContentEditor } from "../../hooks/useAcademicContentEditor";
import { useTeacherPreparationDetailDraft } from "../../hooks/useTeacherPreparationDetailDraft";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import { isAcademicContentMutableStatus } from "../../model/academicContentPolicy";
import { isPublicationSurfaceAvailable } from "../../model/academicContentPublicationPolicy";
import {
  emptyTeacherPreparationDetail,
  resolveTeacherPreparationReferences,
  resolveTeacherPreparationTargets,
  type TeacherPreparationPanel,
  type TeacherPreparationReferenceDisplay,
} from "../../model/teacherPreparationDetail";
import {
  loadAcademicContentDetailOptions,
  type AcademicContentDetailOptions,
} from "../../services/academicContentDetailOptions";
import {
  loadAcademicTargetOptions,
  type AcademicTargetOptions,
} from "../../services/academicContentSelectors";
import type { AcademicContentBase } from "../../types/contracts";
import TeacherPreparationContextRail from "./TeacherPreparationContextRail";
import TeacherPreparationHeader from "./TeacherPreparationHeader";
import TeacherPreparationNotesPanel from "./TeacherPreparationNotesPanel";
import TeacherPreparationOrderedListPanel from "./TeacherPreparationOrderedListPanel";
import TeacherPreparationOverview from "./TeacherPreparationOverview";
import TeacherPreparationReferencesPanel from "./TeacherPreparationReferencesPanel";
import TeacherPreparationResources from "./TeacherPreparationResources";
import TeacherPreparationSectionNav from "./TeacherPreparationSectionNav";

type AcademicContentEditorState = ReturnType<typeof useAcademicContentEditor>;

type PreparationEditor = AcademicContentEditorState & {
  content: NonNullable<AcademicContentEditorState["content"]> & { type: "TEACHER_PREPARATION" };
};

interface TeacherPreparationEditorViewProps {
  editor: PreparationEditor;
  canManage: boolean;
  canPublish?: boolean;
  academicYearName?: string;
  termName?: string;
  onLifecycleChanged: (content: AcademicContentBase) => Promise<unknown>;
  onDeleted: () => void;
}

const EMPTY_REFERENCES: TeacherPreparationReferenceDisplay = {
  curriculum: null,
  curriculumUnit: null,
  curriculumLesson: null,
  lessonPlan: null,
  lessonPlanItem: null,
  timetable: null,
};

export default function TeacherPreparationEditorView({
  editor,
  canManage,
  canPublish: canPublishOverride,
  academicYearName: academicYearNameOverride,
  termName: termNameOverride,
  onLifecycleChanged,
  onDeleted,
}: TeacherPreparationEditorViewProps) {
  const { content } = editor;
  const locale = useLocale();
  const { academicYears = [], terms = [] } = useAcademicYearTermLayoutContext();
  const { hasPermission } = usePermissions();
  const t = useAcademicContentTranslations("teacher_preparation_detail");
  const editorT = useAcademicContentTranslations("editor");
  const workflowT = useAcademicContentTranslations("workflow");
  const workflow = useAcademicContentWorkflow(content.id);
  const academicYear = academicYears.find((item) => item.id === content.academicYearId);
  const term = terms.find((item) => item.id === content.termId);
  const academicYearName = academicYearNameOverride ?? (locale === "ar" ? academicYear?.nameAr : academicYear?.nameEn) ?? academicYear?.name ?? editorT("context_unavailable");
  const termName = termNameOverride ?? (locale === "ar" ? term?.nameAr : term?.nameEn) ?? term?.name ?? editorT("context_unavailable");
  const canPublish = canPublishOverride ?? hasPermission("academics.academic_content.publish");
  const [activePanel, setActivePanel] = useState<TeacherPreparationPanel>("overview");
  const [detailOptions, setDetailOptions] = useState<AcademicContentDetailOptions | null>(null);
  const [targetOptions, setTargetOptions] = useState<AcademicTargetOptions | null>(null);
  const [teachers, setTeachers] = useState<TeacherDirectoryListItem[]>([]);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsVersion, setOptionsVersion] = useState(0);
  const disabled = editor.isReadOnly || !canManage;
  const detail = content.details ?? emptyTeacherPreparationDetail();
  const controller = useTeacherPreparationDetailDraft({
    initial: detail,
    contentVersion: `${content.id}:${content.updatedAt}`,
    sectionState: editor.sections.details,
    onDirty: () => editor.markSectionDirty("details", true),
    onSave: editor.savePreparationDetails,
  });

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setOptionsLoading(true);
      setOptionsError(null);
      setDetailOptions(null);
      setTargetOptions(null);
      setTeachers([]);
    });
    void Promise.allSettled([
      loadAcademicContentDetailOptions(content),
      loadAcademicTargetOptions({ academicYearId: content.academicYearId, termId: content.termId }),
      teacherApi.list({ page: 1, limit: 100 }),
    ]).then(([detailsResult, targetsResult, teachersResult]) => {
      if (!active) return;
      if (detailsResult.status === "fulfilled") setDetailOptions(detailsResult.value);
      if (targetsResult.status === "fulfilled") setTargetOptions(targetsResult.value);
      if (teachersResult.status === "fulfilled") setTeachers(teachersResult.value.items);
      if (detailsResult.status === "rejected") setOptionsError(detailsResult.reason instanceof Error ? detailsResult.reason.message : t("references.unavailable"));
      setOptionsLoading(false);
    });
    return () => { active = false; };
  }, [content, optionsVersion, t]);

  const resolvedTargets = useMemo(
    () => targetOptions
      ? resolveTeacherPreparationTargets(content.targets, targetOptions, teachers, locale)
      : content.targets.map((target) => ({ targetId: target.id, scope: null, subject: null, assignedTeacher: null })),
    [content.targets, locale, targetOptions, teachers],
  );
  const references = useMemo(
    () => detailOptions ? resolveTeacherPreparationReferences(controller.draft, detailOptions, locale) : EMPTY_REFERENCES,
    [controller.draft, detailOptions, locale],
  );
  const publicationAvailable = isPublicationSurfaceAvailable(content.type, content.audience);
  const approvalRequired = workflow.policy?.preparationApprovalRequired === true;
  const mutable = isAcademicContentMutableStatus(content.status);
  const ready = editor.readiness?.canAdvance === true;
  const canSubmit = canManage && approvalRequired && mutable && ready && !editor.hasUnsavedChanges;
  const showSubmit = canManage && approvalRequired && mutable;
  const submitLabel = content.status === "CHANGES_REQUESTED" ? workflowT("resubmit") : workflowT("submit");
  const submissionHint = !ready ? workflowT("readiness_blocked") : editor.hasUnsavedChanges ? workflowT("unsaved_blocked") : workflowT("ready_to_submit");
  const indicators = {
    overview: editor.sections.metadata.dirty || editor.sections.tags.dirty || editor.sections.details.dirty ? "unsaved" as const : undefined,
    targets: editor.sections.targets.dirty ? "unsaved" as const : undefined,
    objectives: editor.sections.details.dirty ? "unsaved" as const : undefined,
    learningOutcomes: editor.sections.details.dirty ? "unsaved" as const : undefined,
    teachingStrategies: editor.sections.details.dirty ? "unsaved" as const : undefined,
    activities: editor.sections.details.dirty ? "unsaved" as const : undefined,
    resources: editor.sections.details.dirty || editor.sections.links.dirty ? "unsaved" as const : undefined,
    assessment: editor.sections.details.dirty ? "unsaved" as const : undefined,
    teacherNotes: editor.sections.details.dirty ? "unsaved" as const : undefined,
    references: editor.sections.details.dirty ? "unsaved" as const : undefined,
    readiness: ready ? "ready" as const : "blocked" as const,
  };
  const refreshFiles = async () => { await Promise.all([editor.refreshAggregate(), editor.refreshReadiness()]); };

  const panelContent = (() => {
    if (activePanel === "overview") return <TeacherPreparationOverview content={content} controller={controller} disabled={disabled} metadataState={editor.sections.metadata} detailState={editor.sections.details} tagsState={editor.sections.tags} onMetadataDirtyChange={(dirty) => editor.markSectionDirty("metadata", dirty)} onSaveMetadata={editor.saveMetadata} onTagsDirty={() => editor.markSectionDirty("tags", true)} onSaveTags={editor.saveTags} onFilesChanged={refreshFiles} />;
    if (activePanel === "targets") return <AcademicTargetsSection content={content} disabled={disabled} sectionState={editor.sections.targets} onDirtyChange={(dirty) => editor.markSectionDirty("targets", dirty)} onSave={editor.saveTargets} />;
    if (activePanel === "resources") return <TeacherPreparationResources content={content} controller={controller} disabled={disabled} detailState={editor.sections.details} linksState={editor.sections.links} onLinksDirty={() => editor.markSectionDirty("links", true)} onSaveLinks={editor.saveLinks} onFilesChanged={refreshFiles} />;
    if (activePanel === "assessment" || activePanel === "teacherNotes") {
      const isAssessment = activePanel === "assessment";
      return <TeacherPreparationNotesPanel title={t(`sections.${activePanel === "teacherNotes" ? "teacher_notes" : "assessment"}`)} description={t(`panels.${isAssessment ? "assessment_description" : "teacher_notes_description"}`)} fieldLabel={t(`sections.${isAssessment ? "assessment" : "teacher_notes"}`)} saveLabel={t(`panels.${isAssessment ? "save_assessment" : "save_teacher_notes"}`)} field={isAssessment ? "assessmentNotes" : "teacherNotes"} controller={controller} sectionState={editor.sections.details} disabled={disabled} />;
    }
    if (activePanel === "references") return <TeacherPreparationReferencesPanel controller={controller} sectionState={editor.sections.details} options={detailOptions} disabled={disabled} isLoading={optionsLoading} loadError={optionsError} onRetry={() => setOptionsVersion((version) => version + 1)} />;
    if (activePanel === "readiness") return <ReadinessPanel readiness={editor.readiness} onRefresh={editor.refreshReadiness} />;
    if (activePanel === "publication" && publicationAvailable) return <AcademicContentPublicationPanel content={content} canMutate={canPublish} onContentChanged={refreshFiles} />;
    if (activePanel === "revisions") return <RevisionHistoryPanel key={`${content.id}:${content.updatedAt}`} contentId={content.id} />;
    const orderedPanel = activePanel as "objectives" | "learningOutcomes" | "teachingStrategies" | "activities";
    const labelKey = orderedPanel === "learningOutcomes" ? "learning_outcomes" : orderedPanel === "teachingStrategies" ? "teaching_strategies" : orderedPanel;
    return <TeacherPreparationOrderedListPanel title={t(`sections.${labelKey}`)} description={t(`panels.${labelKey}_description`)} itemLabel={t(`sections.${labelKey}`)} saveLabel={t("panels.save_section", { section: t(`sections.${labelKey}`).toLowerCase() })} emptyItemError={t("panels.empty_item")} field={orderedPanel} controller={controller} sectionState={editor.sections.details} disabled={disabled} />;
  })();

  return (
    <main className="mx-auto max-w-screen-2xl space-y-4 p-4 sm:p-6">
      {editor.isReadOnly ? (
        <div role="status" className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700">
          <LockKeyhole aria-hidden="true" className="size-4" />
          {editorT("read_only")}
        </div>
      ) : null}
      <TeacherPreparationHeader content={content} locale={locale} academicYearName={academicYearName} termName={termName} targets={resolvedTargets} canSubmit={canSubmit} showSubmit={showSubmit} isSubmitting={workflow.isSubmitting} submitLabel={submitLabel} submissionHint={submissionHint} onSubmit={() => void workflow.submit().then((transition) => { if (transition) { editor.applyContentTransition(transition); void Promise.all([editor.refreshAggregate(), editor.refreshReadiness(), workflow.reload()]); } })} lifecycleActions={<LifecycleActions content={content} canManage={canManage} onChanged={onLifecycleChanged} onDeleted={onDeleted} />} />
      <TeacherPreparationSectionNav variant="mobile" activePanel={activePanel} indicators={indicators} showPublication={publicationAvailable} onChange={setActivePanel} />
      <div className="grid min-w-0 gap-4 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_320px]">
        <div className="hidden lg:block"><TeacherPreparationSectionNav variant="desktop" activePanel={activePanel} indicators={indicators} showPublication={publicationAvailable} onChange={setActivePanel} /></div>
        <div className="min-w-0">{panelContent}</div>
        <div className="lg:col-start-2 xl:col-start-auto"><TeacherPreparationContextRail readiness={editor.readiness} references={references} referenceError={optionsError} history={workflow.history} historyError={workflow.error?.message ?? null} teachers={teachers} onRefreshReadiness={editor.refreshReadiness} onRetryHistory={() => void workflow.reload()} /></div>
      </div>
    </main>
  );
}
