import { describe, expect, it } from "vitest";
import { readWeeklyPlanFilters, weeklyPlanListQuery } from "../weeklyPlans";

describe("weekly plan query model", () => {
  it("maps every supported URL filter to the backend list query", () => {
    const filters = readWeeklyPlanFilters(
      new URLSearchParams(
        "page=2&limit=25&contentStatus=DRAFT&audience=STUDENTS&stageId=s1&gradeId=g1&sectionId=sec1&classroomId=c1&subjectId=sub1&teacherUserId=t1&tag=fractions&weeklyDateFrom=2026-10-05&weeklyDateTo=2026-10-11&search=fractions&view=calendar",
      ),
    );

    expect(filters).toEqual({
      page: 2,
      limit: 25,
      status: "DRAFT",
      audience: "STUDENTS",
      stageId: "s1",
      gradeId: "g1",
      sectionId: "sec1",
      classroomId: "c1",
      subjectId: "sub1",
      teacherUserId: "t1",
      tag: "fractions",
      weeklyDateFrom: "2026-10-05",
      weeklyDateTo: "2026-10-11",
      search: "fractions",
      view: "calendar",
    });
    expect(weeklyPlanListQuery(filters, "year-1", "term-1")).toEqual({
      academicYearId: "year-1",
      termId: "term-1",
      page: 2,
      limit: 25,
      status: "DRAFT",
      audience: "STUDENTS",
      stageId: "s1",
      gradeId: "g1",
      sectionId: "sec1",
      classroomId: "c1",
      subjectId: "sub1",
      teacherUserId: "t1",
      tag: "fractions",
      weeklyDateFrom: "2026-10-05",
      weeklyDateTo: "2026-10-11",
      search: "fractions",
    });
  });

  it("normalizes unsupported URL values without adding backend filters", () => {
    const filters = readWeeklyPlanFilters(
      new URLSearchParams(
        "page=0&limit=999&contentStatus=UNKNOWN&audience=PUBLIC&weeklyDateFrom=2026-99-99&weeklyDateTo=invalid&view=grid",
      ),
    );

    expect(filters.page).toBe(1);
    expect(filters.limit).toBe(100);
    expect(filters.status).toBe("");
    expect(filters.audience).toBe("");
    expect(filters.weeklyDateFrom).toBe("");
    expect(filters.weeklyDateTo).toBe("");
    expect(filters.view).toBe("table");
  });

  it("omits a reversed weekly end date", () => {
    const filters = readWeeklyPlanFilters(
      new URLSearchParams("weeklyDateFrom=2026-10-12&weeklyDateTo=2026-10-05"),
    );

    expect(weeklyPlanListQuery(filters, "year-1", "term-1")).toMatchObject({
      weeklyDateFrom: "2026-10-12",
    });
    expect(weeklyPlanListQuery(filters, "year-1", "term-1")).not.toHaveProperty(
      "weeklyDateTo",
    );
  });
});
