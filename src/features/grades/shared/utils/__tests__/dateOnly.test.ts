import { describe, expect, it } from "vitest";
import { formatLocalDateOnly, parseLocalDateOnly } from "../dateOnly";

describe("assessment date-only formatting", () => {
  it("preserves the selected local calendar day", () => {
    const selectedDate = new Date(2026, 6, 14, 0, 0, 0);

    expect(formatLocalDateOnly(selectedDate)).toBe("2026-07-14");
  });

  it("parses a date-only value in local time", () => {
    expect(parseLocalDateOnly("2026-07-14")).toEqual(
      new Date(2026, 6, 14),
    );
  });
});
