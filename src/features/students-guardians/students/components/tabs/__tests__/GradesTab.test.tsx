import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import GradesTab from "../GradesTab";
import { fetchStudentGradesSnapshot } from "@/features/grades/overview/services/gradesOverviewService";
import type { Student } from "@/features/students-guardians/students/types";
import { ApiError } from "@/lib/api-error";

// Mock next-intl
vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

// Mock fetchStudentGradesSnapshot service
vi.mock("@/features/grades/overview/services/gradesOverviewService", () => ({
  fetchStudentGradesSnapshot: vi.fn(),
}));

// Mock @mui/x-charts/LineChart to simplify component rendering
vi.mock("@mui/x-charts/LineChart", () => ({
  LineChart: () => <div data-testid="line-chart" />,
}));

const mockStudent: Student = {
  id: "student-123",
  student_id: "STU-123",
  first_name_en: "John",
  last_name_en: "Doe",
  status: "active",
} as unknown as Student;

describe("GradesTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders missing_term_context when academicYearId is missing", () => {
    render(<GradesTab student={mockStudent} termId="term-1" />);

    expect(screen.getByText("missing_term_context")).toBeInTheDocument();
    expect(fetchStudentGradesSnapshot).not.toHaveBeenCalled();
  });

  it("renders missing_term_context when termId is missing", () => {
    render(<GradesTab student={mockStudent} academicYearId="year-2026" />);

    expect(screen.getByText("missing_term_context")).toBeInTheDocument();
    expect(fetchStudentGradesSnapshot).not.toHaveBeenCalled();
  });

  it("shows a content skeleton instead of a spinner while tab data loads", () => {
    vi.mocked(fetchStudentGradesSnapshot).mockImplementation(
      () => new Promise(() => undefined),
    );

    render(
      <GradesTab
        student={mockStudent}
        academicYearId="year-2026"
        termId="term-1"
      />,
    );

    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("fetches snapshot when academicYearId and termId are provided", async () => {
    vi.mocked(fetchStudentGradesSnapshot).mockResolvedValue({
      studentId: "student-123",
      currentAverage: 92.5,
      highestAverage: 98.0,
      lowestAverage: 85.0,
      totalAssessments: 12,
      performanceTrend: [{ label: "P1", average: 92.5 }],
      subjectRows: [
        {
          subjectId: "math",
          subjectName: "Mathematics",
          subjectNameAr: "الرياضيات",
          average: 95.0,
          lastAssessmentScore: 94.0,
          assessmentsCount: 4,
          trend: "up",
        },
      ],
    });

    render(
      <GradesTab
        student={mockStudent}
        academicYearId="year-2026"
        termId="term-1"
      />
    );

    await waitFor(() => {
      expect(fetchStudentGradesSnapshot).toHaveBeenCalledWith("student-123", {
        academicYearId: "year-2026",
        termId: "term-1",
      });
    });

    expect(await screen.findByText("92.5%")).toBeInTheDocument();
  });

  it("renders '--' for term average KPI when currentAverage is null", async () => {
    vi.mocked(fetchStudentGradesSnapshot).mockResolvedValue({
      studentId: "student-123",
      currentAverage: null,
      highestAverage: 0,
      lowestAverage: 0,
      totalAssessments: 0,
      performanceTrend: [],
      subjectRows: [
        {
          subjectId: "math",
          subjectName: "Mathematics",
          subjectNameAr: "الرياضيات",
          average: null,
          lastAssessmentScore: null,
          assessmentsCount: 0,
          trend: "stable",
        },
      ],
    });

    render(
      <GradesTab
        student={mockStudent}
        academicYearId="year-2026"
        termId="term-1"
      />
    );

    const dashes = await screen.findAllByText("--");
    expect(dashes.length).toBeGreaterThan(0);
  });

  it("renders rule card, status badge, completed weight progress, enhanced subject table, and assessments table", async () => {
    vi.mocked(fetchStudentGradesSnapshot).mockResolvedValue({
      studentId: "student-123",
      currentAverage: 88.5,
      highestAverage: 95.0,
      lowestAverage: 82.0,
      totalAssessments: 2,
      completedWeight: 75,
      status: "PASS",
      rule: {
        source: "school",
        ruleId: "r-1",
        passMark: 60,
        rounding: "decimal_1",
        gradingScale: "percentage",
      },
      performanceTrend: [{ label: "A1", average: 88.5 }],
      subjectRows: [
        {
          subjectId: "math",
          subjectName: "Mathematics",
          subjectNameAr: "الرياضيات",
          subjectNameEn: "Mathematics",
          average: 88.5,
          lastAssessmentScore: 90.0,
          assessmentsCount: 2,
          enteredCount: 1,
          missingCount: 1,
          absentCount: 0,
          completedWeight: 75,
          status: "PASS",
          trend: "up",
        },
      ],
      assessments: [
        {
          assessmentId: "a-1",
          subjectId: "math",
          title: "Quiz 1",
          titleEn: "Quiz 1",
          titleAr: "اختبار 1",
          type: "QUIZ",
          date: "2026-03-01",
          weight: 20,
          maxScore: 100,
          itemId: "item-1",
          score: 90,
          percent: 90,
          weightedContribution: 18,
          status: "entered",
          comment: null,
          isVirtualMissing: false,
        },
        {
          assessmentId: "a-2",
          subjectId: "math",
          title: null,
          titleEn: null,
          titleAr: null,
          type: "MIDTERM",
          date: "2026-04-15",
          weight: 30,
          maxScore: 100,
          itemId: null,
          score: null,
          percent: null,
          weightedContribution: null,
          status: "missing",
          comment: null,
          isVirtualMissing: true,
        },
      ],
    });

    render(
      <GradesTab
        student={mockStudent}
        academicYearId="year-2026"
        termId="term-1"
      />
    );

    // Verify rule info card and status badge
    expect(await screen.findByText("rule_info")).toBeInTheDocument();
    expect(screen.getAllByText("PASS").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("school")).toBeInTheDocument();
    expect(screen.getByText("60%")).toBeInTheDocument();
    expect(screen.getByText("percentage")).toBeInTheDocument();

    // Verify completed weight KPI & progress bar
    expect(screen.getByText("completed_weight")).toBeInTheDocument();
    expect(screen.getAllByText("75%").length).toBeGreaterThanOrEqual(1);

    // Verify enhanced subject table headers/data
    expect(screen.getByText("col_completed_weight")).toBeInTheDocument();
    expect(screen.getByText("col_entered")).toBeInTheDocument();
    expect(screen.getByText("col_missing")).toBeInTheDocument();
    expect(screen.getByText("col_absent")).toBeInTheDocument();
    expect(screen.getByText("1/2")).toBeInTheDocument();

    // Verify assessments table
    expect(screen.getByText("assessments_title")).toBeInTheDocument();
    expect(screen.getByText("Quiz 1")).toBeInTheDocument();
    expect(screen.getByText("MIDTERM — 2026-04-15")).toBeInTheDocument();
    expect(screen.getByText("pending_tag")).toBeInTheDocument();
  });

  it("renders the missing-enrollment state for the production not_found response", async () => {
    vi.mocked(fetchStudentGradesSnapshot).mockRejectedValue(
      new ApiError(
        "Student enrollment not found",
        404,
        "not_found",
        undefined,
        {
          studentId: "student-123",
          academicYearId: "year-2026",
          termId: "term-1",
        },
        "trace-1",
      ),
    );

    render(
      <GradesTab
        student={mockStudent}
        academicYearId="year-2026"
        termId="term-1"
      />
    );

    expect(await screen.findByText("title")).toBeInTheDocument();
    expect(screen.getByText("description")).toBeInTheDocument();
    expect(screen.queryByText("Student enrollment not found")).not.toBeInTheDocument();
  });

  it("renders custom error message on generic fetch error", async () => {
    vi.mocked(fetchStudentGradesSnapshot).mockRejectedValue(
      new Error("Database connection error")
    );

    render(
      <GradesTab
        student={mockStudent}
        academicYearId="year-2026"
        termId="term-1"
      />
    );

    expect(await screen.findByText("Database connection error")).toBeInTheDocument();
  });
});
