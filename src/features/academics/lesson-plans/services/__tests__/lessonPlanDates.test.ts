import { describe, expect, it } from "vitest";
import {
  autoPlanDateErrors,
  formatDateOnly,
  isDateOnlyInside,
  lessonPlanRangeErrors,
  parseDateOnly,
} from "../lessonPlanDates";

describe("lesson plan date helpers", () => {
  it("formats and parses date-only values without UTC shifting", () => {
    const date = new Date(2026, 8, 3);
    expect(formatDateOnly(date)).toBe("2026-09-03");
    expect(parseDateOnly("2026-09-03")).toEqual(date);
    expect(parseDateOnly("2026-02-30")).toBeNull();
  });

  it("checks inclusive term boundaries", () => {
    expect(isDateOnlyInside("2026-09-01", "2026-09-01", "2026-12-31")).toBe(
      true,
    );
    expect(isDateOnlyInside("2027-01-01", "2026-09-01", "2026-12-31")).toBe(
      false,
    );
  });

  it("validates auto-plan dates against the selected term", () => {
    expect(
      autoPlanDateErrors("2026-08-31", "2026-12-31", "2026-09-01", "2026-12-31")
        .from,
    ).toBe("from_before_term");
    expect(
      autoPlanDateErrors("2026-09-01", "2027-01-01", "2026-09-01", "2026-12-31")
        .to,
    ).toBe("to_after_term");
    expect(
      autoPlanDateErrors(
        "2026-10-02",
        "2026-10-01",
        "2026-09-01",
        "2026-12-31",
      ),
    ).toEqual({ from: "from_after_to", to: "from_after_to" });
  });

  it("validates edited lesson-plan ranges", () => {
    expect(
      lessonPlanRangeErrors(
        "2026-08-31",
        "2026-09-07",
        "2026-09-01",
        "2026-12-31",
      ).start,
    ).toBe("week_start_before_term");
    expect(
      lessonPlanRangeErrors(
        "2026-12-28",
        "2027-01-01",
        "2026-09-01",
        "2026-12-31",
      ).end,
    ).toBe("week_end_after_term");
    expect(
      lessonPlanRangeErrors(
        "2026-10-02",
        "2026-10-01",
        "2026-09-01",
        "2026-12-31",
      ),
    ).toEqual({
      start: "week_start_after_end",
      end: "week_start_after_end",
    });
  });
});
