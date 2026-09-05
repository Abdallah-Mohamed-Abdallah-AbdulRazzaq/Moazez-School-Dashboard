import { describe, expect, it } from "vitest";
import {
  buildHomeworkListFilters,
  resetHomeworkListFilterParams,
  updateHomeworkListFilterParams,
} from "./homeworkListFilters";

describe("homework list filters", () => {
  it("maps every supported URL filter to the homework assignments request", () => {
    const filters = buildHomeworkListFilters({
      academicYearId: "year-1",
      termId: "term-1",
      searchParams: new URLSearchParams({
        search: "fractions",
        homeworkStatus: "archived",
        mode: "worksheet",
        classroom: "classroom-1",
        teacher: "teacher-1",
        allocation: "allocation-1",
        dueFrom: "2026-09-01",
        dueTo: "2026-09-30",
        page: "3",
        limit: "50",
      }),
    });

    expect(filters).toEqual({
      academicYearId: "year-1",
      termId: "term-1",
      search: "fractions",
      status: "archived",
      mode: "worksheet",
      classroomId: "classroom-1",
      teacherUserId: "teacher-1",
      teacherSubjectAllocationId: "allocation-1",
      dueFrom: "2026-09-01",
      dueTo: "2026-09-30",
      page: 3,
      limit: 50,
    });
  });

  it("replaces filter parameters, removes cleared values, and resets pagination", () => {
    const params = updateHomeworkListFilterParams(
      new URLSearchParams({ page: "4", tab: "submissions", mode: "quiz" }),
      {
        search: "fractions",
        status: "published",
        mode: "",
        classroomId: "classroom-1",
        teacherUserId: "",
        teacherSubjectAllocationId: "allocation-1",
        dueFrom: "2026-09-01",
        dueTo: "",
      },
    );

    expect(Object.fromEntries(params)).toEqual({
      tab: "submissions",
      search: "fractions",
      homeworkStatus: "published",
      classroom: "classroom-1",
      allocation: "allocation-1",
      dueFrom: "2026-09-01",
    });
  });

  it("clears every homework filter while preserving unrelated context", () => {
    const params = resetHomeworkListFilterParams(
      new URLSearchParams({
        year: "year-1",
        term: "term-1",
        tab: "submissions",
        page: "3",
        search: "fractions",
        homeworkStatus: "published",
        mode: "worksheet",
        classroom: "classroom-1",
        teacher: "teacher-1",
        allocation: "allocation-1",
        dueFrom: "2026-09-01",
        dueTo: "2026-09-30",
      }),
    );

    expect(Object.fromEntries(params)).toEqual({
      year: "year-1",
      term: "term-1",
      tab: "submissions",
    });
  });
});
