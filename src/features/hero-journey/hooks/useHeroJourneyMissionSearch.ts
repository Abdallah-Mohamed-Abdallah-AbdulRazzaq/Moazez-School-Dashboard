"use client";

import { useDebounce } from "use-debounce";

export const HERO_JOURNEY_SEARCH_DEBOUNCE_MS = 300;

export function useHeroJourneyMissionSearch(search: string) {
  const [debouncedSearch] = useDebounce(
    search,
    HERO_JOURNEY_SEARCH_DEBOUNCE_MS,
  );

  return {
    debouncedSearch,
    isDebouncing: search !== debouncedSearch,
  };
}
