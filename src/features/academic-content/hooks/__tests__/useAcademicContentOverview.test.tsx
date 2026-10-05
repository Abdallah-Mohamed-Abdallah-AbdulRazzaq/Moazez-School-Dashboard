import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AcademicContentListResponse } from "../../types/contracts";
import { useAcademicContentOverview } from "../useAcademicContentOverview";

const listAcademicContent = vi.hoisted(() => vi.fn());
const fixedNow = () => new Date("2026-10-05T10:00:00.000Z");

vi.mock("../../services/academicContentApi", () => ({ listAcademicContent }));

interface AcademicContextProps {
  academicYearId: string;
  termId: string;
}

function emptyResponse(total = 0): AcademicContentListResponse {
  return { items: [], page: 1, limit: 100, total };
}

function deferred<TValue>() {
  let resolve!: (resolvedValue: TValue) => void;
  const promise = new Promise<TValue>((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
}

describe("useAcademicContentOverview", () => {
  beforeEach(() => {
    listAcademicContent.mockReset().mockResolvedValue(emptyResponse());
  });

  it("waits for a complete academic context before loading", async () => {
    const { result } = renderHook(() =>
      useAcademicContentOverview({ academicYearId: "", termId: "" }),
    );

    await act(async () => Promise.resolve());

    expect(listAcademicContent).not.toHaveBeenCalled();
    expect(result.current.totals.TEACHER_PREPARATION.isLoading).toBe(false);
  });

  it("loads each overview resource independently", async () => {
    listAcademicContent.mockImplementation((query) =>
      Promise.resolve(emptyResponse(query.type ? 7 : 0)),
    );

    const { result } = renderHook(() =>
      useAcademicContentOverview({
        academicYearId: "year-1",
        termId: "term-1",
        nowFactory: fixedNow,
      }),
    );

    await waitFor(() =>
      expect(result.current.totals.GENERAL_RESOURCE.data).toBe(7),
    );
    expect(result.current.totals.GENERAL_RESOURCE.data).toBe(7);
    expect(listAcademicContent).toHaveBeenCalledTimes(10);

    act(() => result.current.retryType("GENERAL_RESOURCE"));
    await waitFor(() => expect(listAcademicContent).toHaveBeenCalledTimes(11));
  });

  it("ignores responses from a previous academic context", async () => {
    const staleTeacherTotal = deferred<AcademicContentListResponse>();
    listAcademicContent.mockImplementation((query) => {
      if (
        query.academicYearId === "year-1" &&
        query.type === "TEACHER_PREPARATION"
      ) {
        return staleTeacherTotal.promise;
      }
      return Promise.resolve(
        emptyResponse(query.academicYearId === "year-2" && query.type ? 2 : 0),
      );
    });

    const { result, rerender } = renderHook(
      ({ academicYearId, termId }: AcademicContextProps) =>
        useAcademicContentOverview({ academicYearId, termId }),
      {
        initialProps: { academicYearId: "year-1", termId: "term-1" },
      },
    );
    rerender({ academicYearId: "year-2", termId: "term-2" });

    await waitFor(() =>
      expect(result.current.totals.TEACHER_PREPARATION.data).toBe(2),
    );
    await act(async () => staleTeacherTotal.resolve(emptyResponse(99)));
    expect(result.current.totals.TEACHER_PREPARATION.data).toBe(2);
  });
});
