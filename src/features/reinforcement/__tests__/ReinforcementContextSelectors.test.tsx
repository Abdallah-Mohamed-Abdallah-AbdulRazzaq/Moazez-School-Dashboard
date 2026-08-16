import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ReinforcementAcademicContextFilter from "@/features/reinforcement/components/ReinforcementAcademicContextFilter";
import ReinforcementTaskTargetSelector from "@/features/reinforcement/components/ReinforcementTaskTargetSelector";

const academicMocks = vi.hoisted(() => ({
  fetchAcademicYears: vi.fn(),
  fetchTerms: vi.fn(),
  fetchAcademicStructureTree: vi.fn(),
}));

const subjectMocks = vi.hoisted(() => ({
  fetchSubjectAllocations: vi.fn(),
}));

const studentMocks = vi.hoisted(() => ({
  fetchStudentsWithEnrollmentForContext: vi.fn(),
}));

const filterOptionMocks = vi.hoisted(() => ({
  getReinforcementFilterOptions: vi.fn(),
}));

vi.mock("@/features/academics/services/academicStructureApiService", () => ({
  fetchAcademicYears: academicMocks.fetchAcademicYears,
  fetchTerms: academicMocks.fetchTerms,
  fetchAcademicStructureTree: academicMocks.fetchAcademicStructureTree,
}));

vi.mock("@/features/academics/subjects/services/subjectsService", () => ({
  fetchSubjectAllocations: subjectMocks.fetchSubjectAllocations,
}));

vi.mock("@/features/students-guardians/students/services/studentsService", () => ({
  fetchStudentsWithEnrollmentForContext:
    studentMocks.fetchStudentsWithEnrollmentForContext,
}));

vi.mock("@/features/reinforcement/services/reinforcementFilterOptionsService", () => ({
  getReinforcementFilterOptions: filterOptionMocks.getReinforcementFilterOptions,
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    user: {
      activeMembership: {
        schoolId: "school-1",
      },
    },
  }),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
}));

const structureTree = {
  stages: [{ id: "stage-1", nameEn: "Primary", nameAr: "ابتدائي" }],
  grades: [
    {
      id: "grade-1",
      stageId: "stage-1",
      nameEn: "Grade 1",
      nameAr: "الصف الأول",
    },
  ],
  sections: [
    {
      id: "section-1",
      gradeId: "grade-1",
      nameEn: "Section A",
      nameAr: "شعبة أ",
    },
  ],
  classrooms: [
    {
      id: "classroom-1",
      sectionId: "section-1",
      nameEn: "Classroom 101",
      nameAr: "فصل 101",
    },
  ],
};

const students = [
  {
    id: "student-1",
    student_id: "STU-1",
    full_name_en: "Ahmed Hassan",
    full_name_ar: "أحمد حسن",
    name: "Ahmed Hassan",
    gender: "Male",
    dateOfBirth: "2015-01-01",
    nationality: "SA",
    gradeRequested: "Grade 1",
    submittedDate: "2026-05-14",
    created_at: "2026-05-14",
    contact: {},
    status: "Active",
    enrollment: {
      id: "enrollment-1",
      enrollmentId: "enrollment-1",
      studentId: "student-1",
      academicYear: "2026",
      grade: "Grade 1",
      section: "A",
      enrollmentDate: "2026-05-14",
      status: "Active",
    },
  },
];

describe("Reinforcement context selector components", () => {
  beforeEach(() => {
    academicMocks.fetchAcademicYears.mockReset().mockResolvedValue([
      { id: "year-1", nameEn: "2026" },
    ]);
    academicMocks.fetchTerms.mockReset().mockResolvedValue([
      { id: "term-1", nameEn: "Term 1", yearId: "year-1" },
    ]);
    academicMocks.fetchAcademicStructureTree.mockReset().mockResolvedValue(
      structureTree,
    );
    subjectMocks.fetchSubjectAllocations.mockReset().mockResolvedValue([
      {
        id: "allocation-1",
        termId: "term-1",
        gradeId: "grade-1",
        subjectId: "subject-1",
        weeklyHours: 4,
        subject: {
          id: "subject-1",
          nameEn: "Math",
          nameAr: "Math AR",
          code: "MATH",
          color: null,
        },
      },
    ]);
    studentMocks.fetchStudentsWithEnrollmentForContext
      .mockReset()
      .mockResolvedValue(students);
    filterOptionMocks.getReinforcementFilterOptions.mockReset().mockResolvedValue({
      academicYears: [{ id: "year-1", nameEn: "2026" }],
      terms: [{ id: "term-1", nameEn: "Term 1", academicYearId: "year-1" }],
      subjects: [{ id: "subject-1", termId: "term-1", nameEn: "Math", nameAr: "رياضيات" }],
      students,
      ...structureTree,
      scopeTargets: {
        student: [
          {
            value: "student-1",
            scopeType: "student",
            nameEn: "Ahmed Hassan",
            nameAr: "أحمد حسن",
            enrollmentId: "enrollment-1",
          },
        ],
      },
    });
  });

  it("renders academic, structure, subject, and student selectors", async () => {
    render(
      <ReinforcementAcademicContextFilter
        value={{ academicYearId: "year-1", termId: "term-1" }}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Academic year")).toBeInTheDocument();
    expect(screen.getByText("Term")).toBeInTheDocument();
    expect(screen.getByText("Stage")).toBeInTheDocument();
    expect(screen.getByText("Grade")).toBeInTheDocument();
    expect(screen.getByText("Section")).toBeInTheDocument();
    expect(screen.getByText("Classroom")).toBeInTheDocument();
    expect(screen.getByText("Subject")).toBeInTheDocument();
    expect(screen.getAllByText("Student").length).toBeGreaterThan(0);

    await waitFor(() => {
      expect(filterOptionMocks.getReinforcementFilterOptions).toHaveBeenCalledWith({
        academicYearId: "year-1",
        termId: "term-1",
      });
      expect(academicMocks.fetchAcademicStructureTree).not.toHaveBeenCalled();
      expect(subjectMocks.fetchSubjectAllocations).toHaveBeenCalledWith("term-1");
      expect(studentMocks.fetchStudentsWithEnrollmentForContext).not.toHaveBeenCalled();
    });
  });

  it("renders task target selector with student as the default scope", async () => {
    render(
      <ReinforcementTaskTargetSelector
        academicYearId="year-1"
        termId="term-1"
        value={[]}
        onChange={vi.fn()}
      />,
    );

    expect(await screen.findByText("Target scope")).toBeInTheDocument();
    expect(screen.getByText("Stage")).toBeInTheDocument();
    expect(screen.getAllByText("Student").length).toBeGreaterThan(0);
    expect(screen.getByText("No targets selected yet.")).toBeInTheDocument();

    await waitFor(() => {
      expect(filterOptionMocks.getReinforcementFilterOptions).toHaveBeenCalledWith({
        academicYearId: "year-1",
        termId: "term-1",
      });
      expect(academicMocks.fetchAcademicStructureTree).not.toHaveBeenCalled();
      expect(studentMocks.fetchStudentsWithEnrollmentForContext).not.toHaveBeenCalled();
    });
  });

  it("prevents duplicate task targets in the selector", async () => {
    const user = userEvent.setup();

    render(
      <ReinforcementTaskTargetSelector
        academicYearId="year-1"
        termId="term-1"
        value={[
          {
            scopeType: "student",
            scopeId: "student-1",
            label: "Ahmed Hassan",
            enrollmentId: "enrollment-1",
          },
        ]}
        onChange={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(filterOptionMocks.getReinforcementFilterOptions).toHaveBeenCalled();
    });

    await user.click(screen.getByRole("button", { name: "Stage" }));
    await user.click(await screen.findByText("Primary"));
    await user.click(screen.getByRole("button", { name: "Grade" }));
    await user.click(await screen.findByText("Grade 1"));
    await user.click(screen.getByRole("button", { name: "Section" }));
    await user.click(await screen.findByText("Section A"));
    await user.click(screen.getByRole("button", { name: "Classroom" }));
    await user.click(await screen.findByText("Classroom 101"));
    await user.click(screen.getByRole("button", { name: "Student" }));
    await user.click(await screen.findByText("Ahmed Hassan"));
    await user.click(screen.getByRole("button", { name: /Add target/i }));

    expect((await screen.findAllByText("This target is already selected.")).length).toBeGreaterThan(0);
  });
});
