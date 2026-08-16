import { describe, expect, it } from "vitest";
import {
  formatLocalDate,
  isTimetableDateActive,
} from "../localDate";

describe("roll-call local dates", () => {
  it("serializes a calendar date without converting it to UTC", () => {
    expect(formatLocalDate(new Date(2026, 1, 10))).toBe("2026-02-10");
  });

  it("rejects dates whose weekday is inactive in the timetable", () => {
    expect(isTimetableDateActive(new Date(2026, 1, 8), [1, 2, 3, 4, 5])).toBe(
      false,
    );
    expect(isTimetableDateActive(new Date(2026, 1, 9), [1, 2, 3, 4, 5])).toBe(
      true,
    );
  });
});
