import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDashboardTimetable } from "@/features/academics/timetable/services/timetableApiAdapter";
import type { TimetableDashboardItemDto } from "@/features/academics/timetable/services/timetableApiTypes";
import {
  fetchEffectiveAttendanceTimetable,
  resolveEffectiveAttendanceTimetable,
} from "../effectiveAttendanceTimetable";

vi.mock("@/features/academics/timetable/services/timetableApiAdapter", () => ({
  getDashboardTimetable: vi.fn(),
}));

const mockedGetDashboardTimetable = vi.mocked(getDashboardTimetable);

describe("effectiveAttendanceTimetable", () => {
  beforeEach(() => {
    mockedGetDashboardTimetable.mockReset();
  });

  it("uses the backend-selected published ancestor instead of a classroom draft", async () => {
    mockedGetDashboardTimetable.mockResolvedValue({
      termId: "term-1",
      academicYearId: "year-1",
      publishedAt: "2026-09-10T00:00:00.000Z",
      isPublished: true,
      items: [dashboardItem("classroom-1", "stage-config")],
    });

    const timetable = await fetchEffectiveAttendanceTimetable({
      academicYearId: "year-1",
      termId: "term-1",
      scopeType: "CLASSROOM",
      scopeIds: { classroomId: "classroom-1" },
    });

    expect(timetable).toEqual({
      activeDayIndexes: [0, 1, 2, 3, 4],
      periods: [expect.objectContaining({ id: "stage-period", index: 1 })],
    });
  });

  it("does not combine period ids from different effective configs", () => {
    const timetable = resolveEffectiveAttendanceTimetable(
      [
        dashboardItem("classroom-1", "stage-config"),
        dashboardItem("classroom-2", "classroom-config"),
      ],
      ["classroom-1", "classroom-2"],
    );

    expect(timetable.periods).toEqual([]);
    expect(timetable.activeDayIndexes).toEqual([0, 1, 2, 3, 4]);
  });

  it("rejects a partial dashboard response for the selected scope", () => {
    expect(
      resolveEffectiveAttendanceTimetable(
        [dashboardItem("classroom-1", "stage-config")],
        ["classroom-1", "classroom-2"],
      ),
    ).toEqual({ periods: [], activeDayIndexes: [] });
  });
});

function dashboardItem(
  classroomId: string,
  effectiveConfigId: string,
): TimetableDashboardItemDto {
  return {
    classroomId,
    classroom: { id: classroomId, nameAr: "فصل", nameEn: "Classroom" },
    gradeId: "grade-1",
    grade: { id: "grade-1", nameAr: "صف", nameEn: "Grade" },
    effectiveConfig: {
      id: effectiveConfigId,
      name: "Published timetable",
      scopeType: "stage",
      scopeKey: "stage-1",
      stageId: "stage-1",
      status: "active",
      activeDays: [0, 1, 2, 3, 4],
    },
    configs: [
      {
        id: "classroom-draft",
        name: "Draft override",
        scopeType: "classroom",
        scopeKey: classroomId,
        stageId: "stage-1",
        status: "draft",
        activeDays: [0, 1, 2, 3, 4],
      },
    ],
    periods: [
      period(
        `${effectiveConfigId === "stage-config" ? "stage" : "classroom"}-period`,
        effectiveConfigId,
      ),
      period("draft-period", "classroom-draft"),
    ],
    entries: [],
  };
}

function period(id: string, timetableConfigId: string) {
  return {
    id,
    timetableConfigId,
    index: 1,
    label: "Period 1",
    startTime: "08:00",
    endTime: "08:45",
    type: "class",
    isInstructional: true,
    createdAt: "2026-09-10T00:00:00.000Z",
    updatedAt: "2026-09-10T00:00:00.000Z",
  };
}
