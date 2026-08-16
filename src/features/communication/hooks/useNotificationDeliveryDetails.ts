"use client";

import { useCallback, useRef, useState } from "react";
import { getNotificationDelivery } from "@/features/communication/api/communication.service";
import type { CommunicationRecord } from "@/features/communication/types/communication.types";
import type { NotificationDelivery } from "@/features/communication/types/notification.types";

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
    : "Unable to load delivery details.";
}

export function useNotificationDeliveryDetails() {
  const requestIdRef = useRef(0);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(
    null,
  );
  const [delivery, setDelivery] = useState<NotificationDelivery | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (deliveryId: string) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setIsLoading(true);
    setError(null);

    try {
      const response = await getNotificationDelivery(deliveryId);
      if (requestIdRef.current !== requestId) return null;
      const nextDelivery = unwrapItem<NotificationDelivery>(response);
      setDelivery(nextDelivery);
      return nextDelivery;
    } catch (nextError) {
      if (requestIdRef.current !== requestId) return null;
      setError(errorMessage(nextError));
      setDelivery(null);
      throw nextError;
    } finally {
      if (requestIdRef.current === requestId) setIsLoading(false);
    }
  }, []);

  const open = useCallback(
    (deliveryId: string) => {
      setSelectedDeliveryId(deliveryId);
      void load(deliveryId).catch(() => undefined);
    },
    [load],
  );

  const close = useCallback(() => {
    requestIdRef.current += 1;
    setSelectedDeliveryId(null);
    setDelivery(null);
    setError(null);
    setIsLoading(false);
  }, []);

  const refresh = useCallback(async () => {
    if (!selectedDeliveryId) return null;
    return load(selectedDeliveryId);
  }, [load, selectedDeliveryId]);

  return {
    delivery,
    isLoading,
    error,
    open,
    close,
    refresh,
    selectedDeliveryId,
  };
}
