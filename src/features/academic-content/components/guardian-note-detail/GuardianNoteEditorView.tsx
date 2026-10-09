"use client";

import { useState } from "react";
import { LockKeyhole } from "lucide-react";
import { useLocale } from "next-intl";
import AcademicTargetsSection from "../editor/AcademicTargetsSection";
import LifecycleActions from "../editor/LifecycleActions";
import ReadinessPanel from "../editor/ReadinessPanel";
import RevisionHistoryPanel from "../editor/RevisionHistoryPanel";
import AcademicContentPublicationPanel from "../publication/AcademicContentPublicationPanel";
import { useAcademicContentEditor } from "../../hooks/useAcademicContentEditor";
import { useAcademicContentTargetDisplay } from "../../hooks/useAcademicContentTargetDisplay";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import { isPublicationSurfaceAvailable } from "../../model/academicContentPublicationPolicy";
import type { GuardianNotePanel } from "../../model/guardianNoteDetail";
import type { AcademicContentBase } from "../../types/contracts";
import GuardianNoteContextRail from "./GuardianNoteContextRail";
import GuardianNoteDetailsPanel from "./GuardianNoteDetailsPanel";
import GuardianNoteHeader from "./GuardianNoteHeader";
import GuardianNoteResources from "./GuardianNoteResources";
import GuardianNoteSectionNav from "./GuardianNoteSectionNav";

type EditorState = ReturnType<typeof useAcademicContentEditor>;
type GuardianNoteEditor = EditorState & {
  content: NonNullable<EditorState["content"]> & {
    type: "GUARDIAN_WEEKLY_NOTE";
  };
};

interface GuardianNoteEditorViewProps {
  editor: GuardianNoteEditor;
  canManage: boolean;
  canPublish?: boolean;
  onLifecycleChanged: (content: AcademicContentBase) => Promise<unknown>;
  onDeleted: () => void;
}

export default function GuardianNoteEditorView({
  editor,
  canManage,
  canPublish = false,
  onLifecycleChanged,
  onDeleted,
}: GuardianNoteEditorViewProps) {
  const { content } = editor;
  const locale = useLocale();
  const t = useAcademicContentTranslations("guardian_note_detail");
  const editorT = useAcademicContentTranslations("editor");
  const [activePanel, setActivePanel] =
    useState<GuardianNotePanel>("details");
  const disabled = editor.isReadOnly || !canManage;
  const { targets, error: targetError } = useAcademicContentTargetDisplay(
    content,
    locale,
    t("context.unavailable"),
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
    resources: editor.sections.links.dirty ? ("unsaved" as const) : undefined,
    readiness: editor.readiness?.canAdvance
      ? ("ready" as const)
      : ("blocked" as const),
  };
  const refreshFiles = async () => {
    await Promise.all([editor.refreshAggregate(), editor.refreshReadiness()]);
  };
  const panels: Record<GuardianNotePanel, React.ReactNode> = {
    details: (
      <GuardianNoteDetailsPanel
        content={content}
        disabled={disabled}
        metadataState={editor.sections.metadata}
        detailState={editor.sections.details}
        tagsState={editor.sections.tags}
        onMetadataDirtyChange={(dirty) =>
          editor.markSectionDirty("metadata", dirty)
        }
        onSaveMetadata={editor.saveMetadata}
        onDetailDirty={() => editor.markSectionDirty("details", true)}
        onSaveDetail={editor.saveGuardianNoteDetails}
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
    resources: (
      <GuardianNoteResources
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
        canStartRevision={canManage && canPublish}
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
      <GuardianNoteHeader
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
      <GuardianNoteSectionNav
        variant="mobile"
        activePanel={resolvedPanel}
        showPublication={publicationAvailable}
        indicators={indicators}
        onChange={setActivePanel}
      />
      <div className="grid min-w-0 gap-4 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_320px]">
        <div className="hidden lg:block">
          <GuardianNoteSectionNav
            variant="desktop"
            activePanel={resolvedPanel}
            showPublication={publicationAvailable}
            indicators={indicators}
            onChange={setActivePanel}
          />
        </div>
        <div className="min-w-0">{panels[resolvedPanel]}</div>
        <div className="lg:col-start-2 xl:col-start-auto">
          <GuardianNoteContextRail
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
