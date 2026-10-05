import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAcademicContentBrowseOptions } from "../useAcademicContentBrowseOptions";

const academicContext = vi.hoisted(() => ({
  academicYearId: "year-1",
  termId: "term-1",
}));
const loadAcademicTargetOptions = vi.hoisted(() => vi.fn());
const listTeachers = vi.hoisted(() => vi.fn());

vi.mock("@/features/academics/hooks/AcademicYearTermLayoutContext", () => ({
  useAcademicYearTermLayoutContext: () => academicContext,
}));
vi.mock("../../services/academicContentSelectors", () => ({
  loadAcademicTargetOptions,
}));
vi.mock("@/features/teachers/services/teacherApi", () => ({
  teacherApi: { list: listTeachers },
}));

const targetOptions = {
  structure: { stages: [], grades: [], sections: [], classrooms: [] },
  subjects: [],
  subjectAllocations: [],
  teacherAllocations: [],
};
const teachersResponse = {
  items: [
    {
      id: "teacher-profile-1",
      userId: "teacher-user-1",
      displayName: { firstName: "Mona", lastName: "Ali", fullName: "Mona Ali" },
    },
  ],
  pagination: { page: 1, limit: 100, total: 1 },
};

function deferred<T>() {
  let resolve!: (resolvedValue: T) => void;
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
}

describe("useAcademicContentBrowseOptions", () => {
  beforeEach(() => {
    academicContext.academicYearId = "year-1";
    academicContext.termId = "term-1";
    loadAcademicTargetOptions.mockReset().mockResolvedValue(targetOptions);
    listTeachers.mockReset().mockResolvedValue(teachersResponse);
  });

  it("loads academic and teacher display options for the selected context", async () => {
    const { result } = renderHook(() => useAcademicContentBrowseOptions());

    await waitFor(() => expect(result.current.isLoadingTargets).toBe(false));

    expect(result.current.targetOptions).toEqual(targetOptions);
    expect(result.current.teachers).toEqual(teachersResponse.items);
    expect(result.current.targetOptionsUnavailable).toBe(false);
    expect(result.current.teachersUnavailable).toBe(false);
    expect(loadAcademicTargetOptions).toHaveBeenCalledWith({
      academicYearId: "year-1",
      termId: "term-1",
    });
    expect(listTeachers).toHaveBeenCalledWith({ page: 1, limit: 100 });
  });

  it("keeps academic options usable when teacher loading fails", async () => {
    listTeachers.mockRejectedValue(new Error("Teacher directory unavailable"));
    const { result } = renderHook(() => useAcademicContentBrowseOptions());

    await waitFor(() => expect(result.current.isLoadingTeachers).toBe(false));

    expect(result.current.targetOptions).toEqual(targetOptions);
    expect(result.current.targetOptionsUnavailable).toBe(false);
    expect(result.current.teachers).toEqual([]);
    expect(result.current.teachersUnavailable).toBe(true);
  });

  it("skips teacher loading when teacher options are excluded", async () => {
    const { result } = renderHook(() =>
      useAcademicContentBrowseOptions({ includeTeachers: false }),
    );

    await waitFor(() => expect(result.current.isLoadingTargets).toBe(false));

    expect(result.current.targetOptions).toEqual(targetOptions);
    expect(result.current.teachers).toEqual([]);
    expect(result.current.isLoadingTeachers).toBe(false);
    expect(listTeachers).not.toHaveBeenCalled();
  });

  it("ignores a stale academic response after the context changes", async () => {
    const staleOptions = deferred<typeof targetOptions>();
    const currentOptions = {
      ...targetOptions,
      subjects: [{ id: "subject-2", name: "Science" }],
    };
    loadAcademicTargetOptions
      .mockReturnValueOnce(staleOptions.promise)
      .mockResolvedValueOnce(currentOptions);
    const { result, rerender } = renderHook(() =>
      useAcademicContentBrowseOptions({ includeTeachers: false }),
    );

    academicContext.academicYearId = "year-2";
    academicContext.termId = "term-2";
    rerender();
    await waitFor(() =>
      expect(result.current.targetOptions).toEqual(currentOptions),
    );

    await act(async () => staleOptions.resolve(targetOptions));

    expect(result.current.targetOptions).toEqual(currentOptions);
  });
});
