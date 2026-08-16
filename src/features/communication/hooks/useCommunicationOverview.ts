"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getAdminOverview,
  getConversations,
  getMessageReports,
  getNotifications,
  getPolicy,
  getRestrictions,
} from "@/features/communication/api/communication.service";
import { COMMUNICATION_SOCKET_EVENTS } from "@/features/communication/realtime/communication-events";
import type {
  CommunicationAdminOverview,
  CommunicationList,
  CommunicationPolicy,
  CommunicationRecord,
} from "@/features/communication/types/communication.types";
import type { Conversation } from "@/features/communication/types/conversation.types";
import type { CommunicationNotification } from "@/features/communication/types/notification.types";
import type {
  MessageReport,
  Restriction,
} from "@/features/communication/types/safety.types";
import { useCommunicationSocket } from "./useCommunicationSocket";

export interface CommunicationOverviewData {
  adminOverview: CommunicationAdminOverview | null;
  policy: CommunicationPolicy | null;
  conversations: CommunicationList<Conversation>;
  notifications: CommunicationList<CommunicationNotification>;
  reports: CommunicationList<MessageReport>;
  restrictions: CommunicationList<Restriction>;
}

interface OverviewRequestResult {
  data: CommunicationOverviewData;
  errors: string[];
}

const EMPTY_LIST = {
  items: [],
  total: 0,
  page: 1,
  limit: 0,
} satisfies CommunicationList<never>;

const isRecord = (value: unknown): value is CommunicationRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

function cloneEmptyList<T>(): CommunicationList<T> {
  return { ...EMPTY_LIST, items: [] };
}

function numberFromUnknown(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function unwrapItem<T>(response: unknown): T | null {
  if (!isRecord(response)) {
    return (response ?? null) as T | null;
  }

  const candidates = [
    response.data,
    response.item,
    response.result,
    response.payload,
  ];

  const item = candidates.find((candidate) => {
    if (!candidate) return false;
    if (Array.isArray(candidate)) return false;
    return typeof candidate === "object";
  });

  return (item ?? response) as T;
}

function unwrapList<T>(response: unknown): CommunicationList<T> {
  if (Array.isArray(response)) {
    return { items: response as T[], total: response.length };
  }

  if (!isRecord(response)) {
    return cloneEmptyList<T>();
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

  return cloneEmptyList<T>();
}

function errorMessageFromUnknown(error: unknown): string {
  return error instanceof Error ? error.message : "Unable to load communication data.";
}

async function safeRequest<T>(
  request: () => Promise<unknown>,
  normalize: (response: unknown) => T,
): Promise<{ data: T; error: string | null }> {
  try {
    return {
      data: normalize(await request()),
      error: null,
    };
  } catch (error) {
    return {
      data: normalize(null),
      error: errorMessageFromUnknown(error),
    };
  }
}

async function fetchOverviewData(): Promise<OverviewRequestResult> {
  const [
    adminOverview,
    policy,
    conversations,
    notifications,
    reports,
    restrictions,
  ] = await Promise.all([
    safeRequest(getAdminOverview, (response) =>
      unwrapItem<CommunicationAdminOverview>(response),
    ),
    safeRequest(getPolicy, (response) =>
      unwrapItem<CommunicationPolicy>(response),
    ),
    safeRequest(
      () => getConversations({ status: "active", limit: 5 }),
      unwrapList<Conversation>,
    ),
    safeRequest(
      () => getNotifications({ limit: 5 }),
      unwrapList<CommunicationNotification>,
    ),
    safeRequest(
      () => getMessageReports({ status: "open", limit: 20 }),
      unwrapList<MessageReport>,
    ),
    safeRequest(
      () => getRestrictions({ activeOnly: true, limit: 20 }),
      unwrapList<Restriction>,
    ),
  ]);

  return {
    data: {
      adminOverview: adminOverview.data,
      policy: policy.data,
      conversations: conversations.data,
      notifications: notifications.data,
      reports: reports.data,
      restrictions: restrictions.data,
    },
    errors: [
      adminOverview.error,
      policy.error,
      conversations.error,
      notifications.error,
      reports.error,
      restrictions.error,
    ].filter((error): error is string => Boolean(error)),
  };
}

export function useCommunicationOverview() {
  const { socket, resyncVersion } = useCommunicationSocket();
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(false);
  const [data, setData] = useState<CommunicationOverviewData>(() => ({
    adminOverview: null,
    policy: null,
    conversations: cloneEmptyList(),
    notifications: cloneEmptyList(),
    reports: cloneEmptyList(),
    restrictions: cloneEmptyList(),
  }));
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);

    try {
      const result = await fetchOverviewData();
      if (!mountedRef.current) return;

      setData(result.data);
      setError(result.errors.length > 0 ? result.errors[0] : null);
    } catch (nextError) {
      if (!mountedRef.current) return;
      setError(errorMessageFromUnknown(nextError));
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  const debouncedRefresh = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    refreshTimerRef.current = setTimeout(() => {
      refreshTimerRef.current = null;
      void refresh();
    }, 500);
  }, [refresh]);

  useEffect(() => {
    mountedRef.current = true;
    void Promise.resolve().then(refresh);

    return () => {
      mountedRef.current = false;
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [refresh]);

  useEffect(() => {
    if (resyncVersion > 0) {
    void Promise.resolve().then(refresh);
    }
  }, [refresh, resyncVersion]);

  useEffect(() => {
    if (!socket) return;

    socket.on(COMMUNICATION_SOCKET_EVENTS.messageCreated, debouncedRefresh);
    socket.on(COMMUNICATION_SOCKET_EVENTS.messageUpdated, debouncedRefresh);
    socket.on(COMMUNICATION_SOCKET_EVENTS.messageDeleted, debouncedRefresh);

    return () => {
      socket.off(COMMUNICATION_SOCKET_EVENTS.messageCreated, debouncedRefresh);
      socket.off(COMMUNICATION_SOCKET_EVENTS.messageUpdated, debouncedRefresh);
      socket.off(COMMUNICATION_SOCKET_EVENTS.messageDeleted, debouncedRefresh);
    };
  }, [debouncedRefresh, socket]);

  const hasAnyContent = useMemo(
    () =>
      Boolean(data.adminOverview) ||
      Boolean(data.policy) ||
      data.conversations.items.length > 0 ||
      data.notifications.items.length > 0 ||
      data.reports.items.length > 0 ||
      data.restrictions.items.length > 0,
    [data],
  );

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    hasAnyContent,
    refresh,
  };
}
