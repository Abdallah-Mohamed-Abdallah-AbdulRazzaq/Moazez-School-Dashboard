import { describe, expect, it } from "vitest";
import { mapBackendAssessmentToAssessment, mapBackendColumnToAssessment } from "../gradebookMappers";

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
});
