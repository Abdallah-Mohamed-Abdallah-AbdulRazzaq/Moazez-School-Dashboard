import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { StructureTree } from "@/features/academics/academic-structure-tree/services/structureService";
import { useNedaaAcademicStructure } from "../useNedaaAcademicStructure";

const fetchStructureTreeMock = vi.fn();
const context = {
  academicYearId: "year-1",
  termId: "term-1",
  isInitializing: false,
};

vi.mock(
  "@/features/academics/academic-structure-tree/services/structureService",
  () => ({
    fetchStructureTree: (...args: unknown[]) => fetchStructureTreeMock(...args),
  }),
);

vi.mock("@/features/academics/hooks/AcademicYearTermLayoutContext", () => ({
  useAcademicYearTermLayoutContext: () => context,
}));

const tree = (stageId: string): StructureTree => ({
  stages: [
    { id: stageId, name: stageId, nameAr: stageId, nameEn: stageId, order: 1 },
  ],
  grades: [],
  sections: [],
  classrooms: [],
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

describe("useNedaaAcademicStructure", () => {
  beforeEach(() => {
    fetchStructureTreeMock.mockReset();
    context.academicYearId = "year-1";
    context.termId = "term-1";
    context.isInitializing = false;
  });

  it("loads the selected year and term tree", async () => {
    fetchStructureTreeMock.mockResolvedValue(tree("stage-1"));
    const { result } = renderHook(() => useNedaaAcademicStructure());

    await waitFor(() => expect(result.current.tree).toEqual(tree("stage-1")));
    expect(fetchStructureTreeMock).toHaveBeenCalledWith("year-1", "term-1");
  });

  it("ignores a stale tree after context changes", async () => {
    const first = deferred<StructureTree>();
    const second = deferred<StructureTree>();
    fetchStructureTreeMock
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const { result, rerender } = renderHook(() => useNedaaAcademicStructure());

    context.academicYearId = "year-2";
    rerender();
    await act(async () => second.resolve(tree("stage-2")));
    await waitFor(() => expect(result.current.tree).toEqual(tree("stage-2")));
    await act(async () => first.resolve(tree("stage-1")));
    expect(result.current.tree).toEqual(tree("stage-2"));
  });

  it("recovers after retrying a failed tree request", async () => {
    fetchStructureTreeMock
      .mockRejectedValueOnce(new Error("tree failed"))
      .mockResolvedValueOnce(tree("stage-1"));
    const { result } = renderHook(() => useNedaaAcademicStructure());

    await waitFor(() => expect(result.current.error).toBe("tree failed"));
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.tree).toEqual(tree("stage-1")));
    expect(result.current.error).toBeNull();
  });
});
