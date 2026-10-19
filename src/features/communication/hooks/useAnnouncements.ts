"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import {
  archiveAnnouncement,
  createAnnouncement,
  getAnnouncements,
  publishAnnouncement,
  updateAnnouncement,
} from "@/features/communication/api/communication.service";
import { audienceFromScope } from "@/features/communication/api/communication.mappers";
import { createCommunicationMetadata } from "@/features/communication/utils/communication-metadata";
import type {
  CommunicationList,
  CommunicationRecord,
} from "@/features/communication/types/communication.types";
import type {
  Announcement,
  AnnouncementAudienceType,
  AnnouncementPriority,
  AnnouncementStatus,
  CreateAnnouncementPayload,
  CreateAnnouncementStatus,
  ListAnnouncementsParams,
  UpdateAnnouncementPayload,
} from "@/features/communication/types/announcement.types";

export type AnnouncementStatusFilter =
  | "all"
  | "draft"
  | "published"
  | "archived";

export interface AnnouncementFiltersState {
  search: string;
  status: AnnouncementStatusFilter;
}

export interface AnnouncementFormValues {
  title?: string;
  body?: string;
  status?: CreateAnnouncementStatus;
  priority?: AnnouncementPriority;
  audienceType?: AnnouncementAudienceType;
  audienceId?: string;
  audienceUserIds?: string[];
  scheduledAt?: string;
  expiresAt?: string;
}

const DEFAULT_FILTERS: AnnouncementFiltersState = {
  search: "",
  status: "all",
};
const ANNOUNCEMENTS_PAGE_SIZE = 20;
const FOCUS_REFRESH_AGE_MS = 60_000;

const isRecord = (value: unknown): value is CommunicationRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

function numberFromUnknown(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function unwrapItem<T>(response: unknown): T | null {
  if (!isRecord(response)) return (response ?? null) as T | null;

  const item = [response.data, response.item, response.result, response.payload].find(
    (candidate) => isRecord(candidate) && !Array.isArray(candidate),
  );

  return (item ?? response) as T;
}

function unwrapList<T>(response: unknown): CommunicationList<T> {
  if (Array.isArray(response)) {
    return { items: response as T[], total: response.length };
  }

  if (!isRecord(response)) {
    return { items: [], total: 0 };
  }

  const sources = [
    response,
    response.data,
    response.result,
    response.payload,
  ].filter(isRecord);
  const itemSource = sources.find((source) => Array.isArray(source.items));

  if (itemSource) {
    const items = itemSource.items as T[];
    return {
      ...itemSource,
      items,
      total:
        numberFromUnknown(itemSource.total) ??
        numberFromUnknown(itemSource.count) ??
        items.length,
      page: numberFromUnknown(itemSource.page),
      limit: numberFromUnknown(itemSource.limit),
      totalPages: numberFromUnknown(itemSource.totalPages),
    };
  }

  const arraySource = [
    response.data,
    response.result,
    response.payload,
  ].find(Array.isArray);

  if (arraySource) {
    const items = arraySource as T[];
    return { items, total: items.length };
  }

  return { items: [], total: 0 };
}

function payloadFromValues(
  values: AnnouncementFormValues,
  context: "announcement_create" | "announcement_update",
): CreateAnnouncementPayload {
  const audience = audienceFromScope(values.audienceType, values.audienceId?.trim());
  const customAudiences =
    values.audienceType === "custom"
      ? (values.audienceUserIds ?? [])
          .filter((userId) => userId.trim())
          .map((userId) => ({ audienceType: "custom" as const, userId }))
      : [];
  const title = values.title?.trim();
  const body = values.body?.trim();
  const metadata = createCommunicationMetadata(
    context,
    context === "announcement_create"
      ? {
          createdFrom: "announcements_page",
          campaign:
            values.priority === "urgent" ? "urgent_announcement" : undefined,
        }
      : {
          updatedFrom: "announcement_editor",
        },
  );

  return {
    title: title ?? "",
    body: body ?? "",
    ...(values.status ? { status: values.status } : {}),
    ...(values.priority ? { priority: values.priority } : {}),
    ...(values.audienceType ? { audienceType: values.audienceType } : {}),
    ...(customAudiences.length > 0
      ? { audiences: customAudiences }
      : audience
        ? { audiences: [audience] }
        : {}),
    ...(values.scheduledAt
      ? { scheduledAt: new Date(values.scheduledAt).toISOString() }
      : {}),
    ...(values.expiresAt
      ? { expiresAt: new Date(values.expiresAt).toISOString() }
      : {}),
    ...(metadata ? { metadata } : {}),
  };
}

function sortAnnouncements(announcements: Announcement[]) {
  return [...announcements].sort((left, right) => {
    const leftDate = left.publishedAt ?? left.updatedAt ?? left.createdAt ?? "";
    const rightDate = right.publishedAt ?? right.updatedAt ?? right.createdAt ?? "";
    return new Date(rightDate).getTime() - new Date(leftDate).getTime();
  });
}

function announcementListParams(
  status: AnnouncementStatusFilter,
  search: string,
  page: number,
): ListAnnouncementsParams {
  return {
    ...(status !== "all" ? { status: status as AnnouncementStatus } : {}),
    ...(search ? { search } : {}),
    page,
    limit: ANNOUNCEMENTS_PAGE_SIZE,
  };
}

function appendUniqueAnnouncements(
  current: Announcement[],
  incoming: Announcement[],
) {
  const savedIds = new Set(current.map((announcement) => announcement.id));
  return sortAnnouncements([
    ...current,
    ...incoming.filter((announcement) => {
      if (savedIds.has(announcement.id)) return false;
      savedIds.add(announcement.id);
      return true;
    }),
  ]);
}

export function useAnnouncements() {
  const mountedRef = useRef(false);
  const requestGenerationRef = useRef(0);
  const loadingMoreRef = useRef(false);
  const refreshingRef = useRef(false);
  const lastSuccessfulFetchAtRef = useRef(0);
  const [filters, setFilters] =
    useState<AnnouncementFiltersState>(DEFAULT_FILTERS);
  const debouncedSearch = useDebounce(filters.search.trim(), 350);
  const filterKey = JSON.stringify({
    status: filters.status,
    search: debouncedSearch,
  });
  const activeFilterKeyRef = useRef(filterKey);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [isLoadMoreError, setIsLoadMoreError] = useState(false);

  useEffect(() => {
    activeFilterKeyRef.current = filterKey;
  }, [filterKey]);

  const refresh = useCallback(async () => {
    refreshingRef.current = true;
    const requestGeneration = ++requestGenerationRef.current;
    loadingMoreRef.current = false;
    setIsLoadingMore(false);
    setHasMore(false);
    setPage(1);
    const requestFilterKey = filterKey;
    setIsRefreshing(true);
    setError(null);
    setIsLoadMoreError(false);

    try {
      const response = await getAnnouncements(
        announcementListParams(filters.status, debouncedSearch, 1),
      );
      const list = unwrapList<Announcement>(response);
      const normalized = sortAnnouncements(list.items);

      if (
        !mountedRef.current ||
        requestGeneration !== requestGenerationRef.current ||
        requestFilterKey !== activeFilterKeyRef.current
      ) return;
      setAnnouncements(normalized);
      setTotal(list.total ?? normalized.length);
      setPage(1);
      setHasMore(normalized.length > 0 && normalized.length < (list.total ?? normalized.length));
      lastSuccessfulFetchAtRef.current = Date.now();
    } catch (nextError) {
      if (
        !mountedRef.current ||
        requestGeneration !== requestGenerationRef.current ||
        requestFilterKey !== activeFilterKeyRef.current
      ) return;
      setError(nextError);
    } finally {
      if (
        mountedRef.current &&
        requestGeneration === requestGenerationRef.current &&
        requestFilterKey === activeFilterKeyRef.current
      ) {
        setIsLoading(false);
        setIsRefreshing(false);
        refreshingRef.current = false;
      }
    }
  }, [debouncedSearch, filterKey, filters.status]);

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || !hasMore) return;
    const nextPage = page + 1;
    const requestGeneration = requestGenerationRef.current;
    const requestFilterKey = filterKey;
    loadingMoreRef.current = true;
    setIsLoadingMore(true);
    setError(null);
    setIsLoadMoreError(false);
    try {
      const response = await getAnnouncements(
        announcementListParams(filters.status, debouncedSearch, nextPage),
      );
      const list = unwrapList<Announcement>(response);
      if (
        !mountedRef.current ||
        requestGeneration !== requestGenerationRef.current ||
        requestFilterKey !== activeFilterKeyRef.current
      ) return;
      setAnnouncements((current) => appendUniqueAnnouncements(current, list.items));
      setTotal(list.total ?? list.items.length);
      setPage(nextPage);
      setHasMore(
        list.items.length === ANNOUNCEMENTS_PAGE_SIZE &&
          nextPage * ANNOUNCEMENTS_PAGE_SIZE < (list.total ?? 0),
      );
    } catch (nextError) {
      if (
        mountedRef.current &&
        requestGeneration === requestGenerationRef.current &&
        requestFilterKey === activeFilterKeyRef.current
      ) {
        setError(nextError);
        setIsLoadMoreError(true);
      }
    } finally {
      if (requestGeneration === requestGenerationRef.current) {
        loadingMoreRef.current = false;
        if (mountedRef.current) setIsLoadingMore(false);
      }
    }
  }, [debouncedSearch, filterKey, filters.status, hasMore, page]);

  useEffect(() => {
    mountedRef.current = true;
    void Promise.resolve().then(refresh);

    return () => {
      mountedRef.current = false;
    };
  }, [refresh]);

  useEffect(() => {
    const handleFocus = () => {
      if (
        !refreshingRef.current &&
        Date.now() - lastSuccessfulFetchAtRef.current > FOCUS_REFRESH_AGE_MS
      ) void refresh();
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [refresh]);

  const mutate = useCallback(
    async (operation: () => Promise<unknown>) => {
      setIsMutating(true);
      setError(null);
      setIsLoadMoreError(false);

      try {
        const response = await operation();
        await refresh();
        return response;
      } catch (nextError) {
        setError(nextError);
        throw nextError;
      } finally {
        if (mountedRef.current) setIsMutating(false);
      }
    },
    [refresh],
  );

  const create = useCallback(
    async (values: AnnouncementFormValues) => {
      const response = await mutate(() =>
        createAnnouncement(payloadFromValues(values, "announcement_create")),
      );
      return unwrapItem<Announcement>(response);
    },
    [mutate],
  );

  const update = useCallback(
    async (announcementId: string, values: AnnouncementFormValues) => {
      const response = await mutate(() =>
        updateAnnouncement(
          announcementId,
          payloadFromValues(
            values,
            "announcement_update",
          ) as UpdateAnnouncementPayload,
        ),
      );
      return unwrapItem<Announcement>(response);
    },
    [mutate],
  );

  const publish = useCallback(
    (announcementId: string) =>
      mutate(() => publishAnnouncement(announcementId)),
    [mutate],
  );

  const archive = useCallback(
    (announcementId: string) =>
      mutate(() => archiveAnnouncement(announcementId)),
    [mutate],
  );

  const hasFilters = useMemo(
    () => filters.search.trim() !== "" || filters.status !== "all",
    [filters.search, filters.status],
  );

  return {
    announcements,
    total,
    hasMore,
    isLoadingMore,
    loadMore,
    filters,
    setFilters,
    isLoading,
    isRefreshing,
    isMutating,
    error,
    isLoadMoreError,
    hasFilters,
    refresh,
    create,
    update,
    publish,
    archive,
  };
}
