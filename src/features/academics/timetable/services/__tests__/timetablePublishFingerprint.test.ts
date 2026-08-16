import { describe, expect, it } from "vitest";
import { createTimetablePublishFingerprint } from "@/features/academics/timetable/services/timetablePublishFingerprint";

const input = {
  configId: "config-1",
  scope: { gradeId: "grade-1", sectionId: "section-1" },
  activeDays: [1, 0],
  periods: [
    { id: "period-2", index: 2, isInstructional: true },
    { id: "period-1", index: 1, isInstructional: true },
  ],
  entries: [
    {
      id: "entry-2", dayKey: "tue", periodIndex: 2, subjectId: "subject-2",
      teacherId: "teacher-2", roomId: null, termId: "term-1", sectionId: "section-1",
    },
    {
      id: "entry-1", dayKey: "mon", periodIndex: 1, subjectId: "subject-1",
      teacherId: "teacher-1", roomId: null, termId: "term-1", sectionId: "section-1",
    },
  ],
} as const;

describe("createTimetablePublishFingerprint", () => {
  it("is stable for equivalent ordering and changes with draft content", () => {
    expect(createTimetablePublishFingerprint(input as never)).toBe(
      createTimetablePublishFingerprint({
        ...input,
        activeDays: [0, 1],
        periods: [...input.periods].reverse(),
        entries: [...input.entries].reverse(),
      } as never),
    );
    expect(createTimetablePublishFingerprint(input as never)).not.toBe(
      createTimetablePublishFingerprint({ ...input, activeDays: [0] } as never),
    );
  });
});
