"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "use-debounce";
import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";
import { listAcademicContent } from "../services/academicContentApi";
import { academicContentUiError } from "../services/academicContentErrors";
import type {
  AcademicContentAudience,
  AcademicContentLibraryItem,
  AcademicContentStatus,
  AcademicContentType,
  AcademicGuardianNotePriority,
  AcademicOnlineSessionPlatform,
  AcademicSubjectResourceCategory,
  ListAcademicContentQuery,
} from "../types/contracts";
import {
  ACADEMIC_CONTENT_AUDIENCES,
  ACADEMIC_CONTENT_STATUSES,
  ACADEMIC_CONTENT_TYPES,
  ACADEMIC_GUARDIAN_NOTE_PRIORITIES,
  ACADEMIC_ONLINE_SESSION_PLATFORMS,
  ACADEMIC_SUBJECT_RESOURCE_CATEGORIES,
} from "../types/contracts";

const DEFAULT_PAGE_SIZE = 50;
const SEARCH_DEBOUNCE_MS = 300;

export interface AcademicContentLibraryFilters {
  page: number;
  limit: number;
  type: AcademicContentType | "";
  status: AcademicContentStatus | "";
  audience: AcademicContentAudience | "";
  stageId: string;
  gradeId: string;
  sectionId: string;
  classroomId: string;
  subjectId: string;
  teacherUserId: string;
  resourceCategory: AcademicSubjectResourceCategory | "";
  weeklyDateFrom: string;
  weeklyDateTo: string;
  sessionStartAtFrom: string;
  sessionStartAtTo: string;
  sessionPlatform: AcademicOnlineSessionPlatform | "";
  guardianPriority: AcademicGuardianNotePriority | "";
  tag: string;
  search: string;
}

type FilterUpdate = Partial<
  Omit<AcademicContentLibraryFilters, "page" | "limit" | "search">
>;

function positiveInteger(rawValue: string | null, fallback: number): number {
  const parsedValue = Number(rawValue);
  return Number.isInteger(parsedValue) && parsedValue > 0
    ? parsedValue
    : fallback;
}

function enumFilter<TValue extends string>(
  rawValue: string | null,
  acceptedValues: readonly TValue[],
): TValue | "" {
  return rawValue && acceptedValues.includes(rawValue as TValue)
    ? (rawValue as TValue)
    : "";
}

function readFilters(searchParams: URLSearchParams): AcademicContentLibraryFilters {
  return {
    page: positiveInteger(searchParams.get("page"), 1),
    limit: Math.min(100, positiveInteger(searchParams.get("limit"), DEFAULT_PAGE_SIZE)),
    type: enumFilter(searchParams.get("type"), ACADEMIC_CONTENT_TYPES),
    status: enumFilter(
      searchParams.get("contentStatus"),
      ACADEMIC_CONTENT_STATUSES,
    ),
    audience: enumFilter(
      searchParams.get("audience"),
      ACADEMIC_CONTENT_AUDIENCES,
    ),
    stageId: searchParams.get("stageId") ?? "",
    gradeId: searchParams.get("gradeId") ?? "",
    sectionId: searchParams.get("sectionId") ?? "",
    classroomId: searchParams.get("classroomId") ?? "",
    subjectId: searchParams.get("subjectId") ?? "",
    teacherUserId: searchParams.get("teacherUserId") ?? "",
    resourceCategory: enumFilter(
      searchParams.get("resourceCategory"),
      ACADEMIC_SUBJECT_RESOURCE_CATEGORIES,
    ),
    weeklyDateFrom: searchParams.get("weeklyDateFrom") ?? "",
    weeklyDateTo: searchParams.get("weeklyDateTo") ?? "",
    sessionStartAtFrom: searchParams.get("sessionStartAtFrom") ?? "",
    sessionStartAtTo: searchParams.get("sessionStartAtTo") ?? "",
    sessionPlatform: enumFilter(
      searchParams.get("sessionPlatform"),
      ACADEMIC_ONLINE_SESSION_PLATFORMS,
    ),
    guardianPriority: enumFilter(
      searchParams.get("guardianPriority"),
      ACADEMIC_GUARDIAN_NOTE_PRIORITIES,
    ),
    tag: (searchParams.get("tag") ?? "").slice(0, 80),
    search: (searchParams.get("search") ?? "").slice(0, 120),
  };
}

function listQuery(
  filters: AcademicContentLibraryFilters,
  academicYearId: string,
  termId: string,
): ListAcademicContentQuery {
  const query = {
    academicYearId,
    termId,
    page: filters.page,
    limit: filters.limit,
    type: filters.type,
    status: filters.status,
    audience: filters.audience,
    stageId: filters.stageId,
    gradeId: filters.gradeId,
    sectionId: filters.sectionId,
    classroomId: filters.classroomId,
    subjectId: filters.subjectId,
    teacherUserId: filters.teacherUserId,
    resourceCategory: filters.resourceCategory,
    weeklyDateFrom: filters.weeklyDateFrom,
    weeklyDateTo: filters.weeklyDateTo,
    sessionStartAtFrom: filters.sessionStartAtFrom,
    sessionStartAtTo: filters.sessionStartAtTo,
    sessionPlatform: filters.sessionPlatform,
    guardianPriority: filters.guardianPriority,
    tag: filters.tag,
    search: filters.search,
  };
  return Object.fromEntries(
    Object.entries(query).filter(([, queryValue]) => queryValue !== ""),
  ) as ListAcademicContentQuery;
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

export function useAcademicContentLibrary() {
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
  const [items, setItems] = useState<AcademicContentLibraryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ReturnType<typeof academicContentUiError> | null>(
    null,
  );
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
    void listAcademicContent(listQuery(filters, academicYearId, termId))
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
          Object.entries(updates).map(([key, filterValue]) => [
            key === "status" ? "contentStatus" : key,
            key === "tag" ? String(filterValue).slice(0, 80) : String(filterValue),
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
    setSearch: (nextSearch: string) => setSearchState(nextSearch.slice(0, 120)),
    setFilters,
    setPage: (page: number) => replaceQuery({ page: Math.max(1, page) }, false),
    setLimit: (limit: number) =>
      replaceQuery({ limit: Math.min(100, Math.max(1, limit)), page: null }, false),
    clearFilters: () =>
      replaceQuery(
        Object.fromEntries(
          Object.keys(filters)
            .filter((key) => !["page", "limit"].includes(key))
            .map((key) => [key === "status" ? "contentStatus" : key, null]),
        ),
        true,
      ),
    reload: () => setReloadVersion((currentVersion) => currentVersion + 1),
  };
}
