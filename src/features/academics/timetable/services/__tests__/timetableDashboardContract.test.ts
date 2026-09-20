import { describe, expect, it } from "vitest";
import {
  dashboardConfigScopeId,
  resolveEffectiveDashboardTimetable,
} from "@/features/academics/timetable/services/timetableDashboardContract";
import type {
  BackendTimetableEntryDto,
  BackendTimetablePeriodDto,
  TimetableDashboardConfigSummaryDto,
  TimetableDashboardItemDto,
} from "@/features/academics/timetable/services/timetableApiTypes";

const effectiveConfig: TimetableDashboardConfigSummaryDto = {
  id: "grade-config",
  name: "Grade timetable",
  scopeType: "grade",
  scopeKey: "grade:grade-1",
  stageId: "stage-1",
  status: "active",
  activeDays: [0, 1, 2, 3, 4],
};

const period = (
  id: string,
  timetableConfigId: string,
): BackendTimetablePeriodDto => ({
  id,
  timetableConfigId,
  index: 1,
  label: id,
  startTime: "08:00",
  endTime: "08:45",
  type: "class",
  isInstructional: true,
  createdAt: "2026-09-17T00:00:00.000Z",
  updatedAt: "2026-09-17T00:00:00.000Z",
});

const entry = (
  id: string,
  timetableConfigId: string,
): BackendTimetableEntryDto => ({
  id,
  timetableConfigId,
  periodId: `${id}-period`,
  dayOfWeek: 1,
  period: {
    id: `${id}-period`,
    index: 1,
    label: "Period 1",
    startTime: "08:00",
    endTime: "08:45",
  },
  classroom: { id: "classroom-1", nameAr: "فصل", nameEn: "Classroom" },
  subject: { id: "subject-1", nameAr: "مادة", nameEn: "Subject", code: null },
  teacher: { userId: "teacher-1", fullName: "Teacher One" },
  room: null,
  teacherSubjectAllocationId: "allocation-1",
  notes: null,
  status: "active",
  createdAt: "2026-09-17T00:00:00.000Z",
  updatedAt: "2026-09-17T00:00:00.000Z",
});

const dashboardItem = (
  overrides: Partial<TimetableDashboardItemDto> = {},
): TimetableDashboardItemDto => ({
  classroomId: "classroom-1",
  classroom: { id: "classroom-1", nameAr: "فصل", nameEn: "Classroom" },
  gradeId: "grade-1",
  grade: { id: "grade-1", nameAr: "صف", nameEn: "Grade" },
  effectiveConfig,
  configs: [effectiveConfig],
  periods: [period("effective-period", "grade-config")],
  entries: [entry("effective-entry", "grade-config")],
  ...overrides,
});

describe("resolveEffectiveDashboardTimetable", () => {
  it("returns null when the backend has no effective config", () => {
    expect(
      resolveEffectiveDashboardTimetable(
        dashboardItem({ effectiveConfig: null }),
      ),
    ).toBeNull();
  });

  it("keeps only periods and entries owned by the effective config", () => {
    const resolved = resolveEffectiveDashboardTimetable(
      dashboardItem({
        periods: [
          period("effective-period", "grade-config"),
          period("draft-period", "classroom-draft"),
        ],
        entries: [
          entry("effective-entry", "grade-config"),
          entry("draft-entry", "classroom-draft"),
        ],
      }),
    );

    expect(resolved).toEqual({
      config: effectiveConfig,
      periods: [expect.objectContaining({ id: "effective-period" })],
      entries: [expect.objectContaining({ id: "effective-entry" })],
    });
  });
});

describe("dashboardConfigScopeId", () => {
  it.each([
    ["term", "term:term-1", undefined, "term-1"],
    ["stage", "stage:stage-1", "stage-1", "stage-1"],
    ["grade", "grade:grade-1", undefined, "grade-1"],
    ["section", "section:section-1", undefined, "section-1"],
    ["classroom", "classroom:classroom-1", undefined, "classroom-1"],
  ])(
    "resolves %s scope identity",
    (scopeType, scopeKey, stageId, expectedId) => {
      expect(
        dashboardConfigScopeId({
          ...effectiveConfig,
          scopeType,
          scopeKey,
          stageId: stageId ?? null,
        }),
      ).toBe(expectedId);
    },
  );

  it.each([
    ["grade", "section:grade-1"],
    ["grade", "grade:"],
    ["grade", "grade:grade-1:extra"],
    ["grade", "missing-separator"],
  ])("rejects malformed %s scope key %s", (scopeType, scopeKey) => {
    expect(
      dashboardConfigScopeId({ ...effectiveConfig, scopeType, scopeKey }),
    ).toBeUndefined();
  });
});
