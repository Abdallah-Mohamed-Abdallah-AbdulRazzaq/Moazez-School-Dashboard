import { describe, expect, it } from "vitest";
import type { AcademicContentLibraryItem } from "../../types/contracts";
import {
  generalResourceListQuery,
  generalResourcePageStats,
  readGeneralResourceFilters,
} from "../generalResources";

function resource(
  id: string,
  audience: "STUDENTS" | "GUARDIANS",
  status: "DRAFT" | "PUBLISHED",
): AcademicContentLibraryItem {
  return {
    id,
    academicYearId: "year-1",
    termId: "term-1",
    type: "GENERAL_RESOURCE",
    audience,
    title: `Resource ${id}`,
    description: null,
    status,
    archivedAt: null,
    createdAt: "2026-10-01T08:00:00.000Z",
    updatedAt: "2026-10-02T08:00:00.000Z",
    summary: null,
  };
}

describe("general resources query model", () => {
  it("maps every supported URL filter to the backend list query", () => {
    const filters = readGeneralResourceFilters(
      new URLSearchParams(
        "page=2&limit=25&contentStatus=PUBLISHED&audience=STUDENTS&stageId=s1&gradeId=g1&sectionId=sec1&classroomId=c1&subjectId=sub1&teacherUserId=t1&tag=policy&search=handbook&view=grid",
      ),
    );

    expect(generalResourceListQuery(filters, "year-1", "term-1")).toEqual({
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
      tag: "policy",
      search: "handbook",
    });
    expect(filters.view).toBe("grid");
  });

  it("normalizes unsupported URL values", () => {
    const filters = readGeneralResourceFilters(
      new URLSearchParams(
        "page=0&limit=999&contentStatus=UNKNOWN&audience=PUBLIC&view=calendar",
      ),
    );

    expect(filters).toMatchObject({
      page: 1,
      limit: 100,
      status: "",
      audience: "",
      view: "table",
    });
  });

  it("derives page metrics without extra requests", () => {
    expect(
      generalResourcePageStats(
        [
          resource("1", "STUDENTS", "PUBLISHED"),
          resource("2", "STUDENTS", "DRAFT"),
          resource("3", "GUARDIANS", "PUBLISHED"),
        ],
        42,
      ),
    ).toEqual({
      total: 42,
      pageItems: 3,
      publishedOnPage: 2,
      audiencesOnPage: 2,
    });
  });
});
