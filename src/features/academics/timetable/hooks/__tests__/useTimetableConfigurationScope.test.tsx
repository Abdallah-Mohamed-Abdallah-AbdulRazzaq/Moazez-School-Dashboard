import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useTimetableConfigurationScope } from "@/features/academics/timetable/hooks/useTimetableConfigurationScope";
import type { TimetableScopeSelection } from "@/features/academics/timetable/services/timetableScope";

const navigation = vi.hoisted(() => ({
  params: new URLSearchParams(),
  replace: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useSearchParams: () => navigation.params,
  useRouter: () => ({ replace: navigation.replace }),
}));

const preferenceContext = {
  userId: "user-1",
  schoolId: "school-1",
  termId: "term-1",
};

describe("useTimetableConfigurationScope", () => {
  beforeEach(() => {
    localStorage.clear();
    navigation.params = new URLSearchParams();
    vi.clearAllMocks();
  });
  it("opens the selected scope by default", () => {
    const { result } = renderHook(() =>
      useTimetableConfigurationScope(
        { scopeType: "STAGE", stageId: "stage-1" },
        preferenceContext,
      ),
    );

    expect(result.current.configurationScope).toEqual({
      scopeType: "STAGE",
      stageId: "stage-1",
    });
  });

  it("adds an explicit editing scope to older classroom-filter links", () => {
    navigation.params = new URLSearchParams("stage=stage-1");
    renderHook(() =>
      useTimetableConfigurationScope(
        { scopeType: "STAGE", stageId: "stage-1" },
        { ...preferenceContext, configurationQuery: "stage=stage-1" },
      ),
    );
    expect(navigation.replace).toHaveBeenCalledWith(
      "?stage=stage-1&workspace=1&configurationScope=STAGE&scopeId=stage-1",
      { scroll: false },
    );
  });

  it("retains the editing configuration when unsaved changes hold the previous URL selection", () => {
    const retainedQuery =
      "configurationScope=GRADE&scopeId=grade-1&configuration=grade-config";
    navigation.params = new URLSearchParams(retainedQuery);
    const { result, rerender } = renderHook(() =>
      useTimetableConfigurationScope(
        { scopeType: "CLASSROOM", classroomId: "class-1" },
        { ...preferenceContext, configurationQuery: retainedQuery },
      ),
    );
    navigation.params = new URLSearchParams(
      "configurationScope=TERM&configuration=term-config",
    );
    rerender();
    expect(result.current.configurationScope).toEqual({
      scopeType: "GRADE",
      gradeId: "grade-1",
    });
    expect(result.current.linkedConfigurationId).toBe("grade-config");
  });

  it("keeps the editing configuration fixed when classroom filters change", () => {
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
      scopeType: "STAGE",
      stageId: "stage-1",
    });
  });

  it("returns to the term default only when the user requests it", () => {
    const { result } = renderHook(() =>
      useTimetableConfigurationScope(
        {
          scopeType: "CLASSROOM",
          classroomId: "classroom-1",
        },
        preferenceContext,
      ),
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
    const firstVisit = renderHook(() =>
      useTimetableConfigurationScope(
        { scopeType: "STAGE", stageId: "stage-1" },
        preferenceContext,
      ),
    );
    act(() => firstVisit.result.current.returnToTermDefault());
    firstVisit.unmount();

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
    expect(result.current.configurationScope).toEqual({ scopeType: "TERM" });
    rerender({ filteredScope: { scopeType: "GRADE", gradeId: "grade-2" } });
    expect(result.current.configurationScope).toEqual({ scopeType: "TERM" });

    act(() => result.current.customizeFilteredScope());
    expect(result.current.configurationScope).toEqual({
      scopeType: "GRADE",
      gradeId: "grade-2",
    });
  });

  it.each([
    { ...preferenceContext, userId: "user-2" },
    { ...preferenceContext, termId: "term-2" },
    { ...preferenceContext, schoolId: "school-2" },
  ])(
    "isolates the choice when the preference context changes to %j",
    (otherContext) => {
      const { result, rerender } = renderHook(
        ({ context }) =>
          useTimetableConfigurationScope(
            { scopeType: "STAGE", stageId: "stage-1" },
            context,
          ),
        { initialProps: { context: preferenceContext } },
      );
      act(() => result.current.returnToTermDefault());
      rerender({ context: otherContext });
      expect(result.current.configurationScope).toEqual({
        scopeType: "STAGE",
        stageId: "stage-1",
      });
      rerender({ context: preferenceContext });
      expect(result.current.configurationScope).toEqual({ scopeType: "TERM" });
    },
  );
  it("opens the classroom issue action with inheritance allowed instead of a saved term preference", () => {
    const storageKey = `timetable-configuration:${JSON.stringify(["user-1", "school-1", "term-1"])}`;
    localStorage.setItem(storageKey, "term");
    navigation.params = new URLSearchParams(
      "year=year-1&term=term-1&classroom=classroom-1&configurationScope=CLASSROOM&scopeId=classroom-1",
    );
    const { result } = renderHook(() =>
      useTimetableConfigurationScope(
        { scopeType: "CLASSROOM", classroomId: "classroom-1" },
        preferenceContext,
      ),
    );
    expect(result.current.configurationScope).toEqual({
      scopeType: "CLASSROOM",
      classroomId: "classroom-1",
    });
    expect(result.current.linkedConfigurationId).toBeNull();
    expect(localStorage.getItem(storageKey)).toBe("term");
    act(() => result.current.returnToTermDefault());
    expect(result.current.configurationScope).toEqual({ scopeType: "TERM" });
    expect(navigation.replace).toHaveBeenCalledWith(
      "?year=year-1&term=term-1&classroom=classroom-1&workspace=1&configurationScope=TERM",
      { scroll: false },
    );
  });

  it("opens a linked grade configuration despite the saved term preference without changing another tab", () => {
    const storageKey = `timetable-configuration:${JSON.stringify(["user-1", "school-1", "term-1"])}`;
    localStorage.setItem(storageKey, "term");
    navigation.params = new URLSearchParams(
      "configuration=grade-config&configurationScope=GRADE&scopeId=grade-1&classroom=classroom-1&entry=lesson-1",
    );
    const { result, rerender } = renderHook(() =>
      useTimetableConfigurationScope(
        { scopeType: "CLASSROOM", classroomId: "classroom-1" },
        preferenceContext,
      ),
    );
    expect(result.current.configurationScope).toEqual({
      scopeType: "GRADE",
      gradeId: "grade-1",
    });
    expect(result.current.linkedConfigurationId).toBe("grade-config");
    expect(localStorage.getItem(storageKey)).toBe("term");
    act(() => result.current.returnToTermDefault());
    expect(result.current.configurationScope).toEqual({ scopeType: "TERM" });
    expect(result.current.linkedConfigurationId).toBeNull();
    expect(navigation.replace).toHaveBeenCalledWith(
      "?classroom=classroom-1&workspace=1&configurationScope=TERM",
      {
        scroll: false,
      },
    );
    const conflictParams = navigation.params;
    navigation.params = new URLSearchParams("classroom=classroom-1");
    rerender();
    navigation.params = conflictParams;
    rerender();
    expect(result.current.configurationScope).toEqual({
      scopeType: "GRADE",
      gradeId: "grade-1",
    });
  });
});
