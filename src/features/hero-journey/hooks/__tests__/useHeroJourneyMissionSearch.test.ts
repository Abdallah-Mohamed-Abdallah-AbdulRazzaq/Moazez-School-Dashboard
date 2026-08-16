import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  HERO_JOURNEY_SEARCH_DEBOUNCE_MS,
  useHeroJourneyMissionSearch,
} from "../useHeroJourneyMissionSearch";

describe("useHeroJourneyMissionSearch", () => {
  afterEach(() => vi.useRealTimers());

  it("settles a changed search after 300 ms", () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ search }) => useHeroJourneyMissionSearch(search),
      { initialProps: { search: "" } },
    );

    expect(result.current).toEqual({ debouncedSearch: "", isDebouncing: false });

    rerender({ search: "read" });
    expect(result.current).toEqual({ debouncedSearch: "", isDebouncing: true });

    act(() => vi.advanceTimersByTime(HERO_JOURNEY_SEARCH_DEBOUNCE_MS - 1));
    expect(result.current.isDebouncing).toBe(true);

    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toEqual({ debouncedSearch: "read", isDebouncing: false });
  });

  it("debounces clearing the search back to an empty value", () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ search }) => useHeroJourneyMissionSearch(search),
      { initialProps: { search: "read" } },
    );

    rerender({ search: "" });
    expect(result.current).toEqual({ debouncedSearch: "read", isDebouncing: true });

    act(() => vi.advanceTimersByTime(HERO_JOURNEY_SEARCH_DEBOUNCE_MS));
    expect(result.current).toEqual({ debouncedSearch: "", isDebouncing: false });
  });
});
