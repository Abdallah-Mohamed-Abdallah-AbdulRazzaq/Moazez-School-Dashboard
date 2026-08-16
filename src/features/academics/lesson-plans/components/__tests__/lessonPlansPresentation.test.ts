import { describe, expect, it } from "vitest";
import type {
  LessonPlan,
  WeekInfo,
} from "../../services/lessonPlansService";
import {
  deriveIssueWeekIndexes,
  filterLessonPlanWeeks,
  getWeekPresentation,
} from "../lessonPlansPresentation";

const week = (weekIndex: number, startDate: string, endDate: string) =>
  ({
    weekIndex,
    startDate,
    endDate,
    instructionalDays: [startDate],
  }) as WeekInfo;

const plan = (weekIndex: number, itemIds: string[]) =>
  ({
    weekIndex,
    items: itemIds.map((id) => ({ id })),
  }) as LessonPlan;

describe("lesson plans week presentation", () => {
  const weeks = [
    week(1, "2026-06-01", "2026-06-07"),
    week(2, "2026-06-08", "2026-06-14"),
    week(3, "2026-06-15", "2026-06-21"),
  ];
  const plans = [plan(1, ["item-1"]), plan(3, [])];

  it.each([
    ["ALL", [1, 2, 3]],
    ["CURRENT_UPCOMING", [2, 3]],
    ["PLANNED", [1]],
    ["ISSUES", [3]],
  ] as const)("filters backend weeks for the %s view", (filter, expected) => {
    const visibleWeeks = filterLessonPlanWeeks({
      weeks,
      plans,
      issueWeekIndexes: new Set([3]),
      filter,
      today: "2026-06-10",
    });

    expect(visibleWeeks.map(({ weekIndex }) => weekIndex)).toEqual(expected);
  });

  it("maps validation item issues to their backend week", () => {
    expect(
      deriveIssueWeekIndexes({
        plans,
        issues: [{ itemId: "item-1" }, { itemId: "missing-item" }],
      }),
    ).toEqual(new Set([1]));
  });

  it("marks the current backend week without deriving additional weeks", () => {
    expect(
      getWeekPresentation({
        week: weeks[1],
        itemCount: 0,
        hasIssue: false,
        today: "2026-06-10",
      }).isCurrent,
    ).toBe(true);
  });
});
