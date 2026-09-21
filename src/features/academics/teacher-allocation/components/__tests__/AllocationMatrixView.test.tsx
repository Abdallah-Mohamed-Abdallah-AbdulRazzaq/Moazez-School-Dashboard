import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api-error";
import AllocationMatrixView from "@/features/academics/teacher-allocation/components/AllocationMatrixView";
import {
  type TeacherAllocation,
} from "@/features/academics/teacher-allocation/services/teacherAllocationService";
import {
  bulkSaveTeacherAllocations,
  deleteTeacherAllocation,
  previewTeacherAllocationReassignment,
  reassignTeacherAllocation,
} from "@/features/academics/teacher-allocation/services/teacherAllocationApiAdapter";
import type { TeacherAllocationReassignmentPreviewResponse } from "@/features/academics/teacher-allocation/services/teacherAllocationApi.types";
import type { Classroom, Grade, Section } from "@/features/academics/academic-structure-tree/services/structureService";
import type { Subject, SubjectAllocation } from "@/features/academics/subjects/services/subjectsService";
import type { Teacher } from "@/features/academics/teacher-allocation/services/teacherAllocationService";

vi.mock("@/features/academics/teacher-allocation/components/TeacherSelect", () => ({
  default: ({
    disabled,
    onChange,
    value,
  }: {
    disabled?: boolean;
    onChange: (teacherId: string | null) => void;
    value: string | null;
  }) => (
    <select
      aria-label="teacher-select"
      disabled={disabled}
      value={value ?? ""}
      onChange={(event) => onChange(event.target.value || null)}
    >
      <option value="">Unassigned</option>
      <option value="teacher-user-1">Teacher One</option>
      <option value="teacher-user-2">Teacher Two</option>
    </select>
  ),
}));

vi.mock("@/features/academics/teacher-allocation/services/teacherAllocationApiAdapter", () => ({
  applyTeacherToGrade: vi.fn(),
  bulkSaveTeacherAllocations: vi.fn(),
  clearSubjectAllocations: vi.fn(),
  deleteTeacherAllocation: vi.fn(),
  getTeacherAllocationValidation: vi.fn(),
  getTeacherLoads: vi.fn(),
  listTeacherAllocations: vi.fn(),
  previewTeacherAllocationReassignment: vi.fn(),
  reassignTeacherAllocation: vi.fn(),
}));

vi.mock("@/components/ui/toast/Toast", () => ({
  useToast: () => ({
    showError: vi.fn(),
    showSuccess: vi.fn(),
  }),
}));

const grade: Grade = {
  id: "grade-1",
  stageId: "stage-1",
  name: "Grade 1",
  nameAr: "Grade 1 AR",
  nameEn: "Grade 1",
  order: 1,
};

const section: Section = {
  id: "section-1",
  gradeId: "grade-1",
  name: "Section A",
  nameAr: "Section A AR",
  nameEn: "Section A",
  order: 1,
};

const classroom: Classroom = {
  id: "classroom-1",
  sectionId: "section-1",
  name: "Classroom A",
  nameAr: "Classroom A AR",
  nameEn: "Classroom A",
  order: 1,
};

const subject: Subject = {
  id: "subject-1",
  name: "Math",
  nameAr: "Math AR",
  nameEn: "Math",
  code: "MATH",
  color: "#2563eb",
  isActive: true,
};

const unallocatedSubject: Subject = {
  id: "subject-2",
  name: "Science",
  nameAr: "Science AR",
  nameEn: "Science",
  code: "SCI",
  color: "#16a34a",
  isActive: true,
};

const subjectAllocation: SubjectAllocation = {
  id: "subject-allocation-1",
  termId: "term-1",
  gradeId: "grade-1",
  subjectId: "subject-1",
  weeklyHours: 5,
};

const teacher: Teacher = {
  id: "teacher-user-1",
  nameAr: "Teacher One AR",
  nameEn: "Teacher One",
  isActive: true,
};

const replacementTeacher: Teacher = {
  id: "teacher-user-2",
  nameAr: "Teacher Two AR",
  nameEn: "Teacher Two",
  isActive: true,
};

const existingAllocation: TeacherAllocation = {
  id: "allocation-1",
  termId: "term-1",
  sectionId: "section-1",
  classroomId: "classroom-1",
  subjectId: "subject-1",
  teacherId: "teacher-user-1",
};

const readyPreview: TeacherAllocationReassignmentPreviewResponse = {
  allocation: {
    id: "allocation-1",
    subjectId: "subject-1",
    classroomId: "classroom-1",
    termId: "term-1",
  },
  currentTeacher: {
    userId: "teacher-user-1",
    fullName: "Teacher One",
  },
  targetTeacher: {
    userId: "teacher-user-2",
    fullName: "Teacher Two",
  },
  decision: "ready",
  canReassign: true,
  impactFingerprint: "a".repeat(64),
  impact: {
    timetable: {
      draft: 1,
      active: 0,
      cancelled: 0,
      targetTeacherConflicts: 0,
    },
    lessonPlans: { draft: 0, active: 0, archived: 0 },
    homework: {
      draft: 0,
      published: 0,
      closed: 0,
      cancelled: 0,
      archived: 0,
    },
    reinforcement: {
      notCompleted: 0,
      inProgress: 0,
      underReview: 0,
      completed: 0,
      cancelled: 0,
    },
    announcements: {
      draft: 0,
      scheduled: 0,
      published: 0,
      archived: 0,
      cancelled: 0,
    },
    assessments: { policy: "contextual_access_no_rewrite" },
    curriculum: { policy: "no_mutation" },
    attendance: { policy: "historical_preserve" },
    messages: { policy: "no_history_rewrite" },
  },
  blockers: [],
  automaticActions: [
    {
      domain: "timetable",
      action: "handoff_current_responsibility",
      count: 1,
    },
  ],
  historicalRecords: [],
};

const mockedBulkSaveTeacherAllocations = vi.mocked(
  bulkSaveTeacherAllocations,
);
const mockedDeleteTeacherAllocation = vi.mocked(deleteTeacherAllocation);
const mockedPreviewTeacherAllocationReassignment = vi.mocked(
  previewTeacherAllocationReassignment,
);
const mockedReassignTeacherAllocation = vi.mocked(reassignTeacherAllocation);

function renderMatrix(
  options: {
    isReadOnly?: boolean;
    subjects?: Subject[];
    subjectAllocations?: SubjectAllocation[];
    teacherAllocations?: TeacherAllocation[];
    onRefresh?: () => Promise<void>;
  } = {},
) {
  const onRefresh = options.onRefresh ?? vi.fn().mockResolvedValue(undefined);
  return render(
    <AllocationMatrixView
      termId="term-1"
      grades={[grade]}
      sections={[section]}
      classrooms={[classroom]}
      subjects={options.subjects ?? [subject]}
      subjectAllocations={options.subjectAllocations ?? [subjectAllocation]}
      teachers={[teacher, replacementTeacher]}
      teacherAllocations={options.teacherAllocations ?? []}
      isReadOnly={options.isReadOnly ?? false}
      onRefresh={onRefresh}
      onValidate={vi.fn()}
    />,
  );
}

describe("AllocationMatrixView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("disables teacher selection and save in read-only mode", () => {
    renderMatrix({ isReadOnly: true });

    expect(screen.getByLabelText("teacher-select")).toBeDisabled();
    expect(screen.getByRole("button", { name: /actions\.save/i })).toBeDisabled();
  });

  it("shows only allocated subjects in the subject filter", () => {
    renderMatrix({ subjects: [subject, unallocatedSubject] });

    fireEvent.click(screen.getByRole("button", { name: /filters\.subject/i }));

    expect(screen.getByRole("button", { name: "Math" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Science" })).not.toBeInTheDocument();
  });

  it("switches the matrix between compact and comfortable density", () => {
    renderMatrix();

    const compactViewButton = screen.getByRole("button", {
      name: /matrix\.density\.compact/i,
    });
    const comfortableViewButton = screen.getByRole("button", {
      name: /matrix\.density\.comfortable/i,
    });

    expect(compactViewButton).toHaveAttribute("aria-pressed", "true");
    expect(comfortableViewButton).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(comfortableViewButton);

    expect(compactViewButton).toHaveAttribute("aria-pressed", "false");
    expect(comfortableViewButton).toHaveAttribute("aria-pressed", "true");
  });

  it("keeps the classroom row header sticky while scrolling across subjects", () => {
    renderMatrix();

    expect(screen.getByRole("cell", { name: /classroom a/i })).toHaveClass("sticky");
    expect(screen.getByRole("table")).not.toHaveClass("overflow-hidden");
  });

  it("shows mapped missing subject allocation errors after failed save", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    mockedBulkSaveTeacherAllocations.mockRejectedValueOnce(
      new ApiError(
        "Backend message",
        400,
        "academics.allocation.missing_subject_allocation",
      ),
    );

    try {
      renderMatrix();

      fireEvent.change(screen.getByLabelText("teacher-select"), {
        target: { value: "teacher-user-1" },
      });
      fireEvent.click(screen.getByRole("button", { name: /actions\.save/i }));

      expect(
        await screen.findByText(
          "This subject has no weekly-hours row for the selected grade/term. Configure subject allocation first.",
        ),
      ).toBeInTheDocument();
      await waitFor(() => {
        expect(mockedBulkSaveTeacherAllocations).toHaveBeenCalled();
      });
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  it("previews a persisted teacher change before writing", async () => {
    mockedPreviewTeacherAllocationReassignment.mockResolvedValueOnce(
      readyPreview,
    );
    renderMatrix({ teacherAllocations: [existingAllocation] });

    fireEvent.change(screen.getByLabelText("teacher-select"), {
      target: { value: "teacher-user-2" },
    });
    fireEvent.click(screen.getByRole("button", { name: /actions\.save/i }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(mockedPreviewTeacherAllocationReassignment).toHaveBeenCalledWith(
      "allocation-1",
      { newTeacherUserId: "teacher-user-2" },
    );
    expect(mockedReassignTeacherAllocation).not.toHaveBeenCalled();
    expect(mockedDeleteTeacherAllocation).not.toHaveBeenCalled();
    expect(mockedBulkSaveTeacherAllocations).not.toHaveBeenCalled();
  });

  it("commits a ready reassignment only after confirmation", async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    mockedPreviewTeacherAllocationReassignment.mockResolvedValueOnce(
      readyPreview,
    );
    mockedReassignTeacherAllocation.mockResolvedValueOnce({
      allocation: { id: "allocation-1", teacherUserId: "teacher-user-2" },
      previousTeacherUserId: "teacher-user-1",
      newTeacherUserId: "teacher-user-2",
      transferred: {
        timetableEntries: 1,
        lessonPlans: 0,
        homeworkAssignments: 0,
      },
      preservedHistorical: {
        cancelledTimetableEntries: 0,
        archivedLessonPlans: 0,
        cancelledOrArchivedHomeworkAssignments: 0,
        completedOrCancelledReinforcementTasks: 0,
        publishedArchivedOrCancelledAnnouncements: 0,
      },
    });
    renderMatrix({
      teacherAllocations: [existingAllocation],
      onRefresh,
    });

    fireEvent.change(screen.getByLabelText("teacher-select"), {
      target: { value: "teacher-user-2" },
    });
    fireEvent.click(screen.getByRole("button", { name: /actions\.save/i }));
    fireEvent.click(
      await screen.findByRole("button", {
        name: /reassignment\.actions\.confirm$/i,
      }),
    );

    await waitFor(() => {
      expect(mockedReassignTeacherAllocation).toHaveBeenCalledWith(
        "allocation-1",
        {
          newTeacherUserId: "teacher-user-2",
          impactFingerprint: "a".repeat(64),
        },
      );
      expect(onRefresh).toHaveBeenCalledOnce();
    });
  });

  it("keeps confirmation disabled when the preview is blocked", async () => {
    mockedPreviewTeacherAllocationReassignment.mockResolvedValueOnce({
      ...readyPreview,
      decision: "blocked",
      canReassign: false,
      blockers: [
        {
          domain: "timetable",
          code: "target_teacher_conflict",
          count: 1,
        },
      ],
    });
    renderMatrix({ teacherAllocations: [existingAllocation] });

    fireEvent.change(screen.getByLabelText("teacher-select"), {
      target: { value: "teacher-user-2" },
    });
    fireEvent.click(screen.getByRole("button", { name: /actions\.save/i }));

    expect(
      await screen.findByRole("button", {
        name: /reassignment\.actions\.confirm$/i,
      }),
    ).toBeDisabled();
    expect(mockedReassignTeacherAllocation).not.toHaveBeenCalled();
  });

  it("commits create-only changes without opening the review dialog", async () => {
    mockedBulkSaveTeacherAllocations.mockResolvedValueOnce({
      items: [],
      summary: { requestedCount: 1, createdCount: 1, existingCount: 0 },
    });
    renderMatrix();

    fireEvent.change(screen.getByLabelText("teacher-select"), {
      target: { value: "teacher-user-1" },
    });
    fireEvent.click(screen.getByRole("button", { name: /actions\.save/i }));

    await waitFor(() => {
      expect(mockedBulkSaveTeacherAllocations).toHaveBeenCalledWith({
        termId: "term-1",
        items: [
          {
            teacherUserId: "teacher-user-1",
            subjectId: "subject-1",
            classroomId: "classroom-1",
          },
        ],
      });
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("invalidates a failed reassignment and refreshes authoritative allocations", async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    mockedPreviewTeacherAllocationReassignment.mockResolvedValueOnce(
      readyPreview,
    );
    mockedReassignTeacherAllocation.mockRejectedValueOnce(
      new ApiError(
        "Preview changed",
        409,
        "academics.allocation.reassignment_stale_preview",
        undefined,
        undefined,
        "trace-1",
      ),
    );

    try {
      renderMatrix({ teacherAllocations: [existingAllocation], onRefresh });
      fireEvent.change(screen.getByLabelText("teacher-select"), {
        target: { value: "teacher-user-2" },
      });
      fireEvent.click(screen.getByRole("button", { name: /actions\.save/i }));
      fireEvent.click(
        await screen.findByRole("button", {
          name: /reassignment\.actions\.confirm$/i,
        }),
      );

      expect(
        await screen.findByText(/reassignment\.errors\.stalePreview/i),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", {
          name: /reassignment\.actions\.confirm$/i,
        }),
      ).toBeDisabled();
      expect(onRefresh).toHaveBeenCalledOnce();
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });
});
