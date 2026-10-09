import { describe, expect, it } from "vitest";
import {
  GRADE_FILTER_RESET,
  listAudienceOptions,
  SECTION_FILTER_RESET,
  STAGE_FILTER_RESET,
  validDateOnlyFilter,
} from "../academicContentListFilters";

describe("academic content list filter helpers", () => {
  it("uses type-specific audiences and hierarchical resets", () => {
    expect(
      listAudienceOptions("ONLINE_SESSION", String).map(({ value }) => value),
    ).toEqual(["STUDENTS", "STUDENTS_AND_GUARDIANS"]);
    expect(STAGE_FILTER_RESET).toEqual({
      gradeId: "",
      sectionId: "",
      classroomId: "",
    });
    expect(GRADE_FILTER_RESET).toEqual({ sectionId: "", classroomId: "" });
    expect(SECTION_FILTER_RESET).toEqual({ classroomId: "" });
  });

  it.each([
    ["2024-02-29", "2024-02-29"],
    ["2026-10-06", "2026-10-06"],
    ["2026-02-29", ""],
    ["2026-13-01", ""],
    ["2026-04-31", ""],
    ["06-10-2026", ""],
    [null, ""],
  ])("normalizes the date-only filter %s", (value, expected) => {
    expect(validDateOnlyFilter(value)).toBe(expected);
  });
});
