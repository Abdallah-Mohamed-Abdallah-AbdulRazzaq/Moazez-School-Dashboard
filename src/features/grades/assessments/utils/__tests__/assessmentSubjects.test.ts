import { describe, expect, it } from "vitest";
import { getEligibleAssessmentSubjects } from "../assessmentSubjects";

const subjects = [
  { id: "arabic", name: "Arabic", nameAr: "العربية", nameEn: "Arabic" },
  { id: "math", name: "Mathematics", nameAr: "الرياضيات", nameEn: "Mathematics" },
];

const scopeEntities = {
  school: [],
  stage: [{ id: "stage-1", name: "Stage", nameAr: "مرحلة", nameEn: "Stage", scopeType: "stage" as const }],
  grade: [{ id: "grade-1", name: "Grade 1", nameAr: "الأول", nameEn: "Grade 1", scopeType: "grade" as const, parentId: "stage-1" }],
  section: [{ id: "section-1", name: "Section A", nameAr: "أ", nameEn: "Section A", scopeType: "section" as const, parentId: "grade-1" }],
  classroom: [{ id: "classroom-1", name: "Room 1", nameAr: "فصل 1", nameEn: "Room 1", scopeType: "classroom" as const, parentId: "section-1" }],
};

describe("getEligibleAssessmentSubjects", () => {
  it("limits a classroom assessment to subjects allocated to its parent grade", () => {
    expect(
      getEligibleAssessmentSubjects(
        subjects,
        [{ gradeId: "grade-1", subjectId: "arabic", weeklyHours: 4 }],
        scopeEntities,
        "classroom",
        "classroom-1",
      ),
    ).toEqual([subjects[0]]);
  });
});
