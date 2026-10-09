import { describe, expect, it } from "vitest";
import {
  emptyWeeklyPlanDetail,
  normalizeWeeklyPlanDetail,
  validateWeeklyPlanDetail,
} from "../weeklyPlanDetail";

describe("weeklyPlanDetail", () => {
  it("normalizes the complete replacement payload", () => {
    expect(
      normalizeWeeklyPlanDetail({
        weekStartDate: "2026-09-01",
        weekEndDate: "2026-09-07",
        objectives: ["  Compare planets  ", ""],
        topics: [" Solar system "],
        expectedHomework: "  Read chapter 1 ",
        upcomingAssessments: " ",
        notes: "  Bring models ",
        homeworkAssignmentIds: ["homework-1", "homework-1"],
        gradeAssessmentIds: ["assessment-1"],
      }),
    ).toEqual({
      weekStartDate: "2026-09-01",
      weekEndDate: "2026-09-07",
      objectives: ["Compare planets"],
      topics: ["Solar system"],
      expectedHomework: "Read chapter 1",
      upcomingAssessments: null,
      notes: "Bring models",
      homeworkAssignmentIds: ["homework-1"],
      gradeAssessmentIds: ["assessment-1"],
    });
  });

  it.each([
    ["missing date", { weekStartDate: "" }, "dates_required"],
    ["invalid date", { weekStartDate: "2026-02-31" }, "dates_required"],
    ["reversed range", { weekStartDate: "2026-09-08" }, "date_order"],
    ["outside term", { weekEndDate: "2027-01-01" }, "term_bounds"],
    ["empty ordered row", { objectives: [" "] }, "empty_items"],
  ] as const)("reports %s", (_scenario, change, expected) => {
    const detail = { ...emptyWeeklyPlanDetail("2026-09-01"), ...change };
    expect(
      validateWeeklyPlanDetail(detail, {
        startDate: "2026-09-01",
        endDate: "2026-12-31",
      }),
    ).toBe(expected);
  });
});
