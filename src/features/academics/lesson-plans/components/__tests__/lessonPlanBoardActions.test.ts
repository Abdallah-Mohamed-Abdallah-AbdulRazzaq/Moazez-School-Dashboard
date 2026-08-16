import { describe, expect, it } from "vitest";
import {
  adjacentReorderCommands,
  lessonPlanItemAction,
  lessonPlanItemTransitions,
} from "../lessonPlanBoardActions";
import type { LessonPlan } from "../../services/lessonPlansService";

describe("lesson plan board actions", () => {
  it.each([
    ["IN_PROGRESS", "start"],
    ["DONE", "complete"],
    ["SKIPPED", "skip"],
    ["CANCELLED", "cancel"],
  ] as const)("maps %s to %s", (status, action) =>
    expect(lessonPlanItemAction(status)).toBe(action),
  );
  it("rejects unsupported reset-to-planned transitions", () =>
    expect(() => lessonPlanItemAction("PLANNED")).toThrow());

  it.each([
    ["PLANNED", ["IN_PROGRESS", "DONE", "SKIPPED", "CANCELLED"]],
    ["IN_PROGRESS", ["DONE", "SKIPPED", "CANCELLED"]],
    ["DONE", []],
    ["SKIPPED", []],
    ["CANCELLED", []],
    ["RESCHEDULED", []],
    ["UNKNOWN", []],
  ] as const)("exposes backend transitions from %s", (status, expected) => {
    expect(lessonPlanItemTransitions(status)).toEqual(expected);
  });

  it("builds two commands that swap adjacent existing order values", () => {
    const plan = {
      id: "plan-1",
      items: [
        { id: "item-3", order: 30 },
        { id: "item-1", order: 10 },
        { id: "item-2", order: 20 },
      ],
    } as LessonPlan;

    expect(adjacentReorderCommands(plan, "item-2", "up")).toEqual([
      {
        lessonPlanId: "plan-1",
        itemId: "item-2",
        payload: { sortOrder: 10 },
      },
      {
        lessonPlanId: "plan-1",
        itemId: "item-1",
        payload: { sortOrder: 20 },
      },
    ]);
    expect(adjacentReorderCommands(plan, "item-1", "up")).toEqual([]);
    expect(adjacentReorderCommands(plan, "item-3", "down")).toEqual([]);
  });
});
