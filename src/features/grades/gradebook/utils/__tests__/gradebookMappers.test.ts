import { describe, expect, it } from "vitest";
import {
  mapBackendAssessmentToAssessment,
  mapBackendColumnToAssessment,
  mapGradebookResponseToUi,
} from "../gradebookMappers";


describe("gradebook assessment contract mappers", () => {
  it.each([
    ["QUESTION_BASED"],
    ["question_based"],
  ])("maps backend %s delivery mode to question-based", (deliveryMode) => {
    const assessment = mapBackendAssessmentToAssessment({
      id: "assessment-1",
      deliveryMode,
      titleEn: "Question exam",
      titleAr: "Question exam",
    });

    expect(assessment.deliveryMode).toBe("QUESTION_BASED");
  });

  it.each([
    ["SCORE_ONLY"],
    ["score_only"],
    [undefined],
  ])("maps backend %s delivery mode to score-only", (deliveryMode) => {
    const assessment = mapBackendColumnToAssessment({
      id: "column-1",
      assessmentId: "assessment-1",
      deliveryMode,
      titleEn: "Score exam",
      titleAr: "Score exam",
    });

    expect(assessment.deliveryMode).toBe("SCORE_ONLY");
  });

  it("normalizes the backend school UUID to the synthetic whole-school option", () => {
    const assessment = mapBackendAssessmentToAssessment({
      id: "assessment-1",
      scopeType: "school",
      scopeId: "school-uuid",
      titleEn: "School exam",
      titleAr: "School exam",
    });

    expect(assessment.scopeId).toBe("");
  });

  it("preserves non-school scope IDs", () => {
    const assessment = mapBackendAssessmentToAssessment({
      id: "assessment-1",
      scopeType: "grade",
      scopeId: "grade-uuid",
      titleEn: "Grade exam",
      titleAr: "Grade exam",
    });

    expect(assessment.scopeId).toBe("grade-uuid");
  });

  it("preserves assessment academic and hierarchy identifiers", () => {
    const assessment = mapBackendAssessmentToAssessment({
      id: "assessment-1",
      academicYearId: "year-1",
      termId: "term-1",
      subjectId: "subject-1",
      scopeType: "classroom",
      scopeKey: "classroom:classroom-1",
      scopeId: "classroom-1",
      stageId: "stage-1",
      gradeId: "grade-1",
      sectionId: "section-1",
      classroomId: "classroom-1",
    });

    expect(assessment).toEqual(
      expect.objectContaining({
        academicYearId: "year-1",
        scopeKey: "classroom:classroom-1",
        stageId: "stage-1",
        gradeId: "grade-1",
      }),
    );
  });

  it("preserves gradebook row, cell, summary, context, and rule details", () => {
    const gradebook = mapGradebookResponseToUi({
      academicYearId: "year-1",
      yearId: "legacy-year-1",
      termId: "term-1",
      subjectId: "subject-1",
      scope: { type: "classroom", id: "classroom-1" },
      rule: { ruleId: "rule-1", source: "scope", passMark: 60, gradingScale: "percentage", rounding: "decimal_1" },
      columns: [{
        id: "column-1",
        assessmentId: "assessment-1",
        stageId: "stage-1",
        gradeId: "grade-1",
        maxScore: 20,
      }],
      rows: [{
        studentId: "student-1",
        enrollmentId: "enrollment-1",
        student: { id: "student-1", nameEn: "Ada", nameAr: "آدا", code: "S-1", admissionNo: "A-1" },
        finalPercent: 75,
        completedWeight: 30,
        totalEnteredCount: 1,
        missingCount: 2,
        absentCount: 1,
        cells: [{ assessmentId: "assessment-1", itemId: "item-1", score: 15, status: "entered", percent: 75, weightedContribution: 12, comment: "Good work", isVirtualMissing: true }],
      }],
      summary: { studentCount: 1, assessmentCount: 1, averagePercent: 75, passingCount: 1, failingCount: 0, incompleteCount: 0 },
    });

    expect(gradebook.assessments[0]).toEqual(expect.objectContaining({ stageId: "stage-1", gradeId: "grade-1" }));
    expect(gradebook.rows[0]).toEqual(expect.objectContaining({
      enrollmentId: "enrollment-1",
      studentCode: "S-1",
      admissionNo: "A-1",
      completedWeight: 30,
      missingCount: 2,
      absentCount: 1,
      cellDetailsByAssessmentId: {
        "assessment-1": {
          itemId: "item-1",
          percent: 75,
          weightedContribution: 12,
          comment: "Good work",
          isVirtualMissing: true,
        },
      },
    }));
    expect(gradebook.summary).toEqual(expect.objectContaining({ passingCount: 1, failingCount: 0, incompleteCount: 0 }));
    expect(gradebook.context).toEqual(expect.objectContaining({ academicYearId: "year-1", yearId: "legacy-year-1", termId: "term-1", subjectId: "subject-1" }));
    expect(gradebook.rule).toEqual(expect.objectContaining({ id: "rule-1", passMark: 60, rounding: "decimal_1" }));
  });

});
