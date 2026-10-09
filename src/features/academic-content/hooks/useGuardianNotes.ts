"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "use-debounce";
import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";
import {
  guardianNoteListQuery,
  readGuardianNoteFilters,
  type GuardianNoteFilterUpdate,
  type GuardianNoteView,
} from "../model/guardianNotes";
import { academicContentUiError } from "../services/academicContentErrors";
import { listGuardianNotes } from "../services/guardianNotesService";
import type { AcademicContentLibraryItem } from "../types/contracts";

const SEARCH_DEBOUNCE_MS = 300;
const FILTER_QUERY_KEYS = [
  "contentStatus",
  "guardianPriority",
  "stageId",
  "gradeId",
  "sectionId",
  "classroomId",
  "subjectId",
  "teacherUserId",
  "tag",
  "search",
] as const;

export function useGuardianNotes() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.toString();
  const { academicYearId, termId } = useAcademicYearTermLayoutContext();
  const filters = useMemo(
    () => readGuardianNoteFilters(new URLSearchParams(currentQuery)),
    [currentQuery],
  );
  const [search, setSearch] = useState(filters.search);
  const [debouncedSearch] = useDebounce(search, SEARCH_DEBOUNCE_MS);
  const [items, setItems] = useState<AcademicContentLibraryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ReturnType<
    typeof academicContentUiError
  > | null>(null);
  const [reloadVersion, setReloadVersion] = useState(0);
  const requestId = useRef(0);
  const lastUrlSearch = useRef(filters.search);

  const replaceQuery = useCallback(
    (updates: Record<string, string | number | null>, resetPage: boolean) => {
      const nextParams = new URLSearchParams(currentQuery);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "") nextParams.delete(key);
        else nextParams.set(key, String(value));
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
    queueMicrotask(() => setSearch(filters.search));
  }, [filters.search]);

  useEffect(() => {
    if (debouncedSearch === filters.search) return;
    replaceQuery({ search: debouncedSearch }, true);
  }, [debouncedSearch, filters.search, replaceQuery]);

  useEffect(() => {
    if (!academicYearId || !termId) return;
    const currentRequest = ++requestId.current;
    queueMicrotask(() => {
      if (currentRequest !== requestId.current) return;
      setIsLoading(true);
      setError(null);
    });
    void listGuardianNotes(
      guardianNoteListQuery(filters, academicYearId, termId),
    )
      .then((response) => {
        if (currentRequest !== requestId.current) return;
        setItems(response.items);
        setTotal(response.total);
      })
      .catch((requestError: unknown) => {
        if (currentRequest === requestId.current)
          setError(academicContentUiError(requestError));
      })
      .finally(() => {
        if (currentRequest === requestId.current) setIsLoading(false);
      });
  }, [academicYearId, filters, reloadVersion, termId]);

  const setFilters = useCallback(
    (updates: GuardianNoteFilterUpdate) => {
      replaceQuery(
        Object.fromEntries(
          Object.entries(updates).map(([key, value]) => [
            key === "status"
              ? "contentStatus"
              : key === "priority"
                ? "guardianPriority"
                : key,
            String(value),
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
    setSearch: (value: string) => setSearch(value.slice(0, 120)),
    setFilters,
    setView: (view: GuardianNoteView) => replaceQuery({ view }, false),
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
  };
}
