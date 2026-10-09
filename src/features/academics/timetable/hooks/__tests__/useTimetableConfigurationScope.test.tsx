import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useTimetableConfigurationScope } from "@/features/academics/timetable/hooks/useTimetableConfigurationScope";
import type { TimetableScopeSelection } from "@/features/academics/timetable/services/timetableScope";

describe("useTimetableConfigurationScope", () => {
  it("opens the selected scope by default", () => {
    const { result } = renderHook(() =>
      useTimetableConfigurationScope({ scopeType: "STAGE", stageId: "stage-1" }),
    );

    expect(result.current.configurationScope).toEqual({
      scopeType: "STAGE",
      stageId: "stage-1",
    });
  });

  it("keeps a custom configuration aligned with changing filters", () => {
    const { result, rerender } = renderHook(
      ({ filteredScope }: { filteredScope: TimetableScopeSelection }) =>
        useTimetableConfigurationScope(filteredScope),
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
      }),
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
});
