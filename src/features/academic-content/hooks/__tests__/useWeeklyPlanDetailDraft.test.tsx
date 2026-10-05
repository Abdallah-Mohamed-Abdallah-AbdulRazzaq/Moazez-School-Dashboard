import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { emptyWeeklyPlanDetail } from "../../model/weeklyPlanDetail";
import { useWeeklyPlanDetailDraft } from "../useWeeklyPlanDetailDraft";

const cleanSection = { dirty: false, saving: false, error: null };

describe("useWeeklyPlanDetailDraft", () => {
  it("preserves every untouched field in a complete save", async () => {
    const onSave = vi.fn().mockResolvedValue(true);
    const initial = {
      ...emptyWeeklyPlanDetail("2026-09-01"),
      topics: ["Solar system"],
      expectedHomework: "Read chapter 1",
      upcomingAssessments: "Quiz",
      notes: "Bring models",
      homeworkAssignmentIds: ["homework-1"],
      gradeAssessmentIds: ["assessment-1"],
    };
    const { result } = renderHook(() =>
      useWeeklyPlanDetailDraft({
        initial,
        contentVersion: "content-1:v1",
        sectionState: cleanSection,
        termBounds: { startDate: "2026-09-01", endDate: "2026-12-31" },
        onDirty: vi.fn(),
        onSave,
      }),
    );

    act(() => result.current.update("objectives", ["Compare planets"]));
    await act(() => result.current.save());

    expect(onSave).toHaveBeenCalledWith({
      weekStartDate: "2026-09-01",
      weekEndDate: "2026-09-01",
      objectives: ["Compare planets"],
      topics: ["Solar system"],
      expectedHomework: "Read chapter 1",
      upcomingAssessments: "Quiz",
      notes: "Bring models",
      homeworkAssignmentIds: ["homework-1"],
      gradeAssessmentIds: ["assessment-1"],
    });
  });

  it("keeps the draft and exposes validation when save is blocked", async () => {
    const onSave = vi.fn();
    const { result } = renderHook(() =>
      useWeeklyPlanDetailDraft({
        initial: emptyWeeklyPlanDetail(),
        contentVersion: "content-1:v1",
        sectionState: cleanSection,
        onDirty: vi.fn(),
        onSave,
      }),
    );

    act(() => result.current.update("topics", ["Local topic"]));
    await act(() => result.current.save());

    expect(result.current.draft.topics).toEqual(["Local topic"]);
    expect(result.current.validationError).toBe("dates_required");
    expect(onSave).not.toHaveBeenCalled();
  });
});
