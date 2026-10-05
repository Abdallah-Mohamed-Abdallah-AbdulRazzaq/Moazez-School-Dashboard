import { describe, expect, it } from "vitest";
import {
  PREPARATION_COUNT_DEFINITIONS,
  readTeacherPreparationFilters,
  teacherPreparationListQuery,
} from "../teacherPreparations";

describe("teacher preparation query model", () => {
  it("keeps only supported URL filters", () => {
    const filters = readTeacherPreparationFilters(
      new URLSearchParams(
        "page=2&limit=25&contentStatus=SUBMITTED&teacherUserId=t1&stageId=s1&gradeId=g1&classroomId=c1&subjectId=sub1&search=fractions&readiness=100&sort=title",
      ),
    );

    expect(filters).toEqual({
      page: 2,
      limit: 25,
      status: "SUBMITTED",
      teacherUserId: "t1",
      stageId: "s1",
      gradeId: "g1",
      classroomId: "c1",
      subjectId: "sub1",
      search: "fractions",
    });
    expect(teacherPreparationListQuery(filters, "year-1", "term-1")).toEqual({
      academicYearId: "year-1",
      termId: "term-1",
      page: 2,
      limit: 25,
      status: "SUBMITTED",
      teacherUserId: "t1",
      stageId: "s1",
      gradeId: "g1",
      classroomId: "c1",
      subjectId: "sub1",
      search: "fractions",
    });
  });

  it("normalizes invalid pagination, status, and search length", () => {
    const filters = readTeacherPreparationFilters(
      new URLSearchParams({
        page: "0",
        limit: "999",
        contentStatus: "PENDING",
        search: "x".repeat(140),
      }),
    );

    expect(filters.page).toBe(1);
    expect(filters.limit).toBe(100);
    expect(filters.status).toBe("");
    expect(filters.search).toHaveLength(120);
  });

  it("defines the four contract-backed summary counts", () => {
    expect(PREPARATION_COUNT_DEFINITIONS).toEqual([
      { key: "total", status: undefined },
      { key: "draft", status: "DRAFT" },
      { key: "pendingApproval", status: "SUBMITTED" },
      { key: "approved", status: "APPROVED" },
    ]);
  });
});
