"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "use-debounce";
import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";
import { listAcademicContentReviewQueue } from "../services/academicContentApi";
import { academicContentUiError } from "../services/academicContentErrors";
import type {
  AcademicContentReviewQueueItem,
  AcademicContentReviewQueueQuery,
} from "../types/contracts";

const DEFAULT_PAGE_SIZE = 50;
const SEARCH_DEBOUNCE_MS = 300;

export interface AcademicContentReviewQueueFilters {
  page: number;
  limit: number;
  stageId: string;
  gradeId: string;
  sectionId: string;
  classroomId: string;
  subjectId: string;
  teacherUserId: string;
  search: string;
}

type FilterUpdate = Partial<
  Omit<AcademicContentReviewQueueFilters, "page" | "limit" | "search">
>;

function positiveInteger(rawValue: string | null, fallback: number): number {
  const parsedValue = Number(rawValue);
  return Number.isInteger(parsedValue) && parsedValue > 0
    ? parsedValue
    : fallback;
}

function readFilters(
  searchParams: URLSearchParams,
): AcademicContentReviewQueueFilters {
  return {
    page: positiveInteger(searchParams.get("page"), 1),
    limit: Math.min(
      100,
      positiveInteger(searchParams.get("limit"), DEFAULT_PAGE_SIZE),
    ),
    stageId: searchParams.get("stageId") ?? "",
    gradeId: searchParams.get("gradeId") ?? "",
    sectionId: searchParams.get("sectionId") ?? "",
    classroomId: searchParams.get("classroomId") ?? "",
    subjectId: searchParams.get("subjectId") ?? "",
    teacherUserId: searchParams.get("teacherUserId") ?? "",
    search: (searchParams.get("search") ?? "").slice(0, 120),
  };
}

function queueQuery(
  filters: AcademicContentReviewQueueFilters,
  academicYearId: string,
  termId: string,
): AcademicContentReviewQueueQuery {
  const query = { ...filters, academicYearId, termId };
  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== ""),
  ) as AcademicContentReviewQueueQuery;
}

function applyUrlValues(
  currentQuery: string,
  updates: Record<string, string | number | null>,
  resetPage: boolean,
): string {
  const nextParams = new URLSearchParams(currentQuery);
  for (const [key, nextValue] of Object.entries(updates)) {
    if (nextValue === null || nextValue === "") nextParams.delete(key);
    else nextParams.set(key, String(nextValue));
  }
  if (resetPage) nextParams.delete("page");
  return nextParams.toString();
}

export function useAcademicContentReviewQueue() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.toString();
  const { academicYearId, termId } = useAcademicYearTermLayoutContext();
  const filters = useMemo(
    () => readFilters(new URLSearchParams(currentQuery)),
    [currentQuery],
  );
  const [search, setSearchState] = useState(filters.search);
  const [debouncedSearch] = useDebounce(search, SEARCH_DEBOUNCE_MS);
  const [items, setItems] = useState<AcademicContentReviewQueueItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ReturnType<
    typeof academicContentUiError
  > | null>(null);
  const [reloadVersion, setReloadVersion] = useState(0);
  const latestRequestId = useRef(0);
  const lastUrlSearch = useRef(filters.search);

  const replaceQuery = useCallback(
    (updates: Record<string, string | number | null>, resetPage: boolean) => {
      const nextQuery = applyUrlValues(currentQuery, updates, resetPage);
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
        scroll: false,
      });
    },
    [currentQuery, pathname, router],
  );

  useEffect(() => {
    if (filters.search === lastUrlSearch.current) return;
    lastUrlSearch.current = filters.search;
    queueMicrotask(() => setSearchState(filters.search));
  }, [filters.search]);

  useEffect(() => {
    if (debouncedSearch === filters.search) return;
    replaceQuery({ search: debouncedSearch }, true);
  }, [debouncedSearch, filters.search, replaceQuery]);

  useEffect(() => {
    if (!academicYearId || !termId) return;

    const requestId = ++latestRequestId.current;
    queueMicrotask(() => {
      if (requestId !== latestRequestId.current) return;
      setIsLoading(true);
      setError(null);
    });
    void listAcademicContentReviewQueue(
      queueQuery(filters, academicYearId, termId),
    )
      .then((response) => {
        if (requestId !== latestRequestId.current) return;
        setItems(response.items);
        setTotal(response.total);
      })
      .catch((requestError: unknown) => {
        if (requestId !== latestRequestId.current) return;
        setError(academicContentUiError(requestError));
      })
      .finally(() => {
        if (requestId === latestRequestId.current) setIsLoading(false);
      });
  }, [academicYearId, filters, reloadVersion, termId]);

  const setFilters = useCallback(
    (updates: FilterUpdate) => {
      replaceQuery(
        Object.fromEntries(
          Object.entries(updates).map(([key, value]) => [key, String(value)]),
        ),
        true,
      );
    },
    [replaceQuery],
  );

  return {
    filters,
    search,
    items,
    total,
    isLoading: Boolean(academicYearId && termId) && isLoading,
    error,
    setSearch: (nextSearch: string) => setSearchState(nextSearch.slice(0, 120)),
    setFilters,
    setPage: (page: number) => replaceQuery({ page: Math.max(1, page) }, false),
    setLimit: (limit: number) =>
      replaceQuery(
        { limit: Math.min(100, Math.max(1, limit)), page: null },
        false,
      ),
    clearFilters: () =>
      replaceQuery(
        Object.fromEntries(
          Object.keys(filters)
            .filter((key) => !["page", "limit"].includes(key))
            .map((key) => [key, null]),
        ),
        true,
      ),
    reload: () => setReloadVersion((version) => version + 1),
  };
}
