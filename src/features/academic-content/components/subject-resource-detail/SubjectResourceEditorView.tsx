"use client";

import { useState } from "react";
import { LockKeyhole } from "lucide-react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button/Button";
import PartialLoader from "@/components/ui/loaders/PartialLoader";
import { useAcademicContentEditor } from "../../hooks/useAcademicContentEditor";
import { useAcademicContentDetailOptions } from "../../hooks/useAcademicContentDetailOptions";
import { useAcademicContentTargetDisplay } from "../../hooks/useAcademicContentTargetDisplay";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import {
  firstPreviewableSubjectResourceAsset,
  type SubjectResourcePanel,
} from "../../model/subjectResourceDetail";
import { isPublicationSurfaceAvailable } from "../../model/academicContentPublicationPolicy";
import { EMPTY_ACADEMIC_CONTENT_DETAIL_OPTIONS } from "../../services/academicContentDetailOptions";
import { useAcademicContentDownload } from "../../hooks/useAcademicContentDownload";
import AcademicContentDownloadFeedback from "../editor/AcademicContentDownloadFeedback";
import type {
  AcademicContentBase,
  AcademicContentDetail,
} from "../../types/contracts";
import AcademicTargetsSection from "../editor/AcademicTargetsSection";
import LifecycleActions from "../editor/LifecycleActions";
import ReadinessPanel from "../editor/ReadinessPanel";
import RevisionHistoryPanel from "../editor/RevisionHistoryPanel";
import AcademicContentPublicationPanel from "../publication/AcademicContentPublicationPanel";
import SubjectResourceContextRail from "./SubjectResourceContextRail";
import SubjectResourceDetailsPanel from "./SubjectResourceDetailsPanel";
import SubjectResourceHeader from "./SubjectResourceHeader";
import SubjectResourceMetadataStrip from "./SubjectResourceMetadataStrip";
import SubjectResourcePreviewWorkspace from "./SubjectResourcePreviewWorkspace";
import SubjectResourceResourcesPanel from "./SubjectResourceResourcesPanel";
import SubjectResourceSectionNav from "./SubjectResourceSectionNav";

type EditorState = ReturnType<typeof useAcademicContentEditor>;
type SubjectResourceEditor = EditorState & {
  content: Extract<AcademicContentDetail, { type: "SUBJECT_RESOURCE" }>;
};

interface SubjectResourceEditorViewProps {
  editor: SubjectResourceEditor;
  canManage: boolean;
  canPublish?: boolean;
  onLifecycleChanged: (content: AcademicContentBase) => Promise<unknown>;
  onDeleted: () => void;
}

function OptionsUnavailable({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  const t = useAcademicContentTranslations("details");
  return (
    <section
      role="alert"
      className="rounded-xl border border-red-200 bg-white p-6 shadow-sm"
    >
      <p className="text-sm text-red-700">{message}</p>
      <Button className="mt-4" variant="secondary" onClick={onRetry}>
        {t("retry_references")}
      </Button>
    </section>
  );
}

function sectionIndicators(editor: SubjectResourceEditor) {
  return {
    details:
      editor.sections.metadata.dirty ||
      editor.sections.details.dirty ||
      editor.sections.tags.dirty
        ? ("unsaved" as const)
        : undefined,
    targets: editor.sections.targets.dirty ? ("unsaved" as const) : undefined,
    resources:
      editor.sections.links.dirty || editor.sections.files.dirty
        ? ("unsaved" as const)
        : undefined,
    readiness: editor.readiness?.canAdvance
      ? ("ready" as const)
      : ("blocked" as const),
  };
}

export default function SubjectResourceEditorView(
  props: SubjectResourceEditorViewProps,
) {
  const { editor } = props;
  const locale = useLocale();
  const t = useAcademicContentTranslations("subject_resource_detail");
  const [activePanel, setActivePanel] =
    useState<SubjectResourcePanel>("preview");
  const [preferredAssetId, setPreferredAssetId] = useState<string | null>(
    () =>
      firstPreviewableSubjectResourceAsset(editor.content.assets)?.assetId ??
      null,
  );
  const { state: downloadState, isDownloading, requestDownload } = useAcademicContentDownload();
  const optionState = useAcademicContentDetailOptions(editor.content);
  const targetDisplay = useAcademicContentTargetDisplay(
    editor.content,
    locale,
    t("context.unavailable"),
  );
  const selectedAsset =
    editor.content.assets.find(({ assetId }) => assetId === preferredAssetId) ??
    firstPreviewableSubjectResourceAsset(editor.content.assets);
  const publicationAvailable = isPublicationSurfaceAvailable(
    editor.content.type,
    editor.content.audience,
  );
  const resolvedPanel =
    activePanel === "publication" && !publicationAvailable
      ? "preview"
      : activePanel;
  const disabled = editor.isReadOnly || !props.canManage;
  const refreshResources = async () => {
    await Promise.all([editor.refreshAggregate(), editor.refreshReadiness()]);
  };
  const panels: Record<SubjectResourcePanel, React.ReactNode> = {
    preview: (
      <SubjectResourcePreviewWorkspace
        assets={editor.content.assets}
        selectedAssetId={selectedAsset?.assetId ?? null}
        onSelectAsset={setPreferredAssetId}
        onDownload={requestDownload}
        isDownloading={isDownloading}
      />
    ),
    details: optionState.error ? (
      <OptionsUnavailable
        message={optionState.error}
        onRetry={optionState.retry}
      />
    ) : optionState.options ? (
      <SubjectResourceDetailsPanel
        content={editor.content}
        disabled={disabled}
        options={optionState.options}
        metadataState={editor.sections.metadata}
        detailState={editor.sections.details}
        tagsState={editor.sections.tags}
        onMetadataDirtyChange={(dirty) =>
          editor.markSectionDirty("metadata", dirty)
        }
        onSaveMetadata={editor.saveMetadata}
        onDetailDirty={() => editor.markSectionDirty("details", true)}
        onSaveDetail={editor.saveSubjectResourceDetails}
        onTagsDirty={() => editor.markSectionDirty("tags", true)}
        onSaveTags={editor.saveTags}
      />
    ) : (
      <PartialLoader />
    ),
    targets: (
      <AcademicTargetsSection
        content={editor.content}
        disabled={disabled}
        sectionState={editor.sections.targets}
        onDirtyChange={(dirty) => editor.markSectionDirty("targets", dirty)}
        onSave={editor.saveTargets}
      />
    ),
    resources: (
      <SubjectResourceResourcesPanel
        content={editor.content}
        disabled={disabled}
        linksState={editor.sections.links}
        onLinksDirty={() => editor.markSectionDirty("links", true)}
        onSaveLinks={editor.saveLinks}
        onFilesChanged={refreshResources}
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
        content={editor.content}
        canMutate={props.canPublish ?? false}
        canStartRevision={props.canManage && (props.canPublish ?? false)}
        onContentChanged={refreshResources}
      />
    ),
    revisions: (
      <RevisionHistoryPanel
        key={`${editor.content.id}:${editor.content.updatedAt}`}
        contentId={editor.content.id}
      />
    ),
  };
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
          {t("read_only")}
        </div>
      ) : null}
      <AcademicContentDownloadFeedback state={downloadState} />
      <SubjectResourceHeader
        content={editor.content}
        locale={locale}
        selectedAsset={selectedAsset}
        canManage={!disabled}
        onEdit={() => setActivePanel("details")}
        onShare={() => setActivePanel("targets")}
        onDownload={requestDownload}
        isDownloading={isDownloading}
        lifecycleActions={
          <LifecycleActions
            content={editor.content}
            canManage={props.canManage}
            onChanged={props.onLifecycleChanged}
            onDeleted={props.onDeleted}
          />
        }
      />
      <SubjectResourceMetadataStrip
        content={editor.content}
        selectedAsset={selectedAsset}
        targets={targetDisplay.targets}
      />
      <SubjectResourceSectionNav
        variant="mobile"
        activePanel={resolvedPanel}
        showPublication={publicationAvailable}
        indicators={sectionIndicators(editor)}
        onChange={setActivePanel}
      />
      <div className="grid min-w-0 gap-4 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_320px]">
        <div className="hidden lg:block">
          <SubjectResourceSectionNav
            variant="desktop"
            activePanel={resolvedPanel}
            showPublication={publicationAvailable}
            indicators={sectionIndicators(editor)}
            onChange={setActivePanel}
          />
        </div>
        <div className="min-w-0">{panels[resolvedPanel]}</div>
        <div className="lg:col-start-2 xl:col-start-auto">
          <SubjectResourceContextRail
            content={editor.content}
            options={
              optionState.options ?? EMPTY_ACADEMIC_CONTENT_DETAIL_OPTIONS
            }
            targets={targetDisplay.targets}
            targetError={targetDisplay.error}
          />
        </div>
      </div>
    </main>
  );
}
