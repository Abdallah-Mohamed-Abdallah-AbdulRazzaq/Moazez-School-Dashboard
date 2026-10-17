import { describe, expect, it } from "vitest";
import {
  createTimetablePublishFingerprint,
  type TimetablePublishFingerprintInput,
} from "../timetablePublishFingerprint";
import type { BackendTimetablePeriodDto } from "../timetableApiTypes";

const period: BackendTimetablePeriodDto = {
  id: "period-1",
  timetableConfigId: "config-1",
  index: 1,
  label: "First period",
  startTime: "08:00",
  endTime: "08:45",
  type: "class",
  isInstructional: true,
  createdAt: "2026-10-16",
  updatedAt: "2026-10-16",
};
const input: TimetablePublishFingerprintInput = {
  configId: "config-1",
  scope: { gradeId: "grade-1", sectionId: "section-1" },
  activeDays: [1, 0],
  periods: [
    period,
    {
      ...period,
      id: "break-1",
      index: 2,
      startTime: "08:45",
      endTime: "09:00",
      type: "break",
      isInstructional: false,
    },
  ],
  entries: [
    {
      id: "entry-2",
      classroomId: "classroom-2",
      dayKey: "tue",
      periodIndex: 1,
      subjectId: "subject-2",
      teacherId: "teacher-2",
      roomId: null,
      termId: "term-1",
      sectionId: "section-1",
    },
    {
      id: "entry-1",
      classroomId: "classroom-1",
      dayKey: "mon",
      periodIndex: 1,
      subjectId: "subject-1",
      teacherId: "teacher-1",
      roomId: null,
      termId: "term-1",
      sectionId: "section-1",
    },
  ],
};

describe("createTimetablePublishFingerprint", () => {
  it("is stable for equivalent ordering and changes with draft content", () => {
    expect(createTimetablePublishFingerprint(input)).toBe(
      createTimetablePublishFingerprint({
        ...input,
        activeDays: [0, 1],
        periods: [...input.periods].reverse(),
        entries: [...input.entries].reverse(),
      }),
    );
    expect(createTimetablePublishFingerprint(input)).not.toBe(
      createTimetablePublishFingerprint({ ...input, activeDays: [0] }),
    );
  });
  it.each([
    {
      label: "Teaching period timing",
      periods: [{ ...period, startTime: "07:30" }, input.periods[1]],
    },
    {
      label: "Break timing",
      periods: [period, { ...input.periods[1], endTime: "09:15" }],
    },
  ])("invalidates confirmation after $label changes", ({ periods }) => {
    expect(createTimetablePublishFingerprint({ ...input, periods })).not.toBe(
      createTimetablePublishFingerprint(input),
    );
  });
  it("invalidates confirmation when another classroom in the same configuration changes", () => {
    expect(
      createTimetablePublishFingerprint({
        ...input,
        entries: input.entries.map((entry) =>
          entry.classroomId === "classroom-2"
            ? { ...entry, teacherId: "teacher-3" }
            : entry,
        ),
      }),
    ).not.toBe(createTimetablePublishFingerprint(input));
  });
});
