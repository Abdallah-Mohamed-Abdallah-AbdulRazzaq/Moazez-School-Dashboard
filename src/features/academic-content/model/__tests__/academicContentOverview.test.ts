import { describe, expect, it } from "vitest";
import type { AcademicContentLibraryItem } from "../../types/contracts";
import {
  mergeWorkInProgress,
  selectUpcomingSessions,
  sessionState,
} from "../academicContentOverview";

function content(
  id: string,
  updatedAt: string,
  summary: AcademicContentLibraryItem["summary"] = null,
): AcademicContentLibraryItem {
  return {
    id,
    academicYearId: "year-1",
    termId: "term-1",
    type: summary?.type ?? "GENERAL_RESOURCE",
    audience: "STUDENTS",
    title: id,
    description: null,
    status: "DRAFT",
    archivedAt: null,
    createdAt: updatedAt,
    updatedAt,
    summary,
  };
}

describe("academic content overview presentation", () => {
  it("merges work in progress by newest update without duplicates", () => {
    const older = content("older", "2026-10-03T09:00:00.000Z");
    const newer = content("newer", "2026-10-05T09:00:00.000Z");

    expect(mergeWorkInProgress([older, newer], [older])).toEqual([
      newer,
      older,
    ]);
  });

  it.each([
    ["2026-10-05T10:29:59.000Z", "STARTING_SOON"],
    ["2026-10-05T10:30:00.000Z", "STARTING_SOON"],
    ["2026-10-05T10:30:01.000Z", "UPCOMING"],
  ] as const)("classifies a session at %s as %s", (startAt, expected) => {
    expect(sessionState(startAt, new Date("2026-10-05T10:00:00.000Z"))).toBe(
      expected,
    );
  });

  it("selects the nearest authored online sessions", () => {
    const nearest = content("nearest", "2026-10-05T08:00:00.000Z", {
      type: "ONLINE_SESSION",
      platform: "ZOOM",
      startAt: "2026-10-05T10:15:00.000Z",
      endAt: "2026-10-05T11:00:00.000Z",
    });
    const later = content("later", "2026-10-05T09:00:00.000Z", {
      type: "ONLINE_SESSION",
      platform: "GOOGLE_MEET",
      startAt: "2026-10-05T12:00:00.000Z",
      endAt: "2026-10-05T13:00:00.000Z",
    });
    const unrelated = content("resource", "2026-10-05T09:30:00.000Z");

    expect(
      selectUpcomingSessions(
        [later, unrelated, nearest],
        new Date("2026-10-05T10:00:00.000Z"),
      ).map(({ content: sessionContent, state }) => [sessionContent.id, state]),
    ).toEqual([
      ["nearest", "STARTING_SOON"],
      ["later", "UPCOMING"],
    ]);
  });
});
