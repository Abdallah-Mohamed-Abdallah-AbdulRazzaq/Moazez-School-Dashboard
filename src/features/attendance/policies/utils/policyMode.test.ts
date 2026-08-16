import { describe, expect, it } from "vitest";
import {
  isDailyAttendancePolicy,
  isPeriodAttendancePolicy,
} from "./policyMode";

describe("policy mode predicates", () => {
  it("recognizes both backend modes", () => {
    expect(isDailyAttendancePolicy({ mode: "DAILY" })).toBe(true);
    expect(isPeriodAttendancePolicy({ mode: "DAILY" })).toBe(false);
    expect(isPeriodAttendancePolicy({ mode: "PERIOD" })).toBe(true);
    expect(isPeriodAttendancePolicy(null)).toBe(false);
  });
});
