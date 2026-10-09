import { describe, expect, it } from "vitest";
import type { AcademicContentOnlineSessionDetail } from "../../types/contracts";
import {
  onlineSessionCountdownMinutes,
  onlineSessionDetailDurationMinutes,
  onlineSessionDetailState,
  onlineSessionJoinHref,
} from "../onlineSessionDetail";

function sessionDetail(
  overrides: Partial<AcademicContentOnlineSessionDetail> = {},
): AcademicContentOnlineSessionDetail {
  return {
    platform: "GOOGLE_MEET",
    providerName: null,
    joinUrl: "https://meet.google.com/abc-defg-hij",
    accessCode: "1234",
    instructions: "Join with your school account.",
    startAt: "2026-10-06T10:00:00.000Z",
    endAt: "2026-10-06T10:45:00.000Z",
    timezone: "Africa/Cairo",
    timetableEntryId: null,
    ...overrides,
  };
}

describe("online session detail derivations", () => {
  it.each([
    ["2026-10-06T09:59:59.999Z", "upcoming"],
    ["2026-10-06T10:00:00.000Z", "live"],
    ["2026-10-06T10:44:59.999Z", "live"],
    ["2026-10-06T10:45:00.000Z", "ended"],
  ] as const)("maps %s to %s", (now, expected) => {
    expect(onlineSessionDetailState(sessionDetail(), new Date(now))).toBe(
      expected,
    );
  });

  it("derives duration and an upcoming countdown in minutes", () => {
    const detail = sessionDetail();
    expect(onlineSessionDetailDurationMinutes(detail)).toBe(45);
    expect(
      onlineSessionCountdownMinutes(
        detail,
        new Date("2026-10-06T09:30:01.000Z"),
      ),
    ).toBe(30);
    expect(
      onlineSessionCountdownMinutes(
        detail,
        new Date("2026-10-06T10:00:00.000Z"),
      ),
    ).toBeNull();
  });

  it("accepts only HTTPS join links without credentials", () => {
    expect(onlineSessionJoinHref(sessionDetail())).toBe(
      "https://meet.google.com/abc-defg-hij",
    );
    expect(
      onlineSessionJoinHref(sessionDetail({ joinUrl: "http://example.com" })),
    ).toBeNull();
    expect(
      onlineSessionJoinHref(sessionDetail({ joinUrl: "javascript:alert(1)" })),
    ).toBeNull();
    expect(
      onlineSessionJoinHref(
        sessionDetail({ joinUrl: "https://user:secret@example.com" }),
      ),
    ).toBeNull();
  });
});
