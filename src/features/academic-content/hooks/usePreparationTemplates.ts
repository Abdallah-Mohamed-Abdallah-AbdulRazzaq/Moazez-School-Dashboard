"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "use-debounce";
import {
  createAcademicContentPreparationTemplate,
  deleteAcademicContentPreparationTemplate,
  getAcademicContentPreparationTemplate,
  listAcademicContentPreparationTemplates,
  updateAcademicContentPreparationTemplate,
} from "../services/academicContentApi";
import { academicContentUiError } from "../services/academicContentErrors";
import type {
  AcademicContentPreparationTemplateListItem,
  AcademicContentPreparationTemplateDetail,
  CreateAcademicContentPreparationTemplateRequest,
  ListAcademicContentPreparationTemplatesQuery,
} from "../types/contracts";

const DEFAULT_PAGE_SIZE = 50;
const SEARCH_DEBOUNCE_MS = 300;

export interface PreparationTemplateFilters {
  page: number;
  limit: number;
  stageId: string;
  subjectId: string;
  search: string;
}

export function usePreparationTemplateEditor(templateId?: string) {
  const [template, setTemplate] =
    useState<AcademicContentPreparationTemplateDetail | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(templateId));
  const [error, setError] = useState<
    (ReturnType<typeof academicContentUiError> & { templateId: string }) | null
  >(null);
  const [reloadVersion, setReloadVersion] = useState(0);

  useEffect(() => {
    if (!templateId) return;
    let isCurrent = true;
    queueMicrotask(() => {
      if (!isCurrent) return;
      setIsLoading(true);
      setError(null);
    });
    void getAcademicContentPreparationTemplate(templateId)
      .then((loadedTemplate) => {
        if (!isCurrent) return;
        if (loadedTemplate.id !== templateId) {
          setError({
            code: "TEMPLATE_ID_MISMATCH",
            message: "The template response did not match the requested template.",
            templateId,
          });
          return;
        }
        setTemplate(loadedTemplate);
      })
      .catch((loadError) => {
        if (isCurrent) {
          setError({ ...academicContentUiError(loadError), templateId });
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });
    return () => {
      isCurrent = false;
    };
  }, [reloadVersion, templateId]);

  const save = useCallback(
    (request: CreateAcademicContentPreparationTemplateRequest) =>
      templateId
        ? updateAcademicContentPreparationTemplate(templateId, request)
        : createAcademicContentPreparationTemplate(request),
    [templateId],
  );

  const currentTemplate = template?.id === templateId ? template : null;
  const currentError = error?.templateId === templateId ? error : null;

  return {
    template: currentTemplate,
    isLoading: Boolean(templateId) && !currentTemplate && !currentError
      ? true
      : isLoading,
    error: currentError,
    save,
    reload: () => setReloadVersion((version) => version + 1),
  };
}

function positiveInteger(rawValue: string | null, fallback: number): number {
  const parsedValue = Number(rawValue);
  return Number.isInteger(parsedValue) && parsedValue > 0
    ? parsedValue
    : fallback;
}

function readFilters(searchParams: URLSearchParams): PreparationTemplateFilters {
  return {
    page: positiveInteger(searchParams.get("page"), 1),
    limit: Math.min(
      100,
      positiveInteger(searchParams.get("limit"), DEFAULT_PAGE_SIZE),
    ),
    stageId: searchParams.get("stageId") ?? "",
    subjectId: searchParams.get("subjectId") ?? "",
    search: (searchParams.get("search") ?? "").slice(0, 120),
  };
}

function listQuery(
  filters: PreparationTemplateFilters,
): ListAcademicContentPreparationTemplatesQuery {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== ""),
  ) as ListAcademicContentPreparationTemplatesQuery;
}

function applyUrlValues(
  currentQuery: string,
  updates: Record<string, string | number | null>,
  resetPage: boolean,
) {
  const nextParams = new URLSearchParams(currentQuery);
  for (const [key, nextValue] of Object.entries(updates)) {
    if (nextValue === null || nextValue === "") nextParams.delete(key);
    else nextParams.set(key, String(nextValue));
  }
  if (resetPage) nextParams.delete("page");
  return nextParams.toString();
}

export function usePreparationTemplates() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.toString();
  const filters = useMemo(
    () => readFilters(new URLSearchParams(currentQuery)),
    [currentQuery],
  );
  const [search, setSearchState] = useState(filters.search);
  const [debouncedSearch] = useDebounce(search, SEARCH_DEBOUNCE_MS);
  const [items, setItems] = useState<
    AcademicContentPreparationTemplateListItem[]
  >([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
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
    const requestId = ++latestRequestId.current;
    queueMicrotask(() => {
      if (requestId !== latestRequestId.current) return;
      setIsLoading(true);
      setError(null);
    });
    void listAcademicContentPreparationTemplates(listQuery(filters))
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
  }, [filters, reloadVersion]);

  const deleteTemplate = useCallback(async (templateId: string) => {
    setIsDeleting(true);
    setError(null);
    try {
      await deleteAcademicContentPreparationTemplate(templateId);
      setReloadVersion((version) => version + 1);
      return true;
    } catch (deleteError) {
      setError(academicContentUiError(deleteError));
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, []);

  return {
    filters,
    search,
    items,
    total,
    isLoading,
    isDeleting,
    error,
    setSearch: (nextSearch: string) => setSearchState(nextSearch.slice(0, 120)),
    setFilters: (
      updates: Partial<
        Omit<PreparationTemplateFilters, "page" | "limit" | "search">
      >,
    ) =>
      replaceQuery(
        Object.fromEntries(
          Object.entries(updates).map(([key, value]) => [key, String(value)]),
        ),
        true,
      ),
    setPage: (page: number) => replaceQuery({ page: Math.max(1, page) }, false),
    setLimit: (limit: number) =>
      replaceQuery(
        { limit: Math.min(100, Math.max(1, limit)), page: null },
        false,
      ),
    clearFilters: () =>
      replaceQuery({ stageId: null, subjectId: null, search: null }, true),
    reload: () => setReloadVersion((version) => version + 1),
    deleteTemplate,
  };
}
