import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useTimetableConfigurationScope } from "@/features/academics/timetable/hooks/useTimetableConfigurationScope";
import type { TimetableScopeSelection } from "@/features/academics/timetable/services/timetableScope";

const preferenceContext = { userId: "user-1", schoolId: "school-1", termId: "term-1" };

describe("useTimetableConfigurationScope", () => {
  beforeEach(() => localStorage.clear());
  it("opens the selected scope by default", () => {
    const { result } = renderHook(() =>
      useTimetableConfigurationScope({ scopeType: "STAGE", stageId: "stage-1" }, preferenceContext),
    );

    expect(result.current.configurationScope).toEqual({
      scopeType: "STAGE",
      stageId: "stage-1",
    });
  });

  it("keeps a custom configuration aligned with changing filters", () => {
    const { result, rerender } = renderHook(
      ({ filteredScope }: { filteredScope: TimetableScopeSelection }) =>
        useTimetableConfigurationScope(filteredScope, preferenceContext),
      {
        initialProps: {
          filteredScope: {
            scopeType: "STAGE",
            stageId: "stage-1",
          } as TimetableScopeSelection,
        },
      },
    );

    rerender({
      filteredScope: { scopeType: "GRADE", gradeId: "grade-2" },
    });

    expect(result.current.configurationScope).toEqual({
      scopeType: "GRADE",
      gradeId: "grade-2",
    });
  });

  it("returns to the term default only when the user requests it", () => {
    const { result } = renderHook(() =>
      useTimetableConfigurationScope({
        scopeType: "CLASSROOM",
        classroomId: "classroom-1",
      }, preferenceContext),
    );

    act(() => result.current.returnToTermDefault());

    expect(result.current.configurationScope).toEqual({ scopeType: "TERM" });
    expect(result.current.isTermDefaultConfiguration).toBe(true);

    act(() => result.current.customizeFilteredScope());

    expect(result.current.configurationScope).toEqual({
      scopeType: "CLASSROOM",
      classroomId: "classroom-1",
    });
  });

  it("keeps the term configuration after reload and filter changes", () => {
    const firstVisit = renderHook(() => useTimetableConfigurationScope(
      { scopeType: "STAGE", stageId: "stage-1" }, preferenceContext,
    ));
    act(() => firstVisit.result.current.returnToTermDefault());
    firstVisit.unmount();

    const { result, rerender } = renderHook(
      ({ filteredScope }: { filteredScope: TimetableScopeSelection }) =>
        useTimetableConfigurationScope(filteredScope, preferenceContext),
      { initialProps: { filteredScope: { scopeType: "STAGE", stageId: "stage-1" } as TimetableScopeSelection } },
    );
    expect(result.current.configurationScope).toEqual({ scopeType: "TERM" });
    rerender({ filteredScope: { scopeType: "GRADE", gradeId: "grade-2" } });
    expect(result.current.configurationScope).toEqual({ scopeType: "TERM" });

    act(() => result.current.customizeFilteredScope());
    expect(result.current.configurationScope).toEqual({ scopeType: "GRADE", gradeId: "grade-2" });
  });

  it.each([
    { ...preferenceContext, userId: "user-2" },
    { ...preferenceContext, termId: "term-2" },
    { ...preferenceContext, schoolId: "school-2" },
  ])("isolates the choice when the preference context changes to %j", (otherContext) => {
    const { result, rerender } = renderHook(
      ({ context }) => useTimetableConfigurationScope({ scopeType: "STAGE", stageId: "stage-1" }, context),
      { initialProps: { context: preferenceContext } },
    );
    act(() => result.current.returnToTermDefault());
    rerender({ context: otherContext });
    expect(result.current.configurationScope).toEqual({ scopeType: "STAGE", stageId: "stage-1" });
    rerender({ context: preferenceContext });
    expect(result.current.configurationScope).toEqual({ scopeType: "TERM" });
  });
});
