import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAcademicContentReviewQueue } from "../useAcademicContentReviewQueue";

const navigationState = vi.hoisted(() => ({
  query: "year=year-1&term=term-1",
  replace: vi.fn(),
}));
const listAcademicContentReviewQueue = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/academic-content-hub/review",
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

vi.mock("../../services/academicContentApi", () => ({
  listAcademicContentReviewQueue,
}));

function queueResponse(title: string, total = 1) {
  return {
    items: [
      {
        contentId: `content-${title}`,
        title,
        academicYearId: "year-1",
        termId: "term-1",
        approvalId: `approval-${title}`,
        submittedRevisionId: `revision-${title}`,
        roundNumber: 1,
        submittedAt: "2026-10-01T08:00:00.000Z",
        submittedByUserId: "teacher-1",
        targets: [],
      },
    ],
    page: 1,
    limit: 50,
    total,
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
}

describe("useAcademicContentReviewQueue", () => {
  beforeEach(() => {
    navigationState.query = "year=year-1&term=term-1";
    navigationState.replace.mockReset();
    listAcademicContentReviewQueue
      .mockReset()
      .mockResolvedValue(queueResponse("Oldest submission", 73));
  });

  afterEach(() => vi.useRealTimers());

  it("loads the selected academic context with stable pagination defaults", async () => {
    const { result, rerender } = renderHook(() =>
      useAcademicContentReviewQueue(),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    rerender();

    expect(listAcademicContentReviewQueue).toHaveBeenCalledTimes(1);
    expect(listAcademicContentReviewQueue).toHaveBeenCalledWith({
      academicYearId: "year-1",
      termId: "term-1",
      page: 1,
      limit: 50,
    });
    expect(result.current.total).toBe(73);
  });

  it("serializes every backend filter and resets the page", async () => {
    navigationState.query = "year=year-1&term=term-1&page=4";
    const { result } = renderHook(() => useAcademicContentReviewQueue());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() =>
      result.current.setFilters({
        stageId: "stage-1",
        gradeId: "grade-1",
        sectionId: "section-1",
        classroomId: "classroom-1",
        subjectId: "subject-1",
        teacherUserId: "teacher-1",
      }),
    );

    expect(navigationState.replace).toHaveBeenLastCalledWith(
      "/en/academic-content-hub/review?year=year-1&term=term-1&stageId=stage-1&gradeId=grade-1&sectionId=section-1&classroomId=classroom-1&subjectId=subject-1&teacherUserId=teacher-1",
      { scroll: false },
    );
  });

  it("debounces search and retains prior rows while a newer request loads", async () => {
    vi.useFakeTimers();
    const secondRequest = deferred<ReturnType<typeof queueResponse>>();
    listAcademicContentReviewQueue
      .mockResolvedValueOnce(queueResponse("Existing row"))
      .mockReturnValueOnce(secondRequest.promise);
    const { result, rerender } = renderHook(() =>
      useAcademicContentReviewQueue(),
    );

    await act(async () => Promise.resolve());
    expect(result.current.items[0]?.title).toBe("Existing row");

    act(() => result.current.setSearch("fractions"));
    await act(async () => vi.advanceTimersByTime(300));
    expect(navigationState.replace).toHaveBeenLastCalledWith(
      "/en/academic-content-hub/review?year=year-1&term=term-1&search=fractions",
      { scroll: false },
    );

    navigationState.query = "year=year-1&term=term-1&search=fractions";
    rerender();
    await act(async () => Promise.resolve());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.items[0]?.title).toBe("Existing row");

    await act(async () => secondRequest.resolve(queueResponse("Filtered row")));
    expect(result.current.items[0]?.title).toBe("Filtered row");
  });
});
