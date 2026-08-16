"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UseReinforcementUrlFiltersOptions {
  /** Keys to sync with URL. Each key maps to a query param name. */
  paramKeys: string[];
  /** Default values for each key */
  defaults?: Record<string, string>;
  /** Key that should be debounced (typically "search") */
  debounceKey?: string;
  /** Debounce delay in ms (default 350) */
  debounceMs?: number;
}

export interface UseReinforcementUrlFiltersReturn {
  /** Current filter values (debounced for the debounceKey) */
  values: Record<string, string>;
  /** Raw (non-debounced) value for the debounce key — use for input display */
  rawSearchValue: string;
  /** Set a single filter value */
  setValue: (key: string, value: string) => void;
  /** Set the raw search value (for the input onChange) */
  setRawSearch: (value: string) => void;
  /** Clear all filters */
  clearAll: () => void;
  /** Current page number */
  page: number;
  /** Current page size */
  pageSize: number;
  /** Set page */
  setPage: (page: number) => void;
  /** Set page size */
  setPageSize: (size: number) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildUrlFromValues(
  values: Record<string, string>,
  ownedKeys: string[],
  page: number,
  pageSize: number,
): string {
  const params = new URLSearchParams(window.location.search);

  [...ownedKeys, "page", "pageSize"].forEach((key) => params.delete(key));

  for (const [key, value] of Object.entries(values)) {
    if (value) {
      params.set(key, value);
    }
  }

  if (page > 1) {
    params.set("page", String(page));
  }
  if (pageSize !== 10) {
    params.set("pageSize", String(pageSize));
  }

  const queryString = params.toString();
  const basePath = window.location.pathname;
  return queryString ? `${basePath}?${queryString}` : basePath;
}

function updateUrl(
  values: Record<string, string>,
  ownedKeys: string[],
  page: number,
  pageSize: number,
): void {
  const url = buildUrlFromValues(values, ownedKeys, page, pageSize);
  window.history.replaceState(null, "", url);
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useReinforcementUrlFilters(
  options: UseReinforcementUrlFiltersOptions,
): UseReinforcementUrlFiltersReturn {
  const {
    paramKeys,
    defaults = {},
    debounceKey,
    debounceMs = 350,
  } = options;

  const searchParams = useSearchParams();
  const initializedRef = useRef(false);
  const paramKeySignature = paramKeys.join("\u0000");
  const ownedKeys = useMemo(
    () => (paramKeySignature ? paramKeySignature.split("\u0000") : []),
    [paramKeySignature],
  );

  // ─── Read initial values from URL on mount ───────────────────────────────
  const initialValues = useMemo(() => {
    const vals: Record<string, string> = {};
    for (const key of ownedKeys) {
      vals[key] = searchParams.get(key) || defaults[key] || "";
    }
    return vals;
    // Only compute on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initialPage = useMemo(() => {
    const p = searchParams.get("page");
    return p ? Math.max(1, parseInt(p, 10) || 1) : 1;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initialPageSize = useMemo(() => {
    const ps = searchParams.get("pageSize");
    return ps ? Math.max(1, parseInt(ps, 10) || 10) : 10;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── State ───────────────────────────────────────────────────────────────
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [rawSearchValue, setRawSearchValue] = useState<string>(
    debounceKey ? initialValues[debounceKey] || "" : "",
  );
  const [page, setPageState] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  // ─── Debounce the search value ───────────────────────────────────────────
  const debouncedSearch = useDebounce(rawSearchValue, debounceMs);

  // Sync debounced search into values
  useEffect(() => {
    if (!debounceKey) return;
    void Promise.resolve().then(() => setValues((prev) => {
      if (prev[debounceKey] === debouncedSearch) return prev;
      return { ...prev, [debounceKey]: debouncedSearch };
    }));
  }, [debouncedSearch, debounceKey]);

  // ─── URL sync ────────────────────────────────────────────────────────────
  // Update URL whenever values, page, or pageSize change (after initialization)
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      return;
    }
    updateUrl(values, ownedKeys, page, pageSize);
  }, [values, page, pageSize, ownedKeys]);

  // ─── Actions ─────────────────────────────────────────────────────────────
  const setValue = useCallback(
    (key: string, value: string) => {
      if (debounceKey && key === debounceKey) {
        // For the debounce key, update raw value (debounce handles the rest)
        setRawSearchValue(value);
      } else {
        setValues((prev) => {
          if (prev[key] === value) return prev;
          return { ...prev, [key]: value };
        });
      }
      // Reset to page 1 when filters change
      setPageState(1);
    },
    [debounceKey],
  );

  const setRawSearch = useCallback((value: string) => {
    setRawSearchValue(value);
    // Reset to page 1 when search changes
    setPageState(1);
  }, []);

  const clearAll = useCallback(() => {
    const cleared: Record<string, string> = {};
    for (const key of ownedKeys) {
      cleared[key] = defaults[key] || "";
    }
    setValues(cleared);
    setRawSearchValue("");
    setPageState(1);
    setPageSizeState(10);
    const params = new URLSearchParams(window.location.search);
    [...ownedKeys, "page", "pageSize"].forEach((key) => params.delete(key));
    const query = params.toString();
    window.history.replaceState(
      null,
      "",
      query ? `${window.location.pathname}?${query}` : window.location.pathname,
    );
  }, [ownedKeys, defaults]);

  const setPage = useCallback((newPage: number) => {
    setPageState(newPage);
  }, []);

  const setPageSize = useCallback((newSize: number) => {
    setPageSizeState(newSize);
    setPageState(1);
  }, []);

  return {
    values,
    rawSearchValue,
    setValue,
    setRawSearch,
    clearAll,
    page,
    pageSize,
    setPage,
    setPageSize,
  };
}
