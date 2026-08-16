import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { LessonPlansMissingDataStatus } from "../lessonPlansMissingData";
import LessonPlansMissingDataCta from "../LessonPlansMissingDataCta";

const scope = {
  academicYearId: "year-1",
  termId: "term-1",
  stageId: "stage-1",
  gradeId: "grade-1",
  sectionId: "section-1",
  classroomId: "classroom-1",
  subjectId: "subject-1",
};

describe("LessonPlansMissingDataCta", () => {
  it.each([
    [
      "missing-grade",
      "ctas.academicStructure",
      "/en/academics/structure?year=year-1&term=term-1&nodeType=stage&nodeId=stage-1",
    ],
    [
      "missing-section",
      "ctas.academicStructure",
      "/en/academics/structure?year=year-1&term=term-1&nodeType=grade&nodeId=grade-1",
    ],
    [
      "missing-classroom",
      "ctas.academicStructure",
      "/en/academics/structure?year=year-1&term=term-1&nodeType=section&nodeId=section-1",
    ],
    [
      "missing-subject",
      "ctas.subjects",
      "/en/academics/subjects?year=year-1&term=term-1&tab=subjects",
    ],
    [
      "missing-teacher-allocation",
      "ctas.teacherAllocation",
      "/en/academics/teacher-allocation?year=year-1&term=term-1&tab=matrix&grade=grade-1&section=section-1&classroom=classroom-1&subject=subject-1",
    ],
    [
      "missing-curriculum",
      "ctas.curriculum",
      "/en/academics/curriculum?year=year-1&term=term-1&filterGrade=grade-1&filterSubject=subject-1",
    ],
    [
      "no-curriculum-lessons",
      "ctas.curriculum",
      "/en/academics/curriculum?year=year-1&term=term-1&filterGrade=grade-1&filterSubject=subject-1",
    ],
    [
      "missing-timetable-slots",
      "ctas.timetable",
      "/en/academics/timetable?year=year-1&term=term-1&grade=grade-1&section=section-1&classroom=classroom-1",
    ],
  ] satisfies Array<[LessonPlansMissingDataStatus, string, string]>)(
    "navigates %s to its scoped setup page",
    async (status, label, href) => {
      const onNavigate = vi.fn();
      const user = userEvent.setup();
      render(
        <LessonPlansMissingDataCta
          status={status}
          locale="en"
          scope={scope}
          onNavigate={onNavigate}
        />,
      );

      await user.click(screen.getByRole("button", { name: label }));

      expect(onNavigate).toHaveBeenCalledWith(href);
    },
  );
});
