import { describe, expect, it } from "vitest";
import { calculateGradesCompletionRate } from "../gradesAnalyticsService";

describe("calculateGradesCompletionRate", () => {
  it.each([
    [{ enteredItemCount: 2, missingItemCount: 1, absentItemCount: 1 }, 50],
    [{ enteredItemCount: 3, missingItemCount: 0, absentItemCount: 0 }, 100],
    [{ enteredItemCount: 0, missingItemCount: 0, absentItemCount: 0 }, 0],
  ])("uses entered grade items out of the complete roster", (summary, expected) => {
    expect(calculateGradesCompletionRate(summary)).toBe(expected);
  });
});
