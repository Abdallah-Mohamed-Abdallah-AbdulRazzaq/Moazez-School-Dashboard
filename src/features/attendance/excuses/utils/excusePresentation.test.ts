import { describe, expect, it } from "vitest";
import {
  formatExcuseDateRange,
  getSecondaryStudentName,
} from "./excusePresentation";

describe("excuse presentation", () => {
  it("shows a single localized date for a same-day request", () => {
    const label = formatExcuseDateRange(
      "2026-07-01",
      "2026-07-01",
      "en",
    );
    expect(label).toContain("Jul");
    expect(label).not.toContain("→");
  });

  it("keeps both dates for a multi-day absence", () => {
    expect(
      formatExcuseDateRange("2026-07-01", "2026-07-03", "en"),
    ).toContain("→");
  });

  it("hides a duplicated fallback student name", () => {
    expect(getSecondaryStudentName("Ali Dahshan", "Ali Dahshan")).toBeNull();
    expect(getSecondaryStudentName("Ali Dahshan", "علي دهشان")).toBe(
      "علي دهشان",
    );
  });
});
