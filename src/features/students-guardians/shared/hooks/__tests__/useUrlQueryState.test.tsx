import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useUrlQueryState } from "../useUrlQueryState";

const navigation = vi.hoisted(() => ({
  query: "",
  router: { push: vi.fn(), replace: vi.fn() },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/settings/users",
  useRouter: () => navigation.router,
  useSearchParams: () => new URLSearchParams(navigation.query),
}));

async function renderSearchState() {
  const searchState = renderHook(() =>
    useUrlQueryState({
      defaults: { search: "", status: "all" },
      debouncedKeys: ["search"],
      modeByKey: { search: "replace" },
    }),
  );
  await act(async () => {});
  return searchState;
}

describe("URL-backed search typing", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    navigation.query = "";
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it.each(["amina", "أمينة", ""])(
    "preserves newer search text %j when an older URL update completes",
    async (latestSearch) => {
      const { result, rerender } = await renderSearchState();
      act(() => result.current.setValue("search", "am"));
      await act(async () => vi.advanceTimersByTime(300));
      expect(navigation.router.replace).toHaveBeenLastCalledWith(
        "/en/settings/users?search=am", { scroll: false },
      );

      act(() => result.current.setValue("search", latestSearch));
      navigation.query = "search=am";
      await act(async () => rerender());

      expect(result.current.values.search).toBe(latestSearch);
      await act(async () => vi.advanceTimersByTime(300));
      const expectedQuery = new URLSearchParams();
      if (latestSearch) expectedQuery.set("search", latestSearch);
      expect(navigation.router.replace).toHaveBeenLastCalledWith(
        `/en/settings/users${latestSearch ? `?${expectedQuery}` : ""}`,
        { scroll: false },
      );
    },
  );

  it("keeps newer typing when a filter navigation finishes", async () => {
    const { result, rerender } = await renderSearchState();
    act(() => result.current.setValue("status", "active"));
    act(() => result.current.setValue("search", "amina"));
    navigation.query = "status=active";
    await act(async () => rerender());

    expect(result.current.values).toEqual({ search: "amina", status: "active" });
    await act(async () => vi.advanceTimersByTime(300));
    expect(navigation.router.replace).toHaveBeenLastCalledWith(
      "/en/settings/users?status=active&search=amina", { scroll: false },
    );
  });

  it("restores external navigation and cancels a pending search", async () => {
    const { result, rerender } = await renderSearchState();
    act(() => result.current.setValue("search", "unfinished"));
    navigation.query = "search=previous&status=inactive";
    await act(async () => rerender());
    await act(async () => vi.advanceTimersByTime(300));

    expect(result.current.values).toEqual({ search: "previous", status: "inactive" });
    expect(navigation.router.replace).not.toHaveBeenCalled();
  });

  it("persists clearing the input before an older navigation completes", async () => {
    const { result, rerender } = await renderSearchState();
    act(() => result.current.setValue("search", "am"));
    await act(async () => vi.advanceTimersByTime(300));
    act(() => result.current.setValue("search", ""));
    await act(async () => vi.advanceTimersByTime(300));

    expect(navigation.router.replace).toHaveBeenLastCalledWith(
      "/en/settings/users", { scroll: false },
    );
    navigation.query = "search=am";
    await act(async () => rerender());
    navigation.query = "";
    await act(async () => rerender());
    expect(result.current.values.search).toBe("");
  });
});
