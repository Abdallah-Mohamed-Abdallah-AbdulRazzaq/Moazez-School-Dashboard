"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "use-debounce";
import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";
import {
  PREPARATION_COUNT_DEFINITIONS,
  readTeacherPreparationFilters,
  teacherPreparationListQuery,
  type TeacherPreparationCountKey,
  type TeacherPreparationFilterUpdate,
} from "../model/teacherPreparations";
import { academicContentUiError } from "../services/academicContentErrors";
import {
  getTeacherPreparationCount,
  listTeacherPreparations,
} from "../services/teacherPreparationsService";
import type { AcademicContentLibraryItem } from "../types/contracts";

const SEARCH_DEBOUNCE_MS = 300;
const FILTER_QUERY_KEYS = [
  "contentStatus",
  "teacherUserId",
  "stageId",
  "gradeId",
  "sectionId",
  "classroomId",
  "subjectId",
  "tag",
  "search",
] as const;

export interface TeacherPreparationResource<T> {
  data: T;
  isLoading: boolean;
  error: ReturnType<typeof academicContentUiError> | null;
}

export type TeacherPreparationCounts = Record<
  TeacherPreparationCountKey,
  TeacherPreparationResource<number | null>
>;

const emptyCountResource = (): TeacherPreparationResource<number | null> => ({
  data: null,
  isLoading: true,
  error: null,
});

const initialCounts = (): TeacherPreparationCounts => ({
  total: emptyCountResource(),
  draft: emptyCountResource(),
  pendingApproval: emptyCountResource(),
  approved: emptyCountResource(),
});

const initialRequestIds = (): Record<TeacherPreparationCountKey, number> => ({
  total: 0,
  draft: 0,
  pendingApproval: 0,
  approved: 0,
});

export function useTeacherPreparations() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.toString();
  const { academicYearId, termId } = useAcademicYearTermLayoutContext();
  const filters = useMemo(
    () => readTeacherPreparationFilters(new URLSearchParams(currentQuery)),
    [currentQuery],
  );
  const [search, setSearchState] = useState(filters.search);
  const [debouncedSearch] = useDebounce(search, SEARCH_DEBOUNCE_MS);
  const [items, setItems] = useState<AcademicContentLibraryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ReturnType<
    typeof academicContentUiError
  > | null>(null);
  const [reloadVersion, setReloadVersion] = useState(0);
  const [counts, setCounts] = useState<TeacherPreparationCounts>(initialCounts);
  const listRequestId = useRef(0);
  const countRequestIds = useRef(initialRequestIds());
  const lastUrlSearch = useRef(filters.search);

  const replaceQuery = useCallback(
    (updates: Record<string, string | number | null>, resetPage: boolean) => {
      const nextParams = new URLSearchParams(currentQuery);
      Object.entries(updates).forEach(([key, nextValue]) => {
        if (nextValue === null || nextValue === "") nextParams.delete(key);
        else nextParams.set(key, String(nextValue));
      });
      if (resetPage) nextParams.delete("page");
      const nextQuery = nextParams.toString();
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
    const requestId = ++listRequestId.current;
    queueMicrotask(() => {
      if (requestId !== listRequestId.current) return;
      setIsLoading(true);
      setError(null);
    });
    void listTeacherPreparations(
      teacherPreparationListQuery(filters, academicYearId, termId),
    )
      .then((response) => {
        if (requestId !== listRequestId.current) return;
        setItems(response.items);
        setTotal(response.total);
      })
      .catch((requestError: unknown) => {
        if (requestId !== listRequestId.current) return;
        setError(academicContentUiError(requestError));
      })
      .finally(() => {
        if (requestId === listRequestId.current) setIsLoading(false);
      });
  }, [academicYearId, filters, reloadVersion, termId]);

  const loadCount = useCallback(
    (key: TeacherPreparationCountKey) => {
      if (!academicYearId || !termId) return;
      const definition = PREPARATION_COUNT_DEFINITIONS.find(
        (candidate) => candidate.key === key,
      )!;
      const requestId = ++countRequestIds.current[key];
      queueMicrotask(() => {
        if (requestId !== countRequestIds.current[key]) return;
        setCounts((current) => ({
          ...current,
          [key]: { ...current[key], isLoading: true, error: null },
        }));
      });
      void getTeacherPreparationCount(
        { academicYearId, termId },
        definition.status,
      )
        .then((count) => {
          if (requestId !== countRequestIds.current[key]) return;
          setCounts((current) => ({
            ...current,
            [key]: { data: count, isLoading: false, error: null },
          }));
        })
        .catch((requestError: unknown) => {
          if (requestId !== countRequestIds.current[key]) return;
          setCounts((current) => ({
            ...current,
            [key]: {
              data: null,
              isLoading: false,
              error: academicContentUiError(requestError),
            },
          }));
        });
    },
    [academicYearId, termId],
  );

  useEffect(() => {
    PREPARATION_COUNT_DEFINITIONS.forEach(({ key }) => loadCount(key));
  }, [loadCount]);

  const setFilters = useCallback(
    (updates: TeacherPreparationFilterUpdate) => {
      replaceQuery(
        Object.fromEntries(
          Object.entries(updates).map(([key, filterValue]) => [
            key === "status" ? "contentStatus" : key,
            String(filterValue),
          ]),
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
    counts,
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
        Object.fromEntries(FILTER_QUERY_KEYS.map((key) => [key, null])),
        true,
      ),
    reload: () => setReloadVersion((current) => current + 1),
    retryCount: loadCount,
  };
}
