"use client";

import { useState } from "react";
import { LockKeyhole } from "lucide-react";
import { useLocale } from "next-intl";
import {
  useAcademicContentEditor,
  type AcademicContentEditorSectionState,
} from "../../hooks/useAcademicContentEditor";
import { useAcademicContentFilePolicy } from "../../hooks/useAcademicContentFilePolicy";
import { useAcademicContentTargetDisplay } from "../../hooks/useAcademicContentTargetDisplay";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import { isPublicationSurfaceAvailable } from "../../model/academicContentPublicationPolicy";
import type { AcademicContentBase } from "../../types/contracts";
import AcademicTargetsSection from "../editor/AcademicTargetsSection";
import type { EditorSectionIndicator } from "../editor/EditorSectionNav";
import LifecycleActions from "../editor/LifecycleActions";
import ReadinessPanel from "../editor/ReadinessPanel";
import RevisionHistoryPanel from "../editor/RevisionHistoryPanel";
import AcademicContentPublicationPanel from "../publication/AcademicContentPublicationPanel";
import GeneralResourceContextRail from "./GeneralResourceContextRail";
import GeneralResourceHeader from "./GeneralResourceHeader";
import GeneralResourceOverview from "./GeneralResourceOverview";
import GeneralResourceResources from "./GeneralResourceResources";
import GeneralResourceSectionNav, {
  type GeneralResourcePanel,
} from "./GeneralResourceSectionNav";

type EditorState = ReturnType<typeof useAcademicContentEditor>;
type GeneralResourceEditor = EditorState & {
  content: NonNullable<EditorState["content"]> & { type: "GENERAL_RESOURCE" };
};

interface Props {
  editor: GeneralResourceEditor;
  canManage: boolean;
  canPublish?: boolean;
  academicYearName: string;
  termName: string;
  onLifecycleChanged: (content: AcademicContentBase) => Promise<unknown>;
  onDeleted: () => void;
}

function sectionIndicator(
  section: AcademicContentEditorSectionState,
): EditorSectionIndicator | undefined {
  if (section.error) return "error";
  if (section.saving) return "saving";
  return section.dirty ? "unsaved" : undefined;
}

function combinedSectionIndicator(
  sections: AcademicContentEditorSectionState[],
): EditorSectionIndicator | undefined {
  if (sections.some((section) => section.error)) return "error";
  if (sections.some((section) => section.saving)) return "saving";
  return sections.some((section) => section.dirty) ? "unsaved" : undefined;
}

export default function GeneralResourceEditorView({
  editor,
  canManage,
  canPublish = false,
  academicYearName,
  termName,
  onLifecycleChanged,
  onDeleted,
}: Props) {
  const { content } = editor;
  const locale = useLocale();
  const t = useAcademicContentTranslations("general_resource_detail");
  const editorT = useAcademicContentTranslations("editor");
  const [activePanel, setActivePanel] =
    useState<GeneralResourcePanel>("overview");
  const filePolicyState = useAcademicContentFilePolicy();
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
  const refreshContent = async () => {
    await Promise.all([editor.refreshAggregate(), editor.refreshReadiness()]);
  };
  const overviewIndicator = combinedSectionIndicator([
    editor.sections.metadata,
    editor.sections.tags,
  ]);
  const indicators: Partial<
    Record<GeneralResourcePanel, EditorSectionIndicator>
  > = {
    overview: overviewIndicator,
    targets: sectionIndicator(editor.sections.targets),
    resources: sectionIndicator(editor.sections.links),
    readiness: editor.readiness?.canAdvance ? "ready" : "blocked",
  };
  const panels: Record<GeneralResourcePanel, React.ReactNode> = {
    overview: (
      <GeneralResourceOverview
        content={content}
        academicYearName={academicYearName}
        termName={termName}
        disabled={disabled}
        metadataState={editor.sections.metadata}
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
    resources: (
      <GeneralResourceResources
        content={content}
        disabled={disabled}
        linksState={editor.sections.links}
        filePolicyState={filePolicyState}
        onLinksDirty={() => editor.markSectionDirty("links", true)}
        onSaveLinks={editor.saveLinks}
        onFilesChanged={refreshContent}
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
        onContentChanged={refreshContent}
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
      ? "overview"
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
      <GeneralResourceHeader
        content={content}
        locale={locale}
        lifecycleActions={
          <LifecycleActions
            content={content}
            canManage={canManage}
            onChanged={onLifecycleChanged}
            onDeleted={onDeleted}
          />
        }
      />
      <GeneralResourceSectionNav
        variant="mobile"
        activePanel={resolvedPanel}
        showPublication={publicationAvailable}
        indicators={indicators}
        onChange={setActivePanel}
      />
      <div className="grid min-w-0 gap-4 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_320px]">
        <div className="hidden lg:block">
          <GeneralResourceSectionNav
            variant="desktop"
            activePanel={resolvedPanel}
            showPublication={publicationAvailable}
            indicators={indicators}
            onChange={setActivePanel}
          />
        </div>
        <div className="min-w-0">{panels[resolvedPanel]}</div>
        <div className="lg:col-start-2 xl:col-start-auto">
          <GeneralResourceContextRail
            content={content}
            readiness={editor.readiness}
            targets={targets}
            targetError={targetError}
            filePolicyState={filePolicyState}
            onRefreshReadiness={editor.refreshReadiness}
          />
        </div>
      </div>
    </main>
  );
}
