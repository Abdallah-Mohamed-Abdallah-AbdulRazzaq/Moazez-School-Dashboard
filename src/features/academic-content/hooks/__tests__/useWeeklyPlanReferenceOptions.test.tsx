import { useState } from "react";
import { fireEvent, render, renderHook, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { HomeworkAssignmentUiModel } from "@/features/academics/homework/services/homeworkApi.types";
import type { Assessment } from "@/features/grades/shared/types";
import { ReferenceChecklist } from "../../components/editor/details/AcademicReferenceFields";
import { useWeeklyPlanReferenceOptions } from "../useWeeklyPlanReferenceOptions";
import { withAssessmentReferenceNames } from "../../services/academicContentAssessmentReference";
import { referenceTargetOptions } from "../../services/__tests__/academicContentReferenceScope.fixture";

const homework: HomeworkAssignmentUiModel = {
  id: "homework-1", title: "Fractions", mode: "homework", status: "published",
  targetMode: "classroom", totalMarks: 0, isGraded: true, questionCount: 2,
  attachmentCount: 0, subjectName: "Mathematics", classroomName: "4A",
  teacherName: "Ahmed", dueAt: "2026-10-15T12:00:00Z",
};
const assessment: Assessment = {
  id: "assessment-1", termId: "term-1", subjectId: "subject-1",
  scopeType: "classroom", scopeId: "class-1", title: "Fractions",
  titleAr: "الكسور", type: "QUIZ", deliveryMode: "SCORE_ONLY",
  date: "2026-10-16", weight: 10, maxScore: 20, expectedTimeMinutes: 30,
  isLocked: false, approvalStatus: "draft",
};
const assessmentContext = {
  ...referenceTargetOptions,
  subjects: [{ id: "subject-1", name: "Mathematics", nameEn: "Mathematics", nameAr: "الرياضيات", code: "MATH", color: null, isActive: true }],
};

function ReferenceOptions({ sparse = false }: { sparse?: boolean }) {
  const [selected, setSelected] = useState<string[]>([]);
  const options = useWeeklyPlanReferenceOptions({
    homeworkAssignments: [sparse ? { ...homework, subjectName: undefined,
      classroomName: undefined, teacherName: undefined, dueAt: undefined,
      isGraded: false } : homework],
    assessments: [withAssessmentReferenceNames(assessment, assessmentContext)],
  });
  return <ReferenceChecklist label="References" values={selected}
    options={[...options.homeworkAssignments, ...options.assessments]}
    disabled={false} onChange={setSelected} />;
}

describe("weekly plan reference details", () => {
  it("offers draft and published homework and includes approved assessments", () => {
    const homeworkStatuses: HomeworkAssignmentUiModel["status"][] = [
      "draft", "published", "closed", "cancelled", "archived",
    ];
    const assessmentStatuses: Assessment["approvalStatus"][] = [
      "draft", "published", "approved",
    ];
    const { result } = renderHook(() => useWeeklyPlanReferenceOptions({
      homeworkAssignments: homeworkStatuses.map((status) => ({
        ...homework, id: `homework-${status}`, status,
      })),
      assessments: assessmentStatuses.map((approvalStatus) => ({
        ...assessment, id: `assessment-${approvalStatus}`, approvalStatus,
      })),
    }));
    expect(result.current.homeworkAssignments.map(({ value }) => value)).toEqual([
      "homework-draft", "homework-published",
    ]);
    expect(result.current.assessments.map(({ value }) => value)).toEqual([
      "assessment-draft", "assessment-published", "assessment-approved",
    ]);
  });

  it("distinguishes homework and assessments with the same title while keeping selection usable", () => {
    render(<ReferenceOptions />);
    const [homeworkCheckbox, assessmentCheckbox] = screen.getAllByRole("checkbox", { name: "Fractions" });
    expect(homeworkCheckbox).toHaveAccessibleDescription(
      "Subject: Mathematics · Class: 4A · Teacher: Ahmed · Due: Oct 15, 2026 · Status: Published · Maximum marks: 0",
    );
    expect(assessmentCheckbox).toHaveAccessibleDescription(
      "Subject: Mathematics · Academic scope: Classroom: Stage 1 / Grade 1 / Section 1 / Class 1 · Type: Quiz · Date: Oct 16, 2026 · Status: Draft · Maximum marks: 20 · Duration (minutes): 30 · Weight: 10% · Grading method: Scores only · Grading: Unlocked",
    );
    fireEvent.click(assessmentCheckbox);
    expect(assessmentCheckbox).toBeChecked();
    expect(homeworkCheckbox).not.toBeChecked();
  });

  it("omits missing homework fields and ungraded marks without exposing identifiers", () => {
    render(<ReferenceOptions sparse />);
    expect(screen.getAllByRole("checkbox", { name: "Fractions" })[0]).toHaveAccessibleDescription("Status: Published");
    expect(screen.queryByText(/homework-1|subject-1|classroom-1/)).not.toBeInTheDocument();
  });

  it.each([
    ["school", "school-1", "Whole school"],
    ["stage", "stage-1", "Stage: Stage 1"],
    ["grade", "grade-1", "Grade: Stage 1 / Grade 1"],
    ["section", "section-1", "Section: Stage 1 / Grade 1 / Section 1"],
    ["classroom", "class-1", "Classroom: Stage 1 / Grade 1 / Section 1 / Class 1"],
  ] as const)("shows the named academic scope for a %s assessment", (scopeType, scopeId, expectedScope) => {
    const { result } = renderHook(() => useWeeklyPlanReferenceOptions({
      homeworkAssignments: [],
      assessments: [withAssessmentReferenceNames({ ...assessment, scopeType, scopeId }, assessmentContext)],
    }));
    expect(result.current.assessments[0].description).toContain(`Academic scope: ${expectedScope}`);
  });
});
