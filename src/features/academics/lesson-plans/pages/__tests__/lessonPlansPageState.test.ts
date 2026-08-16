import { describe, expect, it } from "vitest";
import {
  canEditLessonPlans,
  canOpenAutoPlan,
  missingDataStatusForLessonPlansView,
  resolveLessonPlansView,
} from "../lessonPlansPageState";

describe("lesson plans mutation gate", () => {
  it.each([
    [{ canManage: true, termStatus: "open" }, true],
    [{ canManage: true, termStatus: "closed" }, false],
    [{ canManage: false, termStatus: "open" }, false],
  ])(
    "derives editability from permission and term state",
    (input, expected) => expect(canEditLessonPlans(input)).toBe(expected),
  );

  it.each([
    [{ canManage: true, canPreview: true }, true],
    [{ canManage: true, canPreview: false }, false],
    [{ canManage: false, canPreview: true }, false],
  ])("gates opening Auto-plan by permission and preview readiness", (input, expected) => {
    expect(canOpenAutoPlan(input)).toBe(expected);
  });
});

describe("lesson plans page state", () => {
  const resolvedScope = {
    loading: false,
    scopeResolved: true,
    dataChecked: true,
    selectedSectionId: "classroom-1",
    selectedSubjectId: "subject-1",
    teacherSubjectAllocationId: "allocation-1",
    curriculumId: "curriculum-1",
    weeks: [{}],
    lessons: [{}],
  };

  it.each([
    [{ loading: true }, "loading"],
    [{ selectedSectionId: undefined }, "no-selection"],
    [{ teacherSubjectAllocationId: undefined }, "no-allocation"],
    [{ curriculumId: undefined }, "no-curriculum"],
    [{ dataChecked: false }, "loading"],
    [{ weeks: [] }, "no-weeks"],
    [{ lessons: [] }, "no-lessons"],
    [{}, "ready"],
  ] as const)("resolves scoped data to %s", (overrides, expected) => {
    expect(resolveLessonPlansView({ ...resolvedScope, ...overrides })).toBe(
      expected,
    );
  });

  it.each([
    ["missing-grade", "missing-grade"],
    ["missing-section", "missing-section"],
    ["missing-classroom", "missing-classroom"],
    ["missing-subject", "missing-subject"],
    ["missing-teacher-allocation", "missing-teacher-allocation"],
    ["missing-curriculum", "missing-curriculum"],
  ] as const)("maps scope status %s to its CTA", (scopeStatus, expected) => {
    expect(
      missingDataStatusForLessonPlansView(scopeStatus, "no-selection"),
    ).toBe(expected);
  });

  it("maps resolved missing data while excluding selection-only states", () => {
    expect(
      missingDataStatusForLessonPlansView("ready", "no-allocation"),
    ).toBe("missing-teacher-allocation");
    expect(
      missingDataStatusForLessonPlansView("ready", "no-curriculum"),
    ).toBe("missing-curriculum");
    expect(missingDataStatusForLessonPlansView("ready", "no-lessons")).toBe(
      "no-curriculum-lessons",
    );
    expect(
      missingDataStatusForLessonPlansView("ready", "no-selection"),
    ).toBeNull();
    expect(
      missingDataStatusForLessonPlansView("ready", "no-weeks"),
    ).toBeNull();
  });
});
