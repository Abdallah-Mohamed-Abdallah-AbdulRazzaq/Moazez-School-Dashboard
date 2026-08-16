"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  archiveNotification,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/features/communication/api/communication.service";
import { COMMUNICATION_SOCKET_EVENTS } from "@/features/communication/realtime/communication-events";
import type { CommunicationRealtimePayload } from "@/features/communication/realtime/communication-socket";
import type {
  CommunicationList,
  CommunicationRecord,
} from "@/features/communication/types/communication.types";
import type {
  CommunicationNotification,
  CommunicationNotificationStatus,
  ListNotificationsParams,
  NotificationPriority,
  NotificationSourceModule,
  NotificationType,
} from "@/features/communication/types/notification.types";
import { isApiError } from "@/lib/api-error";
import { useCommunicationSocket } from "./useCommunicationSocket";

export type NotificationStatusFilter = "all" | "unread" | "read" | "archived";

export interface NotificationFiltersState {
  status: NotificationStatusFilter;
  priority: "" | NotificationPriority;
  type: "" | NotificationType;
  sourceModule: "" | NotificationSourceModule;
  sourceType: string;
  sourceId: string;
  recipientUserId: string;
  createdFrom: string;
  createdTo: string;
}

const DEFAULT_FILTERS: NotificationFiltersState = {
  status: "all",
  priority: "",
  type: "",
  sourceModule: "",
  sourceType: "",
  sourceId: "",
  recipientUserId: "",
  createdFrom: "",
  createdTo: "",
};

const isRecord = (value: unknown): value is CommunicationRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

function numberFromUnknown(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
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

  const notificationSource = sources.find((source) =>
    Array.isArray(source.notifications),
  );

  if (notificationSource) {
    const items = notificationSource.notifications as T[];
    const pagination = isRecord(notificationSource.pagination)
      ? notificationSource.pagination
      : undefined;

    return {
      ...notificationSource,
      items,
      total:
        numberFromUnknown(pagination?.total) ??
        numberFromUnknown(notificationSource.total) ??
        numberFromUnknown(notificationSource.count) ??
        items.length,
      page:
        numberFromUnknown(pagination?.page) ??
        numberFromUnknown(notificationSource.page),
      limit:
        numberFromUnknown(pagination?.limit) ??
        numberFromUnknown(notificationSource.limit),
      totalPages: numberFromUnknown(notificationSource.totalPages),
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

function errorMessageFromUnknown(error: unknown): string {
  return error instanceof Error ? error.message : "Unable to load notifications.";
}

function sortNotifications(notifications: CommunicationNotification[]) {
  return [...notifications].sort((left, right) => {
    const leftDate = left.createdAt ?? left.updatedAt ?? "";
    const rightDate = right.createdAt ?? right.updatedAt ?? "";
    return new Date(rightDate).getTime() - new Date(leftDate).getTime();
  });
}

function normalizeNotification(
  notification: CommunicationNotification,
): CommunicationNotification {
  const notificationId =
    notification.id ??
    (typeof notification.notificationId === "string"
      ? notification.notificationId
      : undefined) ??
    (typeof notification.notification_id === "string"
      ? notification.notification_id
      : undefined);

  return notificationId ? { ...notification, id: notificationId } : notification;
}

function notificationFromRealtimePayload(
  payload: CommunicationRealtimePayload,
): CommunicationNotification | null {
  if (!isRecord(payload.notification)) return null;

  const notification = normalizeNotification(
    payload.notification as CommunicationNotification,
  );
  return typeof notification.id === "string" && notification.id.trim()
    ? notification
    : null;
}

function matchesNotificationFilters(
  notification: CommunicationNotification,
  filters: NotificationFiltersState,
  recipientUserId?: string,
): boolean {
  const createdAt = notification.createdAt ?? "";
  const notificationRecipientUserId =
    notification.recipientUserId ?? recipientUserId;
  return [
    filters.status === "all" || notification.status === filters.status,
    !filters.priority || notification.priority === filters.priority,
    !filters.type || notification.type === filters.type,
    !filters.sourceModule || notification.sourceModule === filters.sourceModule,
    !filters.sourceType || notification.sourceType === filters.sourceType,
    !filters.sourceId || notification.sourceId === filters.sourceId,
    !filters.recipientUserId ||
      notificationRecipientUserId === filters.recipientUserId,
    !filters.createdFrom || createdAt >= (isoFromInput(filters.createdFrom) ?? ""),
    !filters.createdTo || createdAt <= (isoFromInput(filters.createdTo) ?? ""),
  ].every(Boolean);
}

function isoFromInput(value: string) {
  if (!value.trim()) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export interface UseNotificationsOptions {
  recipientUserId?: string;
  /** True only for feeds that refresh outside a user-initiated page action. */
  isBackground?: boolean;
}

function paramsFromFilters(
  filters: NotificationFiltersState,
  options: UseNotificationsOptions = {},
  pagination?: { page: number; limit?: number },
): ListNotificationsParams {
  return {
    ...(filters.status !== "all"
      ? { status: filters.status as CommunicationNotificationStatus }
      : {}),
    ...(filters.priority ? { priority: filters.priority } : {}),
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.sourceModule ? { sourceModule: filters.sourceModule } : {}),
    ...(filters.sourceType.trim() ? { sourceType: filters.sourceType.trim() } : {}),
    ...(filters.sourceId.trim() ? { sourceId: filters.sourceId.trim() } : {}),
    ...(options.recipientUserId
      ? { recipientUserId: options.recipientUserId }
      : filters.recipientUserId.trim()
        ? { recipientUserId: filters.recipientUserId.trim() }
        : {}),
    ...(isoFromInput(filters.createdFrom)
      ? { createdFrom: isoFromInput(filters.createdFrom) }
      : {}),
    ...(isoFromInput(filters.createdTo)
      ? { createdTo: isoFromInput(filters.createdTo) }
      : {}),
    ...(pagination?.page && (pagination.page > 1 || pagination.limit)
      ? { page: pagination.page }
      : {}),
    ...(pagination?.limit ? { limit: pagination.limit } : {}),
  };
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { socket, resyncVersion } = useCommunicationSocket();
  const { isBackground = false, recipientUserId } = options;
  const mountedRef = useRef(false);
  const [filters, setFilters] =
    useState<NotificationFiltersState>(DEFAULT_FILTERS);
  const [notifications, setNotifications] = useState<
    CommunicationNotification[]
  >([]);
  const [total, setTotal] = useState(0);
  const [page, setPageState] = useState(1);
  const [limit, setLimitState] = useState<number | undefined>(undefined);
  const [requestedLimit, setRequestedLimit] = useState<number | undefined>(
    undefined,
  );
  const [totalPages, setTotalPages] = useState<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBackgroundRefreshForbidden, setIsBackgroundRefreshForbidden] =
    useState(false);

  const refresh = useCallback(async (refreshOptions?: { background?: boolean }) => {
    const isBackgroundRequest =
      isBackground && refreshOptions?.background === true;
    setIsRefreshing(true);
    setError(null);

    try {
      const params = paramsFromFilters(filters, { recipientUserId }, {
        page,
        limit: requestedLimit,
      });
      const response = await getNotifications(params);
      const list = unwrapList<CommunicationNotification>(response);
      const normalized = sortNotifications(list.items.map(normalizeNotification));

      if (!mountedRef.current) return;
      setNotifications(normalized);
      setTotal(list.total ?? normalized.length);
      setPageState(list.page ?? page);
      setLimitState(list.limit ?? requestedLimit);
      setTotalPages(list.totalPages);
      if (isBackground && !isBackgroundRequest) {
        setIsBackgroundRefreshForbidden(false);
      }
    } catch (nextError) {
      if (!mountedRef.current) return;
      if (isBackgroundRequest && isApiError(nextError) && nextError.status === 403) {
        setIsBackgroundRefreshForbidden(true);
        return;
      }
      setError(errorMessageFromUnknown(nextError));
      setNotifications([]);
      setTotal(0);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [filters, isBackground, page, recipientUserId, requestedLimit]);

  const setFiltersAndResetPage = useCallback(
    (
      nextFilters:
        | NotificationFiltersState
        | ((current: NotificationFiltersState) => NotificationFiltersState),
    ) => {
      setPageState(1);
      setFilters(nextFilters);
    },
    [],
  );

  const setPage = useCallback((nextPage: number) => {
    setPageState(Math.max(1, Math.trunc(nextPage)));
  }, []);

  const setLimit = useCallback((nextLimit?: number) => {
    const normalizedLimit =
      typeof nextLimit === "number" && Number.isFinite(nextLimit) && nextLimit > 0
        ? Math.trunc(nextLimit)
        : undefined;
    setPageState(1);
    setRequestedLimit(normalizedLimit);
    setLimitState(normalizedLimit);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void Promise.resolve().then(() => refresh({ background: isBackground }));

    return () => {
      mountedRef.current = false;
    };
  }, [isBackground, refresh]);

  useEffect(() => {
    if (isBackground && isBackgroundRefreshForbidden) return;

    const handleFocus = () => {
      void refresh({ background: isBackground });
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [isBackground, isBackgroundRefreshForbidden, refresh]);

  const addRealtimeNotification = useCallback(
    (payload: CommunicationRealtimePayload) => {
      const notification = notificationFromRealtimePayload(payload);
      if (
        !notification ||
        page !== 1 ||
        !matchesNotificationFilters(notification, filters, recipientUserId)
      ) {
        return;
      }

      const replacesExistingNotification = notifications.some(
        (currentNotification) => currentNotification.id === notification.id,
      );
      setNotifications((currentNotifications) =>
        sortNotifications([
          notification,
          ...currentNotifications.filter(
            (currentNotification) => currentNotification.id !== notification.id,
          ),
        ]),
      );
      if (!replacesExistingNotification) {
        setTotal((currentTotal) => currentTotal + 1);
      }
    },
    [filters, notifications, page, recipientUserId],
  );

  useEffect(() => {
    if (isBackground && isBackgroundRefreshForbidden) return;
    if (!socket) return;

    socket.on(COMMUNICATION_SOCKET_EVENTS.notificationCreated, addRealtimeNotification);

    return () => {
      socket.off(
        COMMUNICATION_SOCKET_EVENTS.notificationCreated,
        addRealtimeNotification,
      );
    };
  }, [addRealtimeNotification, isBackground, isBackgroundRefreshForbidden, socket]);

  useEffect(() => {
    if (resyncVersion === 0) return;

    let cancelled = false;
    void Promise.resolve().then(() => {
      if (!cancelled) {
        return refresh({ background: isBackground });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isBackground, refresh, resyncVersion]);

  const markAllRead = useCallback(async () => {
    setIsMutating(true);
    setError(null);

    const backupNotifications = notifications;
    const backupTotal = total;

    setNotifications((prev) =>
      prev.map((n) => ({
        ...n,
        status: "read" as const,
        readAt: n.readAt ?? new Date().toISOString(),
      }))
    );

    try {
      const response = await markAllNotificationsRead();
      await refresh();
      return response;
    } catch (nextError) {
      if (mountedRef.current) {
        setNotifications(backupNotifications);
        setTotal(backupTotal);
        setError(errorMessageFromUnknown(nextError));
      }
      console.warn("Failed to mark all notifications read:", nextError);
      throw nextError;
    } finally {
      if (mountedRef.current) setIsMutating(false);
    }
  }, [notifications, total, refresh]);

  const markRead = useCallback(
    async (notificationId: string) => {
      setIsMutating(true);
      setError(null);

      const backupNotifications = notifications;
      const backupTotal = total;

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId
            ? { ...n, status: "read" as const, readAt: new Date().toISOString() }
            : n
        )
      );

      try {
        const response = await markNotificationRead(notificationId);
        await refresh();
        return response;
      } catch (nextError) {
        if (mountedRef.current) {
          setNotifications(backupNotifications);
          setTotal(backupTotal);
          setError(errorMessageFromUnknown(nextError));
        }
        console.warn(`Failed to mark notification ${notificationId} read:`, nextError);
        throw nextError;
      } finally {
        if (mountedRef.current) setIsMutating(false);
      }
    },
    [notifications, total, refresh],
  );

  const archive = useCallback(
    async (notificationId: string) => {
      setIsMutating(true);
      setError(null);

      const backupNotifications = notifications;
      const backupTotal = total;

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId
            ? { ...n, status: "archived" as const, archivedAt: new Date().toISOString() }
            : n
        )
      );

      try {
        const response = await archiveNotification(notificationId);
        await refresh();
        return response;
      } catch (nextError) {
        if (mountedRef.current) {
          setNotifications(backupNotifications);
          setTotal(backupTotal);
          setError(errorMessageFromUnknown(nextError));
        }
        console.warn(`Failed to archive notification ${notificationId}:`, nextError);
        throw nextError;
      } finally {
        if (mountedRef.current) setIsMutating(false);
      }
    },
    [notifications, total, refresh],
  );

  const unreadCount = useMemo(
    () =>
      notifications.filter(
        (notification) =>
          notification.status === "unread" || !notification.readAt,
      ).length,
    [notifications],
  );

  return {
    notifications,
    total,
    unreadCount,
    filters,
    setFilters: setFiltersAndResetPage,
    pagination: {
      total,
      page,
      limit,
      totalPages:
        totalPages ??
        (limit && limit > 0 ? Math.max(1, Math.ceil(total / limit)) : undefined),
    },
    setPage,
    setLimit,
    isLoading,
    isRefreshing,
    isMutating,
    error,
    refresh,
    markAllRead,
    markRead,
    archive,
  };
}
