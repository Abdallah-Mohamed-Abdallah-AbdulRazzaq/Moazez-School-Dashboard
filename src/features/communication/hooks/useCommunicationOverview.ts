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
import { logRealtimeEvent } from "@/features/communication/realtime/communication-realtime-diagnostics";
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

type OverviewResourceKey = keyof CommunicationOverviewData;
type OverviewResourceLoader = () => Promise<{
  resourceData: unknown;
  error: string | null;
}>;

interface OverviewResourceResponse {
  resourceKey: OverviewResourceKey;
  resourceData: unknown;
  error: string | null;
}

const EMPTY_LIST = {
  items: [],
  total: 0,
  page: 1,
  limit: 0,
} satisfies CommunicationList<never>;

const ALL_OVERVIEW_RESOURCES: readonly OverviewResourceKey[] = [
  "adminOverview",
  "policy",
  "conversations",
  "notifications",
  "reports",
  "restrictions",
];
const MESSAGE_OVERVIEW_RESOURCES: readonly OverviewResourceKey[] = [
  "adminOverview",
  "conversations",
];
const NOTIFICATION_OVERVIEW_RESOURCES: readonly OverviewResourceKey[] = [
  "adminOverview",
  "notifications",
];
const ANNOUNCEMENT_OVERVIEW_RESOURCES: readonly OverviewResourceKey[] = [
  "adminOverview",
];

const isRecord = (value: unknown): value is CommunicationRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

function cloneEmptyList<T>(): CommunicationList<T> {
  return { ...EMPTY_LIST, items: [] };
}

function numberFromUnknown(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function unwrapItem<T>(response: unknown): T | null {
  if (!isRecord(response)) return (response ?? null) as T | null;
  const candidates = [
    response.data,
    response.item,
    response.result,
    response.payload,
  ];
  const normalizedItem = candidates.find(
    (candidate) =>
      Boolean(candidate) &&
      !Array.isArray(candidate) &&
      typeof candidate === "object",
  );
  return (normalizedItem ?? response) as T;
}

function unwrapList<T>(response: unknown): CommunicationList<T> {
  if (Array.isArray(response)) {
    return { items: response as T[], total: response.length };
  }
  if (!isRecord(response)) return cloneEmptyList<T>();

  const sources = [response, response.data, response.result, response.payload].filter(
    isRecord,
  );
  const listSource = sources.find((source) => Array.isArray(source.items));
  if (listSource) {
    const items = listSource.items as T[];
    return {
      ...listSource,
      items,
      total:
        numberFromUnknown(listSource.total) ??
        numberFromUnknown(listSource.count) ??
        items.length,
      page: numberFromUnknown(listSource.page),
      limit: numberFromUnknown(listSource.limit),
      totalPages: numberFromUnknown(listSource.totalPages),
    };
  }

  const arrayResponse = [response.data, response.result, response.payload].find(
    Array.isArray,
  );
  if (!arrayResponse) return cloneEmptyList<T>();
  return { items: arrayResponse as T[], total: arrayResponse.length };
}

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Unable to load communication data.";
}

async function loadOverviewResource(
  request: () => Promise<unknown>,
  normalize: (response: unknown) => unknown,
) {
  try {
    return { resourceData: normalize(await request()), error: null };
  } catch (requestError) {
    return { resourceData: undefined, error: errorMessage(requestError) };
  }
}

const OVERVIEW_RESOURCE_LOADERS: Record<
  OverviewResourceKey,
  OverviewResourceLoader
> = {
  adminOverview: () =>
    loadOverviewResource(getAdminOverview, (response) =>
      unwrapItem<CommunicationAdminOverview>(response),
    ),
  policy: () =>
    loadOverviewResource(getPolicy, (response) =>
      unwrapItem<CommunicationPolicy>(response),
    ),
  conversations: () =>
    loadOverviewResource(
      () => getConversations({ status: "active", limit: 5 }),
      unwrapList<Conversation>,
    ),
  notifications: () =>
    loadOverviewResource(
      () => getNotifications({ limit: 5 }),
      unwrapList<CommunicationNotification>,
    ),
  reports: () =>
    loadOverviewResource(
      () => getMessageReports({ status: "open", limit: 20 }),
      unwrapList<MessageReport>,
    ),
  restrictions: () =>
    loadOverviewResource(
      () => getRestrictions({ activeOnly: true, limit: 20 }),
      unwrapList<Restriction>,
    ),
};

async function fetchOverviewResources(
  resourceKeys: readonly OverviewResourceKey[],
): Promise<OverviewResourceResponse[]> {
  return Promise.all(
    resourceKeys.map(async (resourceKey) => ({
      resourceKey,
      ...(await OVERVIEW_RESOURCE_LOADERS[resourceKey]()),
    })),
  );
}

function initialResourceGenerations(): Record<OverviewResourceKey, number> {
  return Object.fromEntries(
    ALL_OVERVIEW_RESOURCES.map((resourceKey) => [resourceKey, 0]),
  ) as Record<OverviewResourceKey, number>;
}

function advanceResourceGenerations(
  generations: Record<OverviewResourceKey, number>,
  resourceKeys: readonly OverviewResourceKey[],
) {
  return new Map(
    resourceKeys.map((resourceKey) => {
      const generation = generations[resourceKey] + 1;
      generations[resourceKey] = generation;
      return [resourceKey, generation] as const;
    }),
  );
}

function selectCurrentResponses(
  responses: OverviewResourceResponse[],
  generations: Record<OverviewResourceKey, number>,
  requestedGenerations: ReadonlyMap<OverviewResourceKey, number>,
) {
  return responses.filter(
    ({ resourceKey }) =>
      generations[resourceKey] === requestedGenerations.get(resourceKey),
  );
}

function successfulRefreshData(responses: OverviewResourceResponse[]) {
  const refreshedEntries = responses
    .filter((response) => !response.error)
    .map(({ resourceKey, resourceData }) => [resourceKey, resourceData]);
  return Object.fromEntries(
    refreshedEntries,
  ) as Partial<CommunicationOverviewData>;
}

export function useCommunicationOverview() {
  const { socket, resyncVersion } = useCommunicationSocket();
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingResourceKeysRef = useRef(new Set<OverviewResourceKey>());
  const resourceGenerationsRef = useRef(initialResourceGenerations());
  const activeRefreshCountRef = useRef(0);
  const previousResyncVersionRef = useRef(resyncVersion);
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

  const refreshResources = useCallback(
    async (resourceKeys: readonly OverviewResourceKey[]) => {
      const requestedGenerations = advanceResourceGenerations(
        resourceGenerationsRef.current,
        resourceKeys,
      );
      activeRefreshCountRef.current += 1;
      setIsRefreshing(true);
      setError(null);
      const resourceResponses = await fetchOverviewResources(resourceKeys);
      activeRefreshCountRef.current -= 1;
      if (!mountedRef.current) return;

      const currentResponses = selectCurrentResponses(
        resourceResponses,
        resourceGenerationsRef.current,
        requestedGenerations,
      );
      if (currentResponses.length > 0) {
        setData((currentData) => ({
          ...currentData,
          ...successfulRefreshData(currentResponses),
        }));
        setError(
          currentResponses.find((response) => response.error)?.error ?? null,
        );
        setIsLoading(false);
      }
      setIsRefreshing(activeRefreshCountRef.current > 0);
      logRealtimeEvent("overview_refresh_completed", {
        resourceCount: currentResponses.length,
      });
    },
    [],
  );

  const cancelScheduledRefresh = useCallback(() => {
    if (refreshTimerRef.current !== null) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
    pendingResourceKeysRef.current.clear();
  }, []);

  const refresh = useCallback(
    () => {
      cancelScheduledRefresh();
      return refreshResources(ALL_OVERVIEW_RESOURCES);
    },
    [cancelScheduledRefresh, refreshResources],
  );

  const scheduleResourceRefresh = useCallback(
    (resourceKeys: readonly OverviewResourceKey[]) => {
      resourceKeys.forEach((resourceKey) =>
        pendingResourceKeysRef.current.add(resourceKey),
      );
      if (refreshTimerRef.current !== null) return;

      logRealtimeEvent("overview_refresh_scheduled", {
        resourceCount: pendingResourceKeysRef.current.size,
      });
      refreshTimerRef.current = setTimeout(() => {
        refreshTimerRef.current = null;
        const pendingResourceKeys = [...pendingResourceKeysRef.current];
        pendingResourceKeysRef.current.clear();
        void refreshResources(pendingResourceKeys);
      }, 500);
    },
    [refreshResources],
  );

  useEffect(() => {
    const pendingResourceKeys = pendingResourceKeysRef.current;
    mountedRef.current = true;
    void Promise.resolve().then(refresh);
    return () => {
      mountedRef.current = false;
      cancelScheduledRefresh();
      pendingResourceKeys.clear();
    };
  }, [cancelScheduledRefresh, refresh]);

  useEffect(() => {
    if (previousResyncVersionRef.current === resyncVersion) return;
    previousResyncVersionRef.current = resyncVersion;
    void Promise.resolve().then(refresh);
  }, [refresh, resyncVersion]);

  useEffect(() => {
    if (!socket) return;
    const refreshMessages = () =>
      scheduleResourceRefresh(MESSAGE_OVERVIEW_RESOURCES);
    const refreshNotifications = () =>
      scheduleResourceRefresh(NOTIFICATION_OVERVIEW_RESOURCES);
    const refreshAnnouncements = () =>
      scheduleResourceRefresh(ANNOUNCEMENT_OVERVIEW_RESOURCES);

    socket.on(COMMUNICATION_SOCKET_EVENTS.messageCreated, refreshMessages);
    socket.on(COMMUNICATION_SOCKET_EVENTS.messageUpdated, refreshMessages);
    socket.on(COMMUNICATION_SOCKET_EVENTS.messageDeleted, refreshMessages);
    socket.on(
      COMMUNICATION_SOCKET_EVENTS.notificationCreated,
      refreshNotifications,
    );
    socket.on(COMMUNICATION_SOCKET_EVENTS.notificationRead, refreshNotifications);
    socket.on(
      COMMUNICATION_SOCKET_EVENTS.announcementPublished,
      refreshAnnouncements,
    );

    return () => {
      socket.off(COMMUNICATION_SOCKET_EVENTS.messageCreated, refreshMessages);
      socket.off(COMMUNICATION_SOCKET_EVENTS.messageUpdated, refreshMessages);
      socket.off(COMMUNICATION_SOCKET_EVENTS.messageDeleted, refreshMessages);
      socket.off(
        COMMUNICATION_SOCKET_EVENTS.notificationCreated,
        refreshNotifications,
      );
      socket.off(
        COMMUNICATION_SOCKET_EVENTS.notificationRead,
        refreshNotifications,
      );
      socket.off(
        COMMUNICATION_SOCKET_EVENTS.announcementPublished,
        refreshAnnouncements,
      );
    };
  }, [scheduleResourceRefresh, socket]);

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
