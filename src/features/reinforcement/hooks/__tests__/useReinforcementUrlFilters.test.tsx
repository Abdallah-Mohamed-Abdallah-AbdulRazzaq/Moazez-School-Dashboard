import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useReinforcementUrlFilters } from "../useReinforcementUrlFilters";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

describe("useReinforcementUrlFilters", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/catalog");
  });

  it("preserves academic context when an owned filter changes", async () => {
    window.history.replaceState(
      {},
      "",
      "/catalog?academicYearId=year-1&termId=term-1",
    );
    const { result } = renderHook(() =>
      useReinforcementUrlFilters({
        paramKeys: ["status", "type", "search"],
      }),
    );

    act(() => result.current.setValue("status", "published"));

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search);
      expect(params.get("academicYearId")).toBe("year-1");
      expect(params.get("termId")).toBe("term-1");
      expect(params.get("status")).toBe("published");
    });
  });

  it("clears only owned filters and pagination", async () => {
    window.history.replaceState(
      {},
      "",
      "/catalog?academicYearId=year-1&termId=term-1&status=draft&page=2&pageSize=50",
    );
    const { result } = renderHook(() =>
      useReinforcementUrlFilters({
        paramKeys: ["status", "type", "search"],
      }),
    );

    act(() => result.current.clearAll());

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search);
      expect(params.get("academicYearId")).toBe("year-1");
      expect(params.get("termId")).toBe("term-1");
      expect(params.has("status")).toBe(false);
      expect(params.has("page")).toBe(false);
      expect(params.has("pageSize")).toBe(false);
    });
  });
});
