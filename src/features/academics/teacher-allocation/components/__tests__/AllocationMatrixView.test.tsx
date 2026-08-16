import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api-error";
import AllocationMatrixView from "@/features/academics/teacher-allocation/components/AllocationMatrixView";
import {
  saveTeacherAllocationChanges,
} from "@/features/academics/teacher-allocation/services/teacherAllocationService";
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
    </select>
  ),
}));

vi.mock("@/features/academics/teacher-allocation/services/teacherAllocationService", () => ({
  clearSubjectAllocations: vi.fn(),
  saveTeacherAllocationChanges: vi.fn(),
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

const mockedSaveTeacherAllocationChanges = vi.mocked(saveTeacherAllocationChanges);

function renderMatrix(
  options: {
    isReadOnly?: boolean;
    subjects?: Subject[];
    subjectAllocations?: SubjectAllocation[];
  } = {},
) {
  return render(
    <AllocationMatrixView
      termId="term-1"
      grades={[grade]}
      sections={[section]}
      classrooms={[classroom]}
      subjects={options.subjects ?? [subject]}
      subjectAllocations={options.subjectAllocations ?? [subjectAllocation]}
      teachers={[teacher]}
      teacherAllocations={[]}
      isReadOnly={options.isReadOnly ?? false}
      onRefresh={vi.fn().mockResolvedValue(undefined)}
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

  it("shows mapped missing subject allocation errors after failed save", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    mockedSaveTeacherAllocationChanges.mockRejectedValueOnce(
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
        expect(mockedSaveTeacherAllocationChanges).toHaveBeenCalledWith(
          expect.objectContaining({
            termId: "term-1",
            localAllocations: [
              expect.objectContaining({
                classroomId: "classroom-1",
                subjectId: "subject-1",
                teacherId: "teacher-user-1",
              }),
            ],
          }),
        );
      });
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });
});
