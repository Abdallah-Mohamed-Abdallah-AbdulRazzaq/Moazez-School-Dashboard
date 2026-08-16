"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getNotificationDeliveries } from "@/features/communication/api/communication.service";
import type {
  CommunicationList,
  CommunicationRecord,
} from "@/features/communication/types/communication.types";
import type {
  ListNotificationDeliveriesParams,
  NotificationDelivery,
  NotificationDeliveryStatus,
} from "@/features/communication/types/notification.types";

const DEFAULT_PAGE_SIZE = 10;

export interface NotificationDeliveryFiltersState {
  notificationId: string;
  recipientUserId: string;
  channel: string;
  status: "" | NotificationDeliveryStatus;
  provider: string;
  createdFrom: string;
  createdTo: string;
}

const DEFAULT_FILTERS: NotificationDeliveryFiltersState = {
  notificationId: "",
  recipientUserId: "",
  channel: "",
  status: "",
  provider: "",
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
  return error instanceof Error
    ? error.message
    : "Unable to load notification deliveries.";
}

function sortDeliveries(deliveries: NotificationDelivery[]) {
  return [...deliveries].sort((left, right) => {
    const leftDate = left.createdAt ?? left.updatedAt ?? "";
    const rightDate = right.createdAt ?? right.updatedAt ?? "";
    return new Date(rightDate).getTime() - new Date(leftDate).getTime();
  });
}

function isoFromInput(value: string) {
  if (!value.trim()) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function deliveryQuery(
  filters: NotificationDeliveryFiltersState,
  page: number,
  limit: number,
): ListNotificationDeliveriesParams {
  const createdFrom = isoFromInput(filters.createdFrom);
  const createdTo = isoFromInput(filters.createdTo);

  return {
    page,
    limit,
    ...(filters.notificationId ? { notificationId: filters.notificationId } : {}),
    ...(filters.recipientUserId ? { recipientUserId: filters.recipientUserId } : {}),
    ...(filters.channel ? { channel: filters.channel } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.provider.trim() ? { provider: filters.provider.trim() } : {}),
    ...(createdFrom ? { createdFrom } : {}),
    ...(createdTo ? { createdTo } : {}),
  };
}

export function useNotificationDeliveries() {
  const mountedRef = useRef(false);
  const requestIdRef = useRef(0);
  const [deliveries, setDeliveries] = useState<NotificationDelivery[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPageState] = useState(1);
  const [limit, setLimitState] = useState(DEFAULT_PAGE_SIZE);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<NotificationDeliveryFiltersState>(DEFAULT_FILTERS);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setIsRefreshing(true);
    setError(null);

    try {
      const response = await getNotificationDeliveries(
        deliveryQuery(filters, page, limit),
      );
      const list = unwrapList<NotificationDelivery>(response);
      const normalized = sortDeliveries(list.items);

      if (!mountedRef.current || requestId !== requestIdRef.current) return;
      setDeliveries(normalized);
      setTotal(list.total ?? normalized.length);
      setPageState(list.page ?? page);
      setLimitState(list.limit ?? limit);
      setTotalPages(
        list.totalPages ??
          Math.max(1, Math.ceil((list.total ?? normalized.length) / limit)),
      );
    } catch (nextError) {
      if (!mountedRef.current || requestId !== requestIdRef.current) return;
      setError(errorMessageFromUnknown(nextError));
      setDeliveries([]);
      setTotal(0);
    } finally {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [filters, limit, page]);

  const setFiltersAndResetPage = useCallback(
    (nextFilters: NotificationDeliveryFiltersState) => {
      setPageState(1);
      setFilters(nextFilters);
    },
    [],
  );

  const setPage = useCallback((nextPage: number) => {
    setPageState(Math.max(1, Math.trunc(nextPage)));
  }, []);

  const setLimit = useCallback((nextLimit: number) => {
    const normalizedLimit =
      Number.isFinite(nextLimit) && nextLimit > 0
        ? Math.trunc(nextLimit)
        : DEFAULT_PAGE_SIZE;
    setPageState(1);
    setLimitState(normalizedLimit);
  }, []);

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

  return {
    deliveries,
    total,
    filters,
    setFilters: setFiltersAndResetPage,
    pagination: {
      total,
      page,
      limit,
      totalPages,
    },
    setPage,
    setLimit,
    isLoading,
    isRefreshing,
    error,
    refresh,
  };
}
