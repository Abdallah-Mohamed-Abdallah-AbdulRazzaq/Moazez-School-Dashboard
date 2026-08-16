"use client";

import { useCallback, useRef, useState } from "react";
import { getNotification } from "@/features/communication/api/communication.service";
import type { CommunicationRecord } from "@/features/communication/types/communication.types";
import type { CommunicationNotification } from "@/features/communication/types/notification.types";

const isRecord = (value: unknown): value is CommunicationRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

function unwrapItem<T>(response: unknown): T | null {
  if (!isRecord(response)) return (response ?? null) as T | null;
  const item = [response.data, response.item, response.result, response.payload].find(
    (candidate) => isRecord(candidate) && !Array.isArray(candidate),
  );
  return (item ?? response) as T;
}

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Unable to load notification details.";
}

export function useNotificationDetails() {
  const requestIdRef = useRef(0);
  const [selectedNotificationId, setSelectedNotificationId] =
    useState<string | null>(null);
  const [notification, setNotification] =
    useState<CommunicationNotification | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (notificationId: string) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setIsLoading(true);
    setError(null);

    try {
      const response = await getNotification(notificationId);
      if (requestIdRef.current !== requestId) return null;
      const nextNotification = unwrapItem<CommunicationNotification>(response);
      setNotification(nextNotification);
      return nextNotification;
    } catch (nextError) {
      if (requestIdRef.current !== requestId) return null;
      setError(errorMessage(nextError));
      setNotification(null);
      throw nextError;
    } finally {
      if (requestIdRef.current === requestId) setIsLoading(false);
    }
  }, []);

  const open = useCallback(
    (notificationId: string) => {
      setSelectedNotificationId(notificationId);
      void load(notificationId).catch(() => undefined);
    },
    [load],
  );

  const close = useCallback(() => {
    requestIdRef.current += 1;
    setSelectedNotificationId(null);
    setNotification(null);
    setError(null);
    setIsLoading(false);
  }, []);

  const refresh = useCallback(async () => {
    if (!selectedNotificationId) return null;
    return load(selectedNotificationId);
  }, [load, selectedNotificationId]);

  return {
    notification,
    isLoading,
    error,
    open,
    close,
    refresh,
    selectedNotificationId,
  };
}
