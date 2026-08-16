import { describe, expect, it } from "vitest";
import { getHierarchyOptions, getScopeHierarchyPath } from "../assessmentScopeHierarchy";

const scopeEntities = {
  school: [],
  stage: [{ id: "stage-1", nameAr: "المرحلة", nameEn: "Stage", scopeType: "stage" as const }],
  grade: [{ id: "grade-1", nameAr: "الأول", nameEn: "Grade 1", scopeType: "grade" as const, parentId: "stage-1" }],
  section: [{ id: "section-1", nameAr: "أ", nameEn: "A", scopeType: "section" as const, parentId: "grade-1" }],
  classroom: [{ id: "room-1", nameAr: "1", nameEn: "Room 1", scopeType: "classroom" as const, parentId: "section-1" }],
};

describe("assessment scope hierarchy", () => {
  it("hydrates every ancestor for an existing classroom assessment", () => {
    expect(getScopeHierarchyPath(scopeEntities, "classroom", "room-1")).toEqual({
      stage: "stage-1",
      grade: "grade-1",
      section: "section-1",
      classroom: "room-1",
    });
  });

  it("only offers children of the selected parent", () => {
    expect(getHierarchyOptions(scopeEntities, "section", { grade: "grade-1" })).toEqual(scopeEntities.section);
    expect(getHierarchyOptions(scopeEntities, "section", {})).toEqual([]);
  });
});
