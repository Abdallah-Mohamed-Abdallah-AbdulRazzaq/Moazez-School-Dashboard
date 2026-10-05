import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AcademicContentDetail } from "../../../types/contracts";
import SubjectResourceEditorView from "../SubjectResourceEditorView";

const boundaries = vi.hoisted(() => ({
  loadTargets: vi.fn(),
  loadDetails: vi.fn(),
}));
vi.mock("../../../services/academicContentSelectors", () => ({
  loadAcademicTargetOptions: boundaries.loadTargets,
}));
vi.mock(
  "../../../services/academicContentDetailOptions",
  async (importOriginal) => {
    const original =
      await importOriginal<
        typeof import("../../../services/academicContentDetailOptions")
      >();
    return {
      ...original,
      loadAcademicContentDetailOptions: boundaries.loadDetails,
    };
  },
);

const content = {
  id: "resource-1",
  academicYearId: "year-1",
  termId: "term-1",
  type: "SUBJECT_RESOURCE",
  audience: "STUDENTS",
  title: "Fractions worksheet",
  description: null,
  status: "DRAFT",
  archivedAt: null,
  createdAt: "2026-10-01T08:00:00.000Z",
  updatedAt: "2026-10-05T08:00:00.000Z",
  latestPublicationId: null,
  publicationStatus: null,
  publishAt: null,
  visibleFrom: null,
  visibleUntil: null,
  targets: [],
  assets: [],
  links: [],
  tags: [],
  details: {
    resourceCategory: "WORKSHEET",
    curriculumId: null,
    curriculumUnitId: null,
    curriculumLessonId: null,
  },
} satisfies Extract<AcademicContentDetail, { type: "SUBJECT_RESOURCE" }>;

function editor() {
  const clean = { dirty: false, saving: false, error: null };
  return {
    content,
    readiness: { canAdvance: true, blockingReasons: [] },
    sections: {
      metadata: clean,
      targets: clean,
      details: clean,
      links: clean,
      tags: clean,
      files: clean,
    },
    isLoading: false,
    isReadOnly: false,
    hasUnsavedChanges: false,
    error: null,
    markSectionDirty: vi.fn(),
    applyContentBase: vi.fn(),
    applyContentTransition: vi.fn(),
    refreshAggregate: vi.fn(async () => undefined),
    refreshReadiness: vi.fn(async () => undefined),
    saveMetadata: vi.fn(async () => true),
    saveTargets: vi.fn(async () => true),
    saveLinks: vi.fn(async () => true),
    saveTags: vi.fn(async () => true),
    savePreparationDetails: vi.fn(async () => true),
    saveWeeklyPlanDetails: vi.fn(async () => true),
    saveGuardianNoteDetails: vi.fn(async () => true),
    saveSubjectResourceDetails: vi.fn(async () => true),
    saveOnlineSessionDetails: vi.fn(async () => true),
    reload: vi.fn(),
  };
}

describe("SubjectResourceEditorView", () => {
  beforeEach(() => {
    boundaries.loadTargets.mockReset().mockResolvedValue({
      structure: { stages: [], grades: [], sections: [], classrooms: [] },
      subjects: [],
      subjectAllocations: [],
      teacherAllocations: [],
    });
    boundaries.loadDetails.mockReset().mockResolvedValue({
      curricula: [],
      lessonPlans: [],
      homeworkAssignments: [],
      assessments: [],
      timetableEntries: [],
    });
  });

  it("opens the contract-backed editing panels from the header", async () => {
    render(
      <SubjectResourceEditorView
        editor={editor()}
        canManage
        canPublish
        onLifecycleChanged={vi.fn(async () => undefined)}
        onDeleted={vi.fn()}
      />,
    );
    await waitFor(() => expect(boundaries.loadDetails).toHaveBeenCalledOnce());

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(
      screen.getByRole("heading", { name: "Basic information" }),
    ).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Share" }));
    expect(
      screen.getByRole("heading", { name: "Academic targets" }),
    ).toBeVisible();
    expect(
      await screen.findByText(
        "No academic targets. Add one or save the empty target set.",
      ),
    ).toBeVisible();
    expect(
      screen.getAllByRole("button", { name: "Publication" }),
    ).not.toHaveLength(0);
  });
});
