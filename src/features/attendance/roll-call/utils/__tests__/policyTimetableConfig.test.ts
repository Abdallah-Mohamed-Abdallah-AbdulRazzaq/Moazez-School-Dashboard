import { describe, expect, it } from "vitest";
import type { AttendancePolicy, AttendanceScopeType } from "@/features/attendance/policies/types";
import {
  getPolicyTimetableConfigRequest,
  getRollCallTimetableConfigRequest,
} from "../policyTimetableConfig";

function policyFor(
  scopeType: AttendanceScopeType,
  scopeIds: AttendancePolicy["scopeIds"] = {},
): AttendancePolicy {
  return {
    id: "policy-1",
    yearId: "year-1",
    termId: "term-1",
    nameAr: "سياسة الحضور",
    nameEn: "Attendance policy",
    scopeType,
    scopeIds,
    mode: "PERIOD",
    selectedPeriodIds: ["period-1"],
    lateThresholdMinutes: 15,
    earlyLeaveThresholdMinutes: 15,
    autoAbsentAfterMinutes: null,
    absentIfMissedPeriodsCount: 1,
    allowExcuses: true,
    requireExcuseReason: false,
    requireAttachmentForExcuse: false,
    notifyTeachers: true,
    notifyStudents: false,
    notifyGuardians: true,
    notifyOnAbsent: true,
    notifyOnLate: true,
    notifyOnEarlyLeave: false,
    effectiveStartDate: null,
    effectiveEndDate: null,
    isActive: true,
    createdAt: "2026-08-04T00:00:00.000Z",
    updatedAt: "2026-08-04T00:00:00.000Z",
  };
}

describe("getPolicyTimetableConfigRequest", () => {
  it.each([
    ["SCHOOL", {}, { scopeType: "TERM" }],
    ["GRADE", { gradeId: "grade-1" }, { scopeType: "GRADE", gradeId: "grade-1" }],
    ["SECTION", { sectionId: "section-1" }, { scopeType: "SECTION", sectionId: "section-1" }],
    [
      "CLASSROOM",
      { classroomId: "classroom-1" },
      { scopeType: "CLASSROOM", classroomId: "classroom-1" },
    ],
  ] as const)(
    "uses the %s policy timetable scope",
    (scopeType, scopeIds, expectedScope) => {
      expect(
        getPolicyTimetableConfigRequest(
          policyFor(scopeType, scopeIds),
          "year-1",
          "term-1",
        ),
      ).toEqual({
        academicYearId: "year-1",
        termId: "term-1",
        ...expectedScope,
      });
    },
  );

  it("uses the term timetable for a legacy stage policy", () => {
    expect(
      getPolicyTimetableConfigRequest(
        policyFor("STAGE", { stageId: "stage-1" }),
        "year-1",
        "term-1",
      ),
    ).toEqual({
      academicYearId: "year-1",
      termId: "term-1",
      scopeType: "TERM",
    });
  });
});

describe("getRollCallTimetableConfigRequest", () => {
  it.each([
    ["SCHOOL", {}, { scopeType: "TERM" }],
    ["STAGE", { stageId: "stage-1" }, { scopeType: "TERM" }],
    ["GRADE", { gradeId: "grade-1" }, { scopeType: "GRADE", gradeId: "grade-1" }],
    ["SECTION", { sectionId: "section-1" }, { scopeType: "SECTION", sectionId: "section-1" }],
    [
      "CLASSROOM",
      { classroomId: "classroom-1" },
      { scopeType: "CLASSROOM", classroomId: "classroom-1" },
    ],
  ] as const)(
    "uses the selected %s scope instead of an inherited policy scope",
    (scopeType, scopeIds, expectedScope) => {
      expect(
        getRollCallTimetableConfigRequest(
          scopeType,
          scopeIds,
          "year-1",
          "term-1",
        ),
      ).toEqual({
        academicYearId: "year-1",
        termId: "term-1",
        ...expectedScope,
      });
    },
  );
});
