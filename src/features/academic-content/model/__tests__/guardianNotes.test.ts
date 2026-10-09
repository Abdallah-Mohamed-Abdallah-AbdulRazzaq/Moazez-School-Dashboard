import { describe, expect, it } from "vitest";
import type { AcademicContentLibraryItem } from "../../types/contracts";
import {
  guardianNoteListQuery,
  guardianNotePageStats,
  readGuardianNoteFilters,
} from "../guardianNotes";

const note = (
  id: string,
  priority: "NORMAL" | "IMPORTANT" | "URGENT",
  requiresAcknowledgement: boolean,
): AcademicContentLibraryItem => ({
  id,
  academicYearId: "year-1",
  termId: "term-1",
  type: "GUARDIAN_WEEKLY_NOTE",
  audience: "GUARDIANS",
  title: `Note ${id}`,
  description: null,
  status: "DRAFT",
  archivedAt: null,
  createdAt: "2026-10-01T08:00:00.000Z",
  updatedAt: "2026-10-02T08:00:00.000Z",
  summary: {
    type: "GUARDIAN_WEEKLY_NOTE",
    priority,
    requiresAcknowledgement,
  },
});

describe("guardian notes query model", () => {
  it("maps only supported URL filters to the backend list query", () => {
    const filters = readGuardianNoteFilters(
      new URLSearchParams(
        "page=2&limit=25&contentStatus=PUBLISHED&guardianPriority=URGENT&stageId=s1&gradeId=g1&sectionId=sec1&classroomId=c1&subjectId=sub1&teacherUserId=t1&tag=reminder&search=reminder&view=grid",
      ),
    );

    expect(filters).toMatchObject({
      page: 2,
      limit: 25,
      status: "PUBLISHED",
      priority: "URGENT",
      view: "grid",
    });
    expect(guardianNoteListQuery(filters, "year-1", "term-1")).toEqual({
      academicYearId: "year-1",
      termId: "term-1",
      page: 2,
      limit: 25,
      status: "PUBLISHED",
      guardianPriority: "URGENT",
      stageId: "s1",
      gradeId: "g1",
      sectionId: "sec1",
      classroomId: "c1",
      subjectId: "sub1",
      teacherUserId: "t1",
      tag: "reminder",
      search: "reminder",
    });
  });

  it("normalizes unsupported URL values", () => {
    const filters = readGuardianNoteFilters(
      new URLSearchParams(
        "page=0&limit=999&contentStatus=UNKNOWN&guardianPriority=LOW&view=calendar",
      ),
    );

    expect(filters.page).toBe(1);
    expect(filters.limit).toBe(100);
    expect(filters.status).toBe("");
    expect(filters.priority).toBe("");
    expect(filters.view).toBe("table");
  });

  it("derives page summaries without additional backend totals", () => {
    expect(
      guardianNotePageStats(
        [note("1", "URGENT", true), note("2", "NORMAL", false)],
        47,
      ),
    ).toEqual({
      total: 47,
      pageItems: 2,
      urgentOnPage: 1,
      acknowledgementOnPage: 1,
    });
  });
});
