import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CreateHomeworkPage from "../CreateHomeworkPage";
import { createHomeworkAssignment } from "../../services/homeworkService";
import { fetchEnrollments } from "@/features/students-guardians/enrollments/services/enrollmentsApiService";

const showError = vi.fn();
const showSuccess = vi.fn();
const replace = vi.fn();

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({ hasPermission: () => true }),
}));

vi.mock("@/components/ui/toast/Toast", () => ({
  useToast: () => ({ showError, showSuccess }),
}));

vi.mock("@/features/academics/hooks/AcademicYearTermLayoutContext", () => ({
  useAcademicYearTermLayoutContext: () => ({
    academicYearId: "year-1",
    termId: "term-1",
    selectedTerm: {
      startDate: "2026-01-01",
      endDate: "2026-12-31",
    },
    isInitializing: false,
  }),
}));

vi.mock("@/components/ui/input/Select", () => ({
  default: ({ label, value, options, onChange, disabled }: {
    label: string;
    value?: string;
    options: Array<{ value: string; label: string }>;
    onChange: (value: string) => void;
    disabled?: boolean;
  }) => (
    <label>
      {label}
      <select
        aria-label={label}
        value={value ?? ""}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="" />
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  ),
}));

vi.mock("@/components/ui/input/DateTimePicker", () => ({
  default: ({ label }: { label: string }) => (
    <div data-testid="homework-due-date-time-picker">{label}</div>
  ),
}));

vi.mock("@/features/academics/academic-structure-tree/services/structureService", () => ({
  fetchStructureTree: vi.fn().mockResolvedValue({
    stages: [{ id: "stage-1", name: "Stage", nameAr: "مرحلة", nameEn: "Stage", order: 1 }],
    grades: [{ id: "grade-1", name: "Grade", nameAr: "صف", nameEn: "Grade", stageId: "stage-1", capacity: 30, order: 1 }],
    sections: [{ id: "section-1", name: "Section", nameAr: "شعبة", nameEn: "Section", gradeId: "grade-1", capacity: 30, order: 1 }],
    classrooms: [{ id: "classroom-1", name: "Room", nameAr: "فصل", nameEn: "Room", sectionId: "section-1", capacity: 30, order: 1 }],
  }),
}));

vi.mock("@/features/academics/subjects/services/subjectsService", () => ({
  fetchSubjects: vi.fn().mockResolvedValue([
    { id: "subject-1", name: "Math", nameAr: "رياضيات", nameEn: "Math", code: null, color: null, isActive: true },
  ]),
}));

vi.mock("@/features/academics/teacher-allocation/services/teacherAllocationService", () => ({
  fetchTeachers: vi.fn().mockResolvedValue([
    { id: "teacher-1", nameAr: "معلم", nameEn: "Teacher", isActive: true },
  ]),
  fetchTeacherAllocations: vi.fn().mockResolvedValue([
    { id: "allocation-1", termId: "term-1", sectionId: "section-1", classroomId: "classroom-1", subjectId: "subject-1", teacherId: "teacher-1" },
  ]),
}));

vi.mock("@/features/students-guardians/enrollments/services/enrollmentsApiService", () => ({
  fetchEnrollments: vi.fn().mockResolvedValue([
    { id: "enrollment-1", enrollmentId: "enrollment-1", studentId: "student-1", classroomId: "classroom-1", status: "active" },
  ]),
}));

vi.mock("@/features/students-guardians/students/services/studentsService", () => ({
  fetchAllStudents: vi.fn().mockResolvedValue([
    { id: "student-1", student_id: "S-1", full_name_en: "Student One", full_name_ar: "طالب" },
  ]),
}));

vi.mock("@/features/academics/timetable/services/timetableApiAdapter", () => ({
  getDashboardTimetable: vi.fn().mockResolvedValue({ entries: [] }),
}));

vi.mock("@/features/academics/lesson-plans/services/lessonPlanTimetable", () => ({
  dashboardDaysForScope: () => [],
}));

vi.mock("../../services/homeworkService", () => ({
  createHomeworkAssignment: vi.fn(),
}));

describe("CreateHomeworkPage assignment contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createHomeworkAssignment).mockResolvedValue({ id: "homework-1" } as never);
  });

  it("blocks invalid input and submits a normalized valid boundary request", async () => {
    render(<CreateHomeworkPage />);

    const allocation = await screen.findByLabelText("fields.teacherSubjectAllocation");
    fireEvent.change(allocation, { target: { value: "allocation-1" } });
    await waitFor(() => expect(fetchEnrollments).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: "actions.createDraft" }));
    expect(createHomeworkAssignment).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/fields\.title/), {
      target: { value: "  Practice  " },
    });
    fireEvent.change(screen.getByLabelText("fields.totalMarks"), {
      target: { value: "0.01" },
    });
    fireEvent.change(screen.getByLabelText("fields.estimatedMinutes"), {
      target: { value: "1" },
    });
    fireEvent.change(screen.getByLabelText("fields.description"), {
      target: { value: "  Boundary description  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "actions.createDraft" }));

    await waitFor(() => expect(createHomeworkAssignment).toHaveBeenCalledTimes(1));
    expect(createHomeworkAssignment).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Practice",
        description: "Boundary description",
        totalMarks: 0.01,
        estimatedMinutes: 1,
      }),
    );
  });

  it("uses a date-time control for the homework deadline", async () => {
    render(<CreateHomeworkPage />);

    expect(
      await screen.findByTestId("homework-due-date-time-picker"),
    ).toHaveTextContent("fields.dueAt");
  });
});
