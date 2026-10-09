import { describe, expect, it } from "vitest";
import type { AcademicContentLibraryItem } from "../../types/contracts";
import {
  readSubjectResourceFilters,
  subjectResourceListQuery,
  subjectResourcePageStats,
} from "../subjectResources";

function resource(
  id: string,
  category: "WORKSHEET" | "VIDEO",
  status: "DRAFT" | "PUBLISHED",
): AcademicContentLibraryItem {
  return {
    id,
    academicYearId: "year-1",
    termId: "term-1",
    type: "SUBJECT_RESOURCE",
    audience: "STUDENTS",
    title: `Resource ${id}`,
    description: null,
    status,
    archivedAt: null,
    createdAt: "2026-10-01T08:00:00.000Z",
    updatedAt: "2026-10-02T08:00:00.000Z",
    summary: { type: "SUBJECT_RESOURCE", resourceCategory: category },
  };
}

describe("subject resources query model", () => {
  it("maps every supported URL filter to the backend list query", () => {
    const filters = readSubjectResourceFilters(
      new URLSearchParams(
        "page=2&limit=25&contentStatus=PUBLISHED&audience=STUDENTS&stageId=s1&gradeId=g1&sectionId=sec1&classroomId=c1&subjectId=sub1&teacherUserId=t1&resourceCategory=WORKSHEET&tag=fractions&search=fractions&view=grid",
      ),
    );

    expect(subjectResourceListQuery(filters, "year-1", "term-1")).toEqual({
      academicYearId: "year-1",
      termId: "term-1",
      page: 2,
      limit: 25,
      status: "PUBLISHED",
      audience: "STUDENTS",
      stageId: "s1",
      gradeId: "g1",
      sectionId: "sec1",
      classroomId: "c1",
      subjectId: "sub1",
      teacherUserId: "t1",
      resourceCategory: "WORKSHEET",
      tag: "fractions",
      search: "fractions",
    });
    expect(filters.view).toBe("grid");
  });

  it("normalizes unsupported URL values", () => {
    const filters = readSubjectResourceFilters(
      new URLSearchParams(
        "page=0&limit=999&contentStatus=UNKNOWN&audience=PUBLIC&resourceCategory=PDF&view=calendar",
      ),
    );

    expect(filters).toMatchObject({
      page: 1,
      limit: 100,
      status: "",
      audience: "",
      resourceCategory: "",
      view: "table",
    });
  });

  it("derives page metrics without extra requests", () => {
    expect(
      subjectResourcePageStats(
        [
          resource("1", "WORKSHEET", "PUBLISHED"),
          resource("2", "WORKSHEET", "DRAFT"),
          resource("3", "VIDEO", "PUBLISHED"),
        ],
        42,
      ),
    ).toEqual({
      total: 42,
      pageItems: 3,
      publishedOnPage: 2,
      categoriesOnPage: 2,
    });
  });
});
