"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createRestriction,
  deleteRestriction,
  getRestrictions,
  updateRestriction,
} from "@/features/communication/api/communication.service";
import { createCommunicationMetadata } from "@/features/communication/utils/communication-metadata";
import type {
  CommunicationList,
  CommunicationRecord,
} from "@/features/communication/types/communication.types";
import type {
  CreateRestrictionPayload,
  Restriction,
  RestrictionType,
  UpdateRestrictionPayload,
} from "@/features/communication/types/safety.types";

export interface RestrictionFiltersState {
  activeOnly: boolean;
  targetUserId: string;
}

export interface RestrictionFormValues {
  targetUserId: string;
  type: RestrictionType;
  reason: string;
  expiresAt?: string;
}

const DEFAULT_FILTERS: RestrictionFiltersState = {
  activeOnly: true,
  targetUserId: "",
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
  if (!isRecord(response)) return { items: [], total: 0 };

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
  return error instanceof Error ? error.message : "Unable to load restrictions.";
}

function payloadFromValues(
  values: RestrictionFormValues,
): CreateRestrictionPayload {
  const metadata = createCommunicationMetadata("restriction_create", {
    appliedFrom: "restrictions_page",
    workflow: "manual_moderation",
  });

  return {
    targetUserId: values.targetUserId.trim(),
    type: values.type,
    reason: values.reason.trim(),
    ...(values.expiresAt ? { expiresAt: new Date(values.expiresAt).toISOString() } : {}),
    ...(metadata ? { metadata } : {}),
  };
}

function updatePayloadFromValues(
  values: RestrictionFormValues,
): UpdateRestrictionPayload {
  const metadata = createCommunicationMetadata("restriction_update", {
    updatedFrom: "restrictions_page",
  });

  return {
    reason: values.reason.trim(),
    ...(values.expiresAt ? { expiresAt: new Date(values.expiresAt).toISOString() } : {}),
    ...(metadata ? { metadata } : {}),
  };
}

function sortRestrictions(restrictions: Restriction[]) {
  return [...restrictions].sort((left, right) => {
    const leftDate = left.updatedAt ?? left.createdAt ?? "";
    const rightDate = right.updatedAt ?? right.createdAt ?? "";
    return new Date(rightDate).getTime() - new Date(leftDate).getTime();
  });
}

export function useRestrictions() {
  const mountedRef = useRef(false);
  const [filters, setFilters] =
    useState<RestrictionFiltersState>(DEFAULT_FILTERS);
  const [restrictions, setRestrictions] = useState<Restriction[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);

    try {
      const response = await getRestrictions({
        activeOnly: filters.activeOnly,
        ...(filters.targetUserId.trim()
          ? { targetUserId: filters.targetUserId.trim() }
          : {}),
        limit: 50,
      });
      const list = unwrapList<Restriction>(response);
      const normalized = sortRestrictions(list.items);

      if (!mountedRef.current) return;
      setRestrictions(normalized);
      setTotal(list.total ?? normalized.length);
    } catch (nextError) {
      if (!mountedRef.current) return;
      setError(errorMessageFromUnknown(nextError));
      setRestrictions([]);
      setTotal(0);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [filters.activeOnly, filters.targetUserId]);

  useEffect(() => {
    mountedRef.current = true;
    void Promise.resolve().then(refresh);
    return () => {
      mountedRef.current = false;
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
        setError(errorMessageFromUnknown(nextError));
        throw nextError;
      } finally {
        if (mountedRef.current) setIsMutating(false);
      }
    },
    [refresh],
  );

  const create = useCallback(
    async (values: RestrictionFormValues) => {
      const response = await mutate(() => createRestriction(payloadFromValues(values)));
      return unwrapItem<Restriction>(response);
    },
    [mutate],
  );

  const update = useCallback(
    async (restrictionId: string, values: RestrictionFormValues) => {
      const response = await mutate(() =>
        updateRestriction(restrictionId, updatePayloadFromValues(values)),
      );
      return unwrapItem<Restriction>(response);
    },
    [mutate],
  );

  const revoke = useCallback(
    (restrictionId: string) => mutate(() => deleteRestriction(restrictionId)),
    [mutate],
  );

  const hasFilters = useMemo(
    () => filters.activeOnly || filters.targetUserId.trim() !== "",
    [filters.activeOnly, filters.targetUserId],
  );

  return {
    restrictions,
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
    revoke,
  };
}
