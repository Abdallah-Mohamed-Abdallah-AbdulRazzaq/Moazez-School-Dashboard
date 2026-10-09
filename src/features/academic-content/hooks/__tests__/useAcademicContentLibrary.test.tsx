import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAcademicContentLibrary } from "../useAcademicContentLibrary";

const navigationState = vi.hoisted(() => ({
  query: "year=year-1&term=term-1",
  replace: vi.fn(),
}));

const listAcademicContent = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/academic-content-hub",
  useRouter: () => ({ replace: navigationState.replace }),
  useSearchParams: () => new URLSearchParams(navigationState.query),
}));

vi.mock(
  "@/features/academics/hooks/AcademicYearTermLayoutContext",
  () => ({
    useAcademicYearTermLayoutContext: () => ({
      academicYearId: "year-1",
      termId: "term-1",
    }),
  }),
);

vi.mock("../../services/academicContentApi", () => ({ listAcademicContent }));

function libraryResponse(title: string, total: number) {
  return {
    items: [
      {
        id: title,
        academicYearId: "year-1",
        termId: "term-1",
        type: "GENERAL_RESOURCE",
        audience: "INTERNAL_STAFF",
        title,
        description: null,
        status: "DRAFT",
        archivedAt: null,
        createdAt: "2026-09-29T08:00:00.000Z",
        updatedAt: "2026-09-29T08:00:00.000Z",
        summary: null,
      },
    ],
    page: 1,
    limit: 50,
    total,
  };
}

function deferred<T>() {
  let resolve!: (resolvedValue: T) => void;
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
}

describe("useAcademicContentLibrary", () => {
  beforeEach(() => {
    navigationState.query = "year=year-1&term=term-1";
    navigationState.replace.mockReset();
    listAcademicContent.mockReset().mockResolvedValue(libraryResponse("First", 73));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("loads the selected academic context with server pagination defaults", async () => {
    const { result } = renderHook(() => useAcademicContentLibrary());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(listAcademicContent).toHaveBeenCalledWith(
      expect.objectContaining({
        academicYearId: "year-1",
        termId: "term-1",
        page: 1,
        limit: 50,
      }),
    );
    expect(result.current.total).toBe(73);
  });

  it("debounces search, preserves context, and resets the page", async () => {
    vi.useFakeTimers();
    navigationState.query = "year=year-1&term=term-1&page=3";
    const { result } = renderHook(() => useAcademicContentLibrary());

    act(() => result.current.setSearch("fractions"));
    act(() => vi.advanceTimersByTime(299));
    expect(navigationState.replace).not.toHaveBeenCalled();

    await act(async () => vi.advanceTimersByTime(1));

    expect(navigationState.replace).toHaveBeenLastCalledWith(
      "/en/academic-content-hub?year=year-1&term=term-1&search=fractions",
      { scroll: false },
    );
  });

  it("ignores an older response after filters change", async () => {
    const firstRequest = deferred<ReturnType<typeof libraryResponse>>();
    const secondRequest = deferred<ReturnType<typeof libraryResponse>>();
    listAcademicContent
      .mockReturnValueOnce(firstRequest.promise)
      .mockReturnValueOnce(secondRequest.promise);

    const { result, rerender } = renderHook(() => useAcademicContentLibrary());
    navigationState.query =
      "year=year-1&term=term-1&type=WEEKLY_PLAN";
    rerender();

    await act(async () => {
      secondRequest.resolve(libraryResponse("New filters", 1));
    });
    expect(result.current.items[0]?.title).toBe("New filters");

    await act(async () => {
      firstRequest.resolve(libraryResponse("Stale filters", 99));
    });
    expect(result.current.items[0]?.title).toBe("New filters");
    expect(result.current.total).toBe(1);
  });
});
