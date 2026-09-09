import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Assessment, GradebookStudentRow } from "../../shared/types";
import GradebookAssessmentView from "../GradebookAssessmentView";
import GradebookStudentView from "../GradebookStudentView";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

const lockedAssessment: Assessment = {
  id: "assessment-1",
  termId: "term-1",
  subjectId: "subject-1",
  scopeType: "classroom",
  scopeId: "classroom-1",
  title: "Locked assessment",
  titleAr: "تقييم مقفل",
  type: "QUIZ",
  deliveryMode: "QUESTION_BASED",
  date: "2026-09-09",
  weight: 20,
  maxScore: 10,
  isLocked: true,
  approvalStatus: "approved",
};

const studentRow: GradebookStudentRow = {
  studentId: "student-1",
  studentNameEn: "Student One",
  studentNameAr: "الطالب الأول",
  scoresByAssessmentId: { "assessment-1": null },
  statusByAssessmentId: { "assessment-1": "missing" },
  cellDetailsByAssessmentId: {},
  average: 0,
  completedWeight: null,
  completedItems: 0,
  totalItems: 1,
  missingCount: 1,
  absentCount: 0,
};

describe("locked assessment review actions", () => {
  it("locks review in the assessment gradebook view and explains why", () => {
    render(
      <GradebookAssessmentView
        rows={[studentRow]}
        assessments={[lockedAssessment]}
        onOpenGrade={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "table.openReview" })).toBeDisabled();
    expect(screen.getByText("workflow.reasons.locked")).toBeInTheDocument();
  });

  it("locks review in the student gradebook view and explains why", () => {
    render(
      <GradebookStudentView
        rows={[studentRow]}
        assessments={[lockedAssessment]}
        onOpenGrade={vi.fn()}
        pagination={{
          currentPage: 1,
          totalPages: 1,
          pageSize: 10,
          totalItems: 1,
          onPageChange: vi.fn(),
          onPageSizeChange: vi.fn(),
        }}
      />,
    );

    expect(screen.getByRole("button", { name: "table.openReview" })).toBeDisabled();
    expect(screen.getByText("workflow.reasons.locked")).toBeInTheDocument();
  });
});
