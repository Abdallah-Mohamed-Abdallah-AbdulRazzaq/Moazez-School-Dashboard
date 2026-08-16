import { describe, expect, it } from "vitest";
import { getExcusePeriodKeysForSave } from "./excusePeriodSelection";

describe("getExcusePeriodKeysForSave", () => {
  it("preserves saved stable keys when edit context has no loaded timetable", () => {
    expect(getExcusePeriodKeysForSave(["stable-period-key"], [])).toEqual([
      "stable-period-key",
    ]);
  });
});
