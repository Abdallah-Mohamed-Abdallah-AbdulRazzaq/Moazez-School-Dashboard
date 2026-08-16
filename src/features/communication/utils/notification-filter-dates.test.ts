import { describe, expect, it } from "vitest";
import { filterDate, filterIsoValue } from "./notification-filter-dates";

describe("notification filter dates", () => {
  it("preserves the selected instant and clears empty values", () => {
    const selectedInstant = "2026-06-28T08:45:08.947Z";

    expect(filterIsoValue(filterDate(selectedInstant))).toBe(selectedInstant);
    expect(filterDate("")).toBeNull();
    expect(filterDate("invalid-date")).toBeNull();
    expect(filterIsoValue(null)).toBe("");
  });
});
