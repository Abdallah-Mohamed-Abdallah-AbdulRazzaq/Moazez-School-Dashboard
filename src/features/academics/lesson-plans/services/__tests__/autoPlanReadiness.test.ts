import { describe, expect, it } from "vitest";
import { getAutoPlanReadiness } from "../autoPlanReadiness";

const readyInput = {
  scopeStatus: "ready" as const,
  termId: "term-1",
  teacherSubjectAllocationId: "allocation-1",
  curriculumId: "curriculum-1",
  lessons: [{ id: "lesson-1" }] as never,
  selectedSubjectId: "subject-1",
  selectedGradeId: "grade-1",
  selectedClassroomId: "classroom-1",
  teacherAllocation: {
    id: "allocation-1",
    subjectId: "subject-1",
    classroomId: "classroom-1",
  },
  curriculum: {
    id: "curriculum-1",
    subjectId: "subject-1",
    gradeId: "grade-1",
  },
  timetableSlotsKnown: { hasSlots: true },
  termStartDate: "2026-09-01",
  termEndDate: "2026-12-31",
  termStatus: "open",
};

describe("auto plan readiness", () => {
  it("allows closed-term preview while blocking apply", () => {
    expect(
      getAutoPlanReadiness({ ...readyInput, termStatus: "closed" }),
    ).toMatchObject({
      canPreview: true,
      canApply: false,
      previewBlockingReasons: [],
      applyBlockingReasons: ["closed_term"],
    });
  });

  it("allows both actions for a complete open-term scope", () => {
    expect(getAutoPlanReadiness(readyInput)).toMatchObject({
      canPreview: true,
      canApply: true,
      previewBlockingReasons: [],
      applyBlockingReasons: [],
      warnings: [],
    });
  });

  it.each([
    [{ curriculumId: undefined }, "missing_curriculum"],
    [{ teacherSubjectAllocationId: undefined }, "missing_teacher_allocation"],
    [{ selectedClassroomId: undefined }, "missing_classroom"],
    [{ lessons: [] }, "no_curriculum_lessons"],
    [{ termStartDate: undefined }, "invalid_date_range"],
    [{ timetableSlotsKnown: { hasSlots: false } }, "no_timetable_slots_if_known"],
  ] as const)("blocks preview and apply for shared prerequisite %s", (override, reason) => {
    expect(getAutoPlanReadiness({ ...readyInput, ...override })).toMatchObject({
      canPreview: false,
      canApply: false,
      previewBlockingReasons: expect.arrayContaining([reason]),
      applyBlockingReasons: expect.arrayContaining([reason]),
    });
  });

  it("keeps unknown slot availability as a warning for both actions", () => {
    expect(
      getAutoPlanReadiness({ ...readyInput, timetableSlotsKnown: null }),
    ).toMatchObject({
      canPreview: true,
      canApply: true,
      previewBlockingReasons: [],
      applyBlockingReasons: [],
      warnings: ["timetable_slots_backend_check"],
    });
  });
});
