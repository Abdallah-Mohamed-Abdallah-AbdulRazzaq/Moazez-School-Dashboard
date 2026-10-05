import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AcademicContentDetail } from "../../../types/contracts";
import TeacherPreparationEditorView from "../TeacherPreparationEditorView";

const mocks = vi.hoisted(() => ({
  loadDetails: vi.fn(),
  loadTargets: vi.fn(),
  listTeachers: vi.fn(),
  submit: vi.fn(),
  reloadWorkflow: vi.fn(),
}));

vi.mock("../../../services/academicContentDetailOptions", () => ({
  loadAcademicContentDetailOptions: mocks.loadDetails,
}));

vi.mock("../../../services/academicContentSelectors", () => ({
  loadAcademicTargetOptions: mocks.loadTargets,
}));

vi.mock("@/features/teachers/services/teacherApi", () => ({
  teacherApi: { list: mocks.listTeachers },
}));

vi.mock("@/features/academics/hooks/AcademicYearTermLayoutContext", () => ({
  useAcademicYearTermLayoutContext: () => ({ academicYears: [], terms: [] }),
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({ hasPermission: () => false }),
}));

vi.mock("../../../hooks/useAcademicContentWorkflow", () => ({
  useAcademicContentWorkflow: () => ({
    policy: { preparationApprovalRequired: true },
    history: { items: [], page: 1, limit: 50, total: 0 },
    isLoading: false,
    isSubmitting: false,
    error: null,
    submit: mocks.submit,
    reload: mocks.reloadWorkflow,
  }),
}));

vi.mock("../../editor/FilesSection", () => ({
  default: ({ title = "Files", assets }: { title?: string; assets: Array<{ assetId: string; originalName: string }> }) => (
    <section><h2>{title}</h2>{assets.map((asset) => <p key={asset.assetId}>{asset.originalName}</p>)}</section>
  ),
}));

const content: Extract<AcademicContentDetail, { type: "TEACHER_PREPARATION" }> = {
  id: "content-1",
  academicYearId: "year-1",
  termId: "term-1",
  type: "TEACHER_PREPARATION",
  audience: "INTERNAL_STAFF",
  title: "Fractions preparation",
  description: "Compare fractions with visual models",
  status: "DRAFT",
  archivedAt: null,
  createdAt: "2026-10-01T08:00:00.000Z",
  updatedAt: "2026-10-02T08:00:00.000Z",
  targets: [],
  assets: [{ assetId: "asset-1", fileId: "file-1", originalName: "fractions.pdf", mimeType: "application/pdf", sizeBytes: "10", sortOrder: 0, createdAt: "2026-10-01T08:00:00.000Z" }],
  links: [],
  tags: [{ id: "tag-1", value: "Fractions", sortOrder: 0 }],
  details: {
    topic: "Equivalent fractions",
    objectives: ["Compare fractions"],
    learningOutcomes: [],
    teachingStrategies: [],
    activities: [],
    resourceNotes: null,
    assessmentNotes: null,
    teacherNotes: null,
    curriculumId: null,
    curriculumUnitId: null,
    curriculumLessonId: null,
    lessonPlanId: null,
    lessonPlanItemId: null,
    timetableEntryId: null,
  },
};

function editor() {
  const clean = { dirty: false, saving: false, error: null };
  return {
    content,
    readiness: { canAdvance: true, blockingReasons: [] },
    sections: { metadata: clean, targets: clean, details: clean, links: clean, tags: clean, files: clean },
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

describe("TeacherPreparationEditorView", () => {
  it("renders the specialized hierarchy and preserves an unsaved shared draft across panels", async () => {
    mocks.loadDetails.mockResolvedValue({ curricula: [], lessonPlans: [], homeworkAssignments: [], assessments: [], timetableEntries: [] });
    mocks.loadTargets.mockResolvedValue({ structure: { stages: [], grades: [], sections: [], classrooms: [] }, subjects: [], subjectAllocations: [], teacherAllocations: [] });
    mocks.listTeachers.mockResolvedValue({ items: [] });
    const state = editor();

    render(
      <TeacherPreparationEditorView
        editor={state}
        canManage
        canPublish={false}
        academicYearName="Academic year 2026/2027"
        termName="Term 1"
        onLifecycleChanged={vi.fn(async () => undefined)}
        onDeleted={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: "Fractions preparation" })).toBeVisible();
    const overview = screen.getByTestId("preparation-overview");
    expect(overview).toHaveTextContent("Key concepts");
    expect(overview).toHaveTextContent("Attachments");
    expect(overview).toHaveTextContent("fractions.pdf");
    expect(screen.getByRole("heading", { name: "Readiness" })).toBeVisible();

    fireEvent.click(screen.getAllByRole("button", { name: "Objectives" })[0]);
    fireEvent.change(screen.getByLabelText("Objectives 1"), { target: { value: "Compare equivalent fractions" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Activities" })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: "Objectives" })[0]);

    expect(screen.getByLabelText("Objectives 1")).toHaveValue("Compare equivalent fractions");
    expect(state.savePreparationDetails).not.toHaveBeenCalled();
    expect(screen.getAllByRole("button", { name: "Objectives" }).some((button) => button.getAttribute("aria-current") === "page")).toBe(true);
    await waitFor(() => expect(mocks.loadDetails).toHaveBeenCalledOnce());
  });
});
