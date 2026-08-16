import { describe, expect, it } from "vitest";
import { buildLessonPlansMissingDataHref } from "../lessonPlansMissingData";

const scope = {
  academicYearId: "year-1",
  termId: "term-1",
  stageId: "stage-1",
  gradeId: "grade-1",
  sectionId: "section-1",
  classroomId: "classroom-1",
  subjectId: "subject-1",
};

describe("lesson plans missing-data routes", () => {
  it.each([
    [
      "missing-grade",
      "/en/academics/structure?year=year-1&term=term-1&nodeType=stage&nodeId=stage-1",
    ],
    [
      "missing-section",
      "/en/academics/structure?year=year-1&term=term-1&nodeType=grade&nodeId=grade-1",
    ],
    [
      "missing-classroom",
      "/en/academics/structure?year=year-1&term=term-1&nodeType=section&nodeId=section-1",
    ],
    [
      "missing-subject",
      "/en/academics/subjects?year=year-1&term=term-1&tab=subjects",
    ],
    [
      "missing-teacher-allocation",
      "/en/academics/teacher-allocation?year=year-1&term=term-1&tab=matrix&grade=grade-1&section=section-1&classroom=classroom-1&subject=subject-1",
    ],
    [
      "missing-curriculum",
      "/en/academics/curriculum?year=year-1&term=term-1&filterGrade=grade-1&filterSubject=subject-1",
    ],
    [
      "no-curriculum-lessons",
      "/en/academics/curriculum?year=year-1&term=term-1&filterGrade=grade-1&filterSubject=subject-1",
    ],
    [
      "missing-timetable-slots",
      "/en/academics/timetable?year=year-1&term=term-1&grade=grade-1&section=section-1&classroom=classroom-1",
    ],
  ] as const)("builds the %s destination", (status, expected) => {
    expect(buildLessonPlansMissingDataHref(status, "en", scope)).toBe(expected);
  });

  it("omits unavailable optional scope parameters", () => {
    expect(
      buildLessonPlansMissingDataHref("missing-teacher-allocation", "ar", {
        academicYearId: "year-1",
        termId: "term-1",
        gradeId: "grade-1",
      }),
    ).toBe(
      "/ar/academics/teacher-allocation?year=year-1&term=term-1&tab=matrix&grade=grade-1",
    );
  });
});
