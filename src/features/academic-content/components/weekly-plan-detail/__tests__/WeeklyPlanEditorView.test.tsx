import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AcademicContentDetail } from "../../../types/contracts";
import WeeklyPlanEditorView from "../WeeklyPlanEditorView";

const mocks = vi.hoisted(() => ({
  loadTargets: vi.fn(),
  loadDetailOptions: vi.fn(),
}));

vi.mock("../../../services/academicContentSelectors", () => ({
  loadAcademicTargetOptions: mocks.loadTargets,
}));

vi.mock("../../../services/weeklyPlanDetailOptions", async (importOriginal) => {
  const original =
    await importOriginal<
      typeof import("../../../services/weeklyPlanDetailOptions")
    >();
  return { ...original, loadWeeklyPlanDetailOptions: mocks.loadDetailOptions };
});

const content = {
  id: "content-1",
  academicYearId: "year-1",
  termId: "term-1",
  type: "WEEKLY_PLAN",
  audience: "STUDENTS",
  title: "The Solar System",
  description: "Explore the solar system",
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
    weekStartDate: "2026-10-05",
    weekEndDate: "2026-10-09",
    objectives: ["Identify the planets"],
    topics: ["The Sun"],
    expectedHomework: null,
    upcomingAssessments: null,
    notes: null,
    homeworkAssignmentIds: [],
    gradeAssessmentIds: [],
  },
} satisfies Extract<AcademicContentDetail, { type: "WEEKLY_PLAN" }>;

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

describe("WeeklyPlanEditorView", () => {
  beforeEach(() => {
    mocks.loadTargets.mockReset().mockResolvedValue({
      structure: { stages: [], grades: [], sections: [], classrooms: [] },
      subjects: [],
      subjectAllocations: [],
      teacherAllocations: [],
    });
    mocks.loadDetailOptions.mockReset().mockResolvedValue({
      homeworkAssignments: [],
      assessments: [],
      errors: { homeworkAssignments: null, assessments: null },
    });
  });

  it("preserves an unsaved detail draft while navigating the dedicated workspace", async () => {
    const state = editor();
    render(
      <WeeklyPlanEditorView
        editor={state}
        canManage
        canPublish={false}
        termBounds={{ startDate: "2026-09-01", endDate: "2026-12-31" }}
        onLifecycleChanged={vi.fn(async () => undefined)}
        onDeleted={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(mocks.loadTargets).toHaveBeenCalledOnce();
      expect(mocks.loadDetailOptions).toHaveBeenCalledOnce();
    });
    fireEvent.click(
      screen.getAllByRole("button", { name: "Learning objectives" })[0],
    );
    fireEvent.change(screen.getByLabelText("Learning objectives 1"), {
      target: { value: "Compare planet sizes" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Resources" })[0]);

    expect(screen.getByRole("heading", { name: "Files" })).toBeVisible();
    expect(
      screen.getAllByRole("button", { name: "Publication" }),
    ).not.toHaveLength(0);
    expect(
      screen.getAllByRole("button", { name: "Version history" }),
    ).not.toHaveLength(0);

    fireEvent.click(
      screen.getAllByRole("button", { name: "Learning objectives" })[0],
    );
    expect(screen.getByLabelText("Learning objectives 1")).toHaveValue(
      "Compare planet sizes",
    );
    expect(state.saveWeeklyPlanDetails).not.toHaveBeenCalled();
  });
});
