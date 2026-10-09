"use client";

import { useState } from "react";
import { LockKeyhole } from "lucide-react";
import type { useAcademicContentEditor } from "../../hooks/useAcademicContentEditor";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import { isPublicationSurfaceAvailable } from "../../model/academicContentPublicationPolicy";
import type {
  AcademicContentBase,
  AcademicContentDetail,
} from "../../types/contracts";
import AcademicContentPublicationPanel from "../publication/AcademicContentPublicationPanel";
import AcademicTargetsSection from "./AcademicTargetsSection";
import BasicInformationSection from "./BasicInformationSection";
import EditorSectionNav, {
  EDITOR_SECTIONS,
  type AcademicContentEditorPanel,
  type EditorSectionIndicator,
} from "./EditorSectionNav";
import FilesSection from "./FilesSection";
import LifecycleActions from "./LifecycleActions";
import LinksSection from "./LinksSection";
import ReadinessPanel from "./ReadinessPanel";
import RevisionHistoryPanel from "./RevisionHistoryPanel";
import TagsSection from "./TagsSection";
import TypeDetailSection from "./details/TypeDetailSection";

type EditorState = ReturnType<typeof useAcademicContentEditor> & {
  content: AcademicContentDetail;
};

export interface GenericAcademicContentEditorViewProps {
  editor: EditorState;
  canManage: boolean;
  canPublish: boolean;
  academicYearName: string;
  termName: string;
  termBounds?: { startDate: string; endDate: string };
  onLifecycleChanged: (content: AcademicContentBase) => Promise<unknown>;
  onDeleted: () => void;
}

function sectionIndicator(section: {
  dirty: boolean;
  saving: boolean;
  error: unknown;
}): EditorSectionIndicator | undefined {
  if (section.error) return "error";
  if (section.saving) return "saving";
  if (section.dirty) return "unsaved";
  return undefined;
}

export default function GenericAcademicContentEditorView(
  props: GenericAcademicContentEditorViewProps,
) {
  const { editor } = props;
  const { content } = editor;
  const [activeSection, setActiveSection] =
    useState<AcademicContentEditorPanel>("metadata");
  const t = useAcademicContentTranslations();
  const editingDisabled = editor.isReadOnly || !props.canManage;
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
    ({ id }) => id === activeSection,
  )
    ? activeSection
    : "metadata";
  const indicators = {
    metadata: sectionIndicator(editor.sections.metadata),
    targets: sectionIndicator(editor.sections.targets),
    details: sectionIndicator(editor.sections.details),
    links: sectionIndicator(editor.sections.links),
    tags: sectionIndicator(editor.sections.tags),
    files: sectionIndicator(editor.sections.files),
    readiness: editor.readiness
      ? editor.readiness.canAdvance
        ? ("ready" as const)
        : ("blocked" as const)
      : undefined,
  };
  const refreshContent = async () => {
    await Promise.all([editor.refreshAggregate(), editor.refreshReadiness()]);
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
            {editor.isReadOnly ? (
              <div
                role="status"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700"
              >
                <LockKeyhole aria-hidden="true" className="size-4" />
                {t("editor.read_only")}
              </div>
            ) : null}
            <LifecycleActions
              content={content}
              canManage={props.canManage}
              onChanged={props.onLifecycleChanged}
              onDeleted={props.onDeleted}
            />
          </div>
        </div>
        <dl className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            [t("editor.content_type"), t(`types.${content.type}`)],
            [t("editor.academic_year"), props.academicYearName],
            [t("editor.term"), props.termName],
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
              termStartDate={props.termBounds?.startDate}
              termEndDate={props.termBounds?.endDate}
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
              onFilesChanged={refreshContent}
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
              canMutate={props.canPublish}
              canStartRevision={props.canManage && props.canPublish}
              onContentChanged={refreshContent}
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
