"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

export function useAnnouncements() {
  const mountedRef = useRef(false);
  const [filters, setFilters] =
    useState<AnnouncementFiltersState>(DEFAULT_FILTERS);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);

    try {
      const response = await getAnnouncements({
        ...(filters.status !== "all"
          ? { status: filters.status as AnnouncementStatus }
          : {}),
        ...(filters.search.trim() ? { search: filters.search.trim() } : {}),
        limit: 50,
      });
      const list = unwrapList<Announcement>(response);
      const normalized = sortAnnouncements(list.items);

      if (!mountedRef.current) return;
      setAnnouncements(normalized);
      setTotal(list.total ?? normalized.length);
    } catch (nextError) {
      if (!mountedRef.current) return;
      setError(nextError);
      setAnnouncements([]);
      setTotal(0);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [filters.search, filters.status]);

  useEffect(() => {
    mountedRef.current = true;
    void Promise.resolve().then(refresh);

    return () => {
      mountedRef.current = false;
    };
  }, [refresh]);

  useEffect(() => {
    const handleFocus = () => {
      void refresh();
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
    filters,
    setFilters,
    isLoading,
    isRefreshing,
    isMutating,
    error,
    hasFilters,
    refresh,
    create,
    update,
    publish,
    archive,
  };
}
