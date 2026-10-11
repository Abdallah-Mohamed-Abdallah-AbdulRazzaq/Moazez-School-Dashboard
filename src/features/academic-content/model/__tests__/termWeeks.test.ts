import { describe, expect, it } from "vitest";
import { calculateTermWeeks } from "../termWeeks";

describe("numbered term weeks", () => {
  it.each([
    ["2026-10-01", "2026-10-14", [
      { number: 1, startDate: "2026-10-01", endDate: "2026-10-07" },
      { number: 2, startDate: "2026-10-08", endDate: "2026-10-14" },
    ]],
    ["2026-10-01", "2026-10-10", [
      { number: 1, startDate: "2026-10-01", endDate: "2026-10-07" },
      { number: 2, startDate: "2026-10-08", endDate: "2026-10-10" },
    ]],
    ["2026-10-01", "2026-10-01", [
      { number: 1, startDate: "2026-10-01", endDate: "2026-10-01" },
    ]],
    ["2028-02-26", "2028-03-04", [
      { number: 1, startDate: "2028-02-26", endDate: "2028-03-03" },
      { number: 2, startDate: "2028-03-04", endDate: "2028-03-04" },
    ]],
    ["2026-12-29", "2027-01-05", [
      { number: 1, startDate: "2026-12-29", endDate: "2027-01-04" },
      { number: 2, startDate: "2027-01-05", endDate: "2027-01-05" },
    ]],
  ])("covers %s through %s with contiguous inclusive weeks", (startDate, endDate, expected) => {
    expect(calculateTermWeeks({ startDate, endDate })).toEqual(expected);
  });

  it.each([
    undefined,
    { startDate: "", endDate: "" },
    { startDate: "2026-02-30", endDate: "2026-03-10" },
    { startDate: "2026-10-02", endDate: "2026-10-01" },
  ])("offers no weeks when term bounds are unavailable or invalid: %j", (bounds) => {
    expect(calculateTermWeeks(bounds)).toEqual([]);
  });
});
