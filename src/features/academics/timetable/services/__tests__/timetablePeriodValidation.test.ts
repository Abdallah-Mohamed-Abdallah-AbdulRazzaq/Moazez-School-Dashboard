import { describe, expect, it } from "vitest";
import type { BackendTimetablePeriodDto } from "@/features/academics/timetable/services/timetableApiTypes";
import { validatePeriodForm } from "@/features/academics/timetable/services/timetablePeriodValidation";

const existingPeriods: BackendTimetablePeriodDto[] = [
  {
    id: "period-1",
    timetableConfigId: "config-1",
    index: 1,
    label: "Period 1",
    startTime: "08:00",
    endTime: "08:45",
    type: "class",
    isInstructional: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "period-2",
    timetableConfigId: "config-1",
    index: 2,
    label: "Period 2",
    startTime: "09:00",
    endTime: "09:45",
    type: "class",
    isInstructional: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

describe("validatePeriodForm", () => {
  it("accepts non-overlapping periods with a unique index", () => {
    expect(
      validatePeriodForm(
        {
          index: 3,
          startTime: "10:00",
          endTime: "10:45",
        },
        existingPeriods,
      ),
    ).toEqual([]);
  });

  it("reports invalid time order, duplicate index, and overlap", () => {
    expect(
      validatePeriodForm(
        {
          index: 1,
          startTime: "08:30",
          endTime: "08:15",
        },
        existingPeriods,
      ),
    ).toEqual([
      "academics.timetable.invalid_time_range",
      "academics.timetable.period_index_taken",
      "academics.timetable.period_overlap",
    ]);
  });

  it("allows an edited period to keep its own index and time range", () => {
    expect(
      validatePeriodForm(
        {
          id: "period-1",
          index: 1,
          startTime: "08:00",
          endTime: "08:45",
        },
        existingPeriods,
      ),
    ).toEqual([]);
  });
});
