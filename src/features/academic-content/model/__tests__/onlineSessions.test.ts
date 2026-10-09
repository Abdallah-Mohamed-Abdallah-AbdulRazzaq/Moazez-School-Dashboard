import { describe, expect, it } from "vitest";
import type { AcademicContentLibraryItem } from "../../types/contracts";
import {
  onlineSessionDurationMinutes,
  onlineSessionListQuery,
  onlineSessionPageStats,
  onlineSessionPresetRange,
  onlineSessionTemporalState,
  readOnlineSessionFilters,
} from "../onlineSessions";

function session(
  id: string,
  startAt: string,
  endAt: string,
  status: "DRAFT" | "PUBLISHED" = "PUBLISHED",
): AcademicContentLibraryItem {
  return {
    id,
    academicYearId: "year-1",
    termId: "term-1",
    type: "ONLINE_SESSION",
    audience: "STUDENTS",
    title: `Session ${id}`,
    description: null,
    status,
    archivedAt: null,
    createdAt: "2026-10-01T08:00:00.000Z",
    updatedAt: "2026-10-02T08:00:00.000Z",
    summary: { type: "ONLINE_SESSION", platform: "ZOOM", startAt, endAt },
  };
}

describe("online sessions query model", () => {
  it("maps all supported URL filters to one backend list query", () => {
    const filters = readOnlineSessionFilters(
      new URLSearchParams(
        "page=2&limit=25&contentStatus=SCHEDULED&audience=STUDENTS&stageId=s1&gradeId=g1&sectionId=sec1&classroomId=c1&subjectId=sub1&teacherUserId=t1&sessionPlatform=ZOOM&tag=fractions&sessionDateFrom=2026-10-06&sessionDateTo=2026-10-07&sessionDatePreset=custom&search=fractions",
      ),
    );
    const query = onlineSessionListQuery(filters, "year-1", "term-1");
    const inclusiveEnd = new Date(new Date(2026, 9, 8).getTime() - 1);

    expect(query).toMatchObject({
      academicYearId: "year-1",
      termId: "term-1",
      page: 2,
      limit: 25,
      status: "SCHEDULED",
      audience: "STUDENTS",
      stageId: "s1",
      gradeId: "g1",
      sectionId: "sec1",
      classroomId: "c1",
      subjectId: "sub1",
      teacherUserId: "t1",
      sessionPlatform: "ZOOM",
      tag: "fractions",
      search: "fractions",
    });
    expect(query.sessionStartAtFrom).toBe(new Date(2026, 9, 6).toISOString());
    expect(query.sessionStartAtTo).toBe(inclusiveEnd.toISOString());
  });

  it("normalizes unsupported URL values", () => {
    expect(
      readOnlineSessionFilters(
        new URLSearchParams(
          "page=0&limit=999&contentStatus=UNKNOWN&audience=PUBLIC&sessionPlatform=SKYPE&sessionDateFrom=2026-99-99&sessionDatePreset=week",
        ),
      ),
    ).toMatchObject({
      page: 1,
      limit: 100,
      status: "",
      audience: "",
      platform: "",
      dateFrom: "",
      datePreset: "",
    });
  });

  it("does not send a reversed date range to the backend", () => {
    const filters = readOnlineSessionFilters(
      new URLSearchParams(
        "sessionDateFrom=2026-10-08&sessionDateTo=2026-10-06",
      ),
    );

    expect(
      onlineSessionListQuery(filters, "year-1", "term-1"),
    ).not.toHaveProperty("sessionStartAtTo");
  });

  it("builds the today, tomorrow, and inclusive seven-day presets", () => {
    const now = new Date(2026, 9, 6, 14, 30);
    expect(onlineSessionPresetRange("today", now)).toEqual({
      dateFrom: "2026-10-06",
      dateTo: "2026-10-06",
    });
    expect(onlineSessionPresetRange("tomorrow", now)).toEqual({
      dateFrom: "2026-10-07",
      dateTo: "2026-10-07",
    });
    expect(onlineSessionPresetRange("next7Days", now)).toEqual({
      dateFrom: "2026-10-06",
      dateTo: "2026-10-12",
    });
  });
});

describe("online session derived presentation data", () => {
  const now = new Date("2026-10-06T10:00:00.000Z");

  it("treats the exact start as live and the exact end as ended", () => {
    const active = session(
      "active",
      now.toISOString(),
      "2026-10-06T11:00:00.000Z",
    );
    const ended = session(
      "ended",
      "2026-10-06T09:00:00.000Z",
      now.toISOString(),
    );
    expect(onlineSessionTemporalState(active, now)).toBe("live");
    expect(onlineSessionTemporalState(ended, now)).toBe("ended");
  });

  it("marks missing session summaries as incomplete", () => {
    const incomplete = {
      ...session("incomplete", now.toISOString(), now.toISOString()),
      summary: null,
    };
    expect(onlineSessionTemporalState(incomplete, now)).toBe("incomplete");
    expect(onlineSessionDurationMinutes(incomplete)).toBeNull();
  });

  it("derives duration and page-scoped metrics without detail requests", () => {
    const items = [
      session(
        "upcoming",
        "2026-10-06T12:00:00.000Z",
        "2026-10-06T12:45:00.000Z",
      ),
      session(
        "live",
        "2026-10-06T09:30:00.000Z",
        "2026-10-06T10:30:00.000Z",
        "DRAFT",
      ),
      session("ended", "2026-10-06T08:00:00.000Z", "2026-10-06T08:30:00.000Z"),
    ];
    expect(onlineSessionDurationMinutes(items[0])).toBe(45);
    expect(onlineSessionPageStats(items, 19, now)).toEqual({
      total: 19,
      upcomingOnPage: 1,
      liveOnPage: 1,
      endedOnPage: 1,
      draftOnPage: 1,
    });
  });
});
