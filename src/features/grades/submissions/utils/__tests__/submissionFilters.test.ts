import { describe, expect, it } from "vitest";
import { changeSubmissionGrade, changeSubmissionSection, getSubmissionClassrooms, getSubmissionSections, toSubmissionListFilters } from "../submissionFilters";

const scope = { gradeId: "grade-a", sectionId: "section-a", classroomId: "classroom-a" };
const option = (id: string, parentId?: string) => ({ id, parentId, name: id, nameAr: id, nameEn: id, scopeType: "section" as const });

describe("submission scope filters", () => {
  it("filters descendants and clears them when a parent changes", () => {
    expect(getSubmissionSections([option("section-a", "grade-a"), option("section-b", "grade-b")], "grade-a").map(({ id }) => id)).toEqual(["section-a"]);
    expect(getSubmissionClassrooms([option("classroom-a", "section-a")], "section-a").map(({ id }) => id)).toEqual(["classroom-a"]);
    expect(changeSubmissionGrade(scope, "grade-b")).toEqual({ gradeId: "grade-b", sectionId: "", classroomId: "" });
    expect(changeSubmissionSection(scope, "section-b")).toEqual({ gradeId: "grade-a", sectionId: "section-b", classroomId: "" });
  });

  it("omits blank ids and trims search from backend filters", () => {
    expect(toSubmissionListFilters({ gradeId: "", sectionId: "", classroomId: "classroom-a" }, "submitted", " Sara ")).toEqual({ classroomId: "classroom-a", status: "submitted", search: "Sara" });
  });
});
