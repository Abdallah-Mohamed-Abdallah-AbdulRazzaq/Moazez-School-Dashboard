import { describe, expect, it } from "vitest";
import type { SubjectAllocation } from "@/features/academics/subjects/services/subjectsService";
import { subjectsForLessonPlanGrade } from "../useLessonPlansFilters";

const subjects = [
  {
    id: "subject-math",
    name: "Math",
    nameAr: "Math AR",
    nameEn: "Math",
    isActive: true,
  },
  {
    id: "subject-science",
    name: "Science",
    nameAr: "Science AR",
    nameEn: "Science",
    isActive: true,
  },
];

const subjectAllocations: SubjectAllocation[] = [
  { gradeId: "grade-1", subjectId: "subject-math", weeklyHours: 5 },
  { gradeId: "grade-2", subjectId: "subject-science", weeklyHours: 4 },
];

describe("subjectsForLessonPlanGrade", () => {
  it("returns subjects with weekly-hours allocations for the selected grade", () => {
    expect(
      subjectsForLessonPlanGrade({
        subjects,
        subjectAllocations,
        gradeId: "grade-1",
      }).map((subject) => subject.id),
    ).toEqual(["subject-math"]);
  });

  it("keeps the current subject visible if the URL still points at it", () => {
    expect(
      subjectsForLessonPlanGrade({
        subjects,
        subjectAllocations,
        gradeId: "grade-1",
        currentSubjectId: "subject-science",
      }).map((subject) => subject.id),
    ).toEqual(["subject-math", "subject-science"]);
  });
});
