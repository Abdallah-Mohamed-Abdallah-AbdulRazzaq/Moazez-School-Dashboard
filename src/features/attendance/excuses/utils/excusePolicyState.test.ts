import { describe, expect, it } from "vitest";
import type { AttendancePolicy } from "@/features/attendance/policies/types";
import { deriveExcusePolicyState } from "./excusePolicyState";

const policy: AttendancePolicy = {
  id: "policy-1",
  yearId: "year-1",
  termId: "term-1",
  nameAr: "سياسة",
  nameEn: "Policy",
  scopeType: "SCHOOL",
  mode: "PERIOD",
  selectedPeriodIds: ["period-1"],
  lateThresholdMinutes: 15,
  earlyLeaveThresholdMinutes: 10,
  allowExcuses: true,
  requireExcuseReason: true,
  requireAttachmentForExcuse: false,
  notifyTeachers: false,
  notifyStudents: false,
  notifyGuardians: false,
  notifyOnAbsent: false,
  notifyOnLate: false,
  notifyOnEarlyLeave: false,
  effectiveStartDate: "2026-01-01",
  effectiveEndDate: "2026-12-31",
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("deriveExcusePolicyState", () => {
  it("derives field policy state from an already loaded snapshot", () => {
    const result = deriveExcusePolicyState([policy], {
      dateFrom: "2026-02-01",
      dateTo: "2026-02-01",
      scopeType: "GRADE",
      scopeIds: { stageId: "stage-1", gradeId: "grade-1" },
      reasonAr: "",
      reasonEn: "",
      attachments: [],
    });

    expect(result.policy).toEqual({
      allowExcuses: true,
      requireExcuseReason: true,
      requireAttachmentForExcuse: false,
      lateThresholdMinutes: 15,
      earlyLeaveThresholdMinutes: 10,
    });
    expect(result.issue).toEqual({
      code: "REASON_REQUIRED",
      date: "2026-02-01",
    });
  });
});
