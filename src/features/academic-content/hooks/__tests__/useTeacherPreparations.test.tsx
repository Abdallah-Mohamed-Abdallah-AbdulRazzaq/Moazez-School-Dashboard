import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useTeacherPreparations } from "../useTeacherPreparations";

const apiGet = vi.hoisted(() => vi.fn());
const replace = vi.hoisted(() => vi.fn());
let currentQuery = "year=year-1&term=term-1";

vi.mock("@/lib/api", () => ({ apiGet }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/en/academic-content-hub/preparations",
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams(currentQuery),
}));
vi.mock("@/features/academics/hooks/AcademicYearTermLayoutContext", () => ({
  useAcademicYearTermLayoutContext: () => ({
    academicYearId: "year-1",
    termId: "term-1",
  }),
}));

describe("useTeacherPreparations", () => {
  beforeEach(() => {
    currentQuery = "year=year-1&term=term-1";
    replace.mockReset();
    apiGet.mockReset().mockResolvedValue({
      items: [],
      page: 1,
      limit: 10,
      total: 4,
    });
  });

  it("loads one list and four independent counts", async () => {
    const { result } = renderHook(() => useTeacherPreparations());

    await waitFor(() => expect(result.current.counts.approved.data).toBe(4));
    expect(apiGet).toHaveBeenCalledTimes(5);
    expect(result.current.total).toBe(4);
  });

  it("preserves academic context while changing a filter", async () => {
    const { result } = renderHook(() => useTeacherPreparations());
    await waitFor(() => expect(result.current.counts.total.isLoading).toBe(false));

    act(() => result.current.setFilters({ status: "SUBMITTED" }));

    expect(replace).toHaveBeenCalledWith(
      "/en/academic-content-hub/preparations?year=year-1&term=term-1&contentStatus=SUBMITTED",
      { scroll: false },
    );
  });

  it("retries only the selected count", async () => {
    const { result } = renderHook(() => useTeacherPreparations());
    await waitFor(() => expect(apiGet).toHaveBeenCalledTimes(5));

    act(() => result.current.retryCount("draft"));

    await waitFor(() => expect(apiGet).toHaveBeenCalledTimes(6));
    expect(apiGet.mock.calls.at(-1)?.[1].params.status).toBe("DRAFT");
  });
});
