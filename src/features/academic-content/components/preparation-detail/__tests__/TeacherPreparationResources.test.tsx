import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { TeacherPreparationDetailDraftController } from "../../../hooks/useTeacherPreparationDetailDraft";
import type { AcademicContentDetail } from "../../../types/contracts";
import TeacherPreparationOverview from "../TeacherPreparationOverview";
import TeacherPreparationResources from "../TeacherPreparationResources";

vi.mock("../../editor/BasicInformationSection", () => ({
  default: () => <section><h2>Basic information</h2></section>,
}));

vi.mock("../../editor/TagsSection", () => ({
  default: () => <section><h2>Tag editor</h2></section>,
}));

vi.mock("../../editor/LinksSection", () => ({
  default: ({ disabled }: { disabled: boolean }) => (
    <section>
      <h2>Links</h2>
      {!disabled ? <button type="button">Add link</button> : null}
    </section>
  ),
}));

vi.mock("../../editor/FilesSection", () => ({
  default: ({
    assets,
    disabled,
    title = "Files",
    onFilesChanged,
  }: {
    assets: Array<{ assetId: string; originalName: string }>;
    disabled: boolean;
    title?: string;
    onFilesChanged: () => Promise<unknown>;
  }) => (
    <section>
      <h2>{title}</h2>
      {assets.map((asset) => <p key={asset.assetId}>{asset.originalName}</p>)}
      {!disabled ? (
        <>
          <button type="button" onClick={() => void onFilesChanged()}>Upload attachment</button>
          <button type="button" onClick={() => void onFilesChanged()}>Unlink attachment</button>
        </>
      ) : null}
    </section>
  ),
}));

const content: Extract<AcademicContentDetail, { type: "TEACHER_PREPARATION" }> = {
  id: "content-1",
  academicYearId: "year-1",
  termId: "term-1",
  type: "TEACHER_PREPARATION",
  audience: "INTERNAL_STAFF",
  title: "Fractions",
  description: "Compare fractions",
  status: "DRAFT",
  archivedAt: null,
  createdAt: "2026-10-01T08:00:00.000Z",
  updatedAt: "2026-10-02T08:00:00.000Z",
  targets: [],
  assets: [{
    assetId: "asset-1",
    fileId: "file-1",
    originalName: "fractions.pdf",
    mimeType: "application/pdf",
    sizeBytes: "2048",
    sortOrder: 0,
    createdAt: "2026-10-01T08:00:00.000Z",
  }],
  links: [],
  tags: [{ id: "tag-1", value: "Equivalent fractions", sortOrder: 0 }],
  details: null,
};

const controller: TeacherPreparationDetailDraftController = {
  draft: {
    topic: "Equivalent fractions",
    objectives: [],
    learningOutcomes: [],
    teachingStrategies: [],
    activities: [],
    resourceNotes: "Use fraction tiles",
    assessmentNotes: null,
    teacherNotes: null,
    curriculumId: null,
    curriculumUnitId: null,
    curriculumLessonId: null,
    lessonPlanId: null,
    lessonPlanItemId: null,
    timetableEntryId: null,
  },
  validationError: null,
  update: vi.fn(),
  applyTemplate: vi.fn(),
  save: vi.fn(async () => true),
  resetValidation: vi.fn(),
};

const cleanState = { dirty: false, saving: false, error: null };

function renderSurfaces(disabled = false, onFilesChanged = vi.fn(async () => undefined)) {
  render(
    <>
      <TeacherPreparationOverview
        content={content}
        controller={controller}
        disabled={disabled}
        metadataState={cleanState}
        detailState={cleanState}
        tagsState={cleanState}
        onMetadataDirtyChange={vi.fn()}
        onSaveMetadata={vi.fn(async () => true)}
        onTagsDirty={vi.fn()}
        onSaveTags={vi.fn(async () => true)}
        onFilesChanged={onFilesChanged}
      />
      <TeacherPreparationResources
        content={content}
        controller={controller}
        disabled={disabled}
        detailState={cleanState}
        linksState={cleanState}
        onLinksDirty={vi.fn()}
        onSaveLinks={vi.fn(async () => true)}
        onFilesChanged={onFilesChanged}
      />
    </>,
  );
  return onFilesChanged;
}

describe("teacher preparation overview and resources", () => {
  it("places the shared attachments after key concepts and exposes resources separately", () => {
    renderSurfaces();

    const overview = screen.getByTestId("preparation-overview");
    const keyConcepts = within(overview).getByRole("heading", { name: "Key concepts" });
    const attachments = within(overview).getByRole("heading", { name: "Attachments" });
    expect(keyConcepts.compareDocumentPosition(attachments) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(overview).getByText("Equivalent fractions")).toBeVisible();
    expect(within(overview).getByText("fractions.pdf")).toBeVisible();
    expect(within(overview).queryByRole("button", { name: "Save topic" })).not.toBeInTheDocument();

    const resources = screen.getByTestId("preparation-resources");
    expect(within(resources).getByRole("heading", { name: "Resource notes" })).toBeVisible();
    expect(within(resources).getByText("fractions.pdf")).toBeVisible();
    expect(within(resources).getByRole("heading", { name: "Links" })).toBeVisible();
    expect(within(resources).queryByRole("button", { name: "Save resource notes" })).not.toBeInTheDocument();
  });

  it("refreshes shared aggregate state after file actions", () => {
    const onFilesChanged = renderSurfaces();
    fireEvent.click(screen.getAllByRole("button", { name: "Upload attachment" })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: "Unlink attachment" })[1]);
    expect(onFilesChanged).toHaveBeenCalledTimes(2);
  });

  it("removes file, link, and tag editing controls in read-only mode", () => {
    renderSurfaces(true);
    expect(screen.queryByRole("button", { name: "Upload attachment" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Unlink attachment" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add link" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit key concepts" })).not.toBeInTheDocument();
  });
});
