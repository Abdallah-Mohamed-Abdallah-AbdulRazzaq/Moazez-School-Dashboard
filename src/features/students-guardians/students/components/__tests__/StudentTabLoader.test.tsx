import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import StudentTabLoader from "../StudentTabLoader";
import * as studentsService from "@/features/students-guardians/students/services/studentsService";
import { StudentProfileProvider } from "../StudentProfileContext";
import { useStudentsGuardiansYearTermContext } from "@/features/students-guardians/shared/hooks/useStudentsGuardiansYearTermContext";
import type { Student } from "@/features/students-guardians/students/types";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  notFound: vi.fn(),
}));

// Mock next-intl
vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

// Mock studentsService
vi.mock("@/features/students-guardians/students/services/studentsService", () => ({
  fetchStudentById: vi.fn(),
}));

// Mock useStudentsGuardiansYearTermContext
vi.mock("@/features/students-guardians/shared/hooks/useStudentsGuardiansYearTermContext", () => ({
  useStudentsGuardiansYearTermContext: vi.fn(),
}));

// Mock GradesTab component to verify passed props
vi.mock("@/features/students-guardians/students/components/tabs/GradesTab", () => ({
  default: ({ student, academicYearId, termId }: { student: Student; academicYearId?: string; termId?: string }) => (
    <div data-testid="grades-tab">
      <span>Student: {student.id}</span>
      <span>Year: {academicYearId || "none"}</span>
      <span>Term: {termId || "none"}</span>
    </div>
  ),
}));

vi.mock("@/features/students-guardians/students/components/tabs/ReinforcementProgressTab", () => ({
  default: ({ studentId, academicYearId, termId }: { studentId: string; academicYearId?: string; termId?: string }) => (
    <div data-testid="reinforcement-progress-tab">
      {studentId}:{academicYearId}:{termId}
    </div>
  ),
}));

const mockStudent: Student = {
  id: "student-456",
  student_id: "STU-456",
  first_name_en: "Alice",
  last_name_en: "Smith",
  status: "active",
} as unknown as Student;

describe("StudentTabLoader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useStudentsGuardiansYearTermContext).mockReturnValue({
      yearId: "year-2026",
      termId: "term-1",
      academicYears: [],
      terms: [],
      termStatus: "open",
      isReadOnly: false,
      isLoading: false,
      error: null,
      setYearId: vi.fn(),
      setTermId: vi.fn(),
      setYearAndTerm: vi.fn(),
      refresh: vi.fn(),
    });
  });

  const renderTab = (tab: "grades" | "reinforcement") =>
    render(
      <StudentProfileProvider
        value={{ student: mockStudent, updateStudent: vi.fn() }}
      >
        <StudentTabLoader studentId="student-456" tab={tab} />
      </StudentProfileProvider>,
    );

  it("renders the grades tab from the profile context without refetching the student", () => {
    renderTab("grades");

    expect(screen.getByTestId("grades-tab")).toBeInTheDocument();
    expect(screen.getByText("Student: student-456")).toBeInTheDocument();
    expect(screen.getByText("Year: year-2026")).toBeInTheDocument();
    expect(screen.getByText("Term: term-1")).toBeInTheDocument();
    expect(studentsService.fetchStudentById).not.toHaveBeenCalled();
  });

  it("passes the student and academic context to the reinforcement progress tab", () => {
    renderTab("reinforcement");

    expect(screen.getByTestId("reinforcement-progress-tab")).toHaveTextContent(
      "student-456:year-2026:term-1",
    );
  });
});
