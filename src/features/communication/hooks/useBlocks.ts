"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createBlock,
  deleteBlock,
  getBlocks,
} from "@/features/communication/api/communication.service";
import { createCommunicationMetadata } from "@/features/communication/utils/communication-metadata";
import { isApiError } from "@/lib/api-error";
import { useAuth } from "@/hooks/use-auth";
import type {
  CommunicationList,
  CommunicationRecord,
} from "@/features/communication/types/communication.types";
import type {
  CreateBlockPayload,
  UserBlock,
} from "@/features/communication/types/safety.types";

export interface BlockFiltersState {
  targetUserId: string;
}

export interface BlockFormValues {
  targetUserId: string;
  reason?: string;
}

const DEFAULT_FILTERS: BlockFiltersState = {
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

function payloadFromValues(values: BlockFormValues): CreateBlockPayload {
  return {
    targetUserId: values.targetUserId.trim(),
    ...(values.reason?.trim() ? { reason: values.reason.trim() } : {}),
    metadata: createCommunicationMetadata("block_create", {
      createdFrom: "blocks_page",
      workflow: "manual_moderation",
    }),
  };
}

function sortBlocks(blocks: UserBlock[]) {
  return [...blocks].sort((left, right) => {
    const leftDate = left.createdAt ?? "";
    const rightDate = right.createdAt ?? "";
    return new Date(rightDate).getTime() - new Date(leftDate).getTime();
  });
}

function errorMessageFromUnknown(error: unknown): string {
  return error instanceof Error ? error.message : "Unable to load blocks.";
}

export function useBlocks() {
  const { user } = useAuth();
  const mountedRef = useRef(false);
  const [filters, setFilters] = useState<BlockFiltersState>(DEFAULT_FILTERS);
  const [blocks, setBlocks] = useState<UserBlock[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);

    try {
      const response = await getBlocks({
        ...(filters.targetUserId.trim()
          ? { targetUserId: filters.targetUserId.trim() }
          : {}),
        limit: 50,
      });
      const list = unwrapList<UserBlock>(response);
      const normalized = sortBlocks(list.items);

      if (!mountedRef.current) return;
      setBlocks(normalized);
      setTotal(list.total ?? normalized.length);
    } catch (nextError) {
      if (!mountedRef.current) return;
      setError(errorMessageFromUnknown(nextError));
      setBlocks([]);
      setTotal(0);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [filters.targetUserId]);

  useEffect(() => {
    mountedRef.current = true;
    void Promise.resolve().then(refresh);
    return () => {
      mountedRef.current = false;
    };
  }, [refresh]);

  const create = useCallback(
    async (values: BlockFormValues) => {
      const targetUserId = values.targetUserId.trim();
      if (user?.id && targetUserId === user.id) {
        throw new Error("You cannot block your own user account.");
      }

      setIsMutating(true);
      setError(null);
      try {
        const response = await createBlock(payloadFromValues(values));
        await refresh();
        return unwrapItem<UserBlock>(response);
      } catch (nextError) {
        const message =
          isApiError(nextError) && nextError.isValidationError()
            ? nextError.message
            : errorMessageFromUnknown(nextError);
        setError(message);
        throw nextError;
      } finally {
        if (mountedRef.current) setIsMutating(false);
      }
    },
    [refresh, user],
  );

  const remove = useCallback(
    async (blockId: string) => {
      setIsMutating(true);
      setError(null);
      try {
        const response = await deleteBlock(blockId);
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

  return {
    blocks,
    total,
    filters,
    setFilters,
    isLoading,
    isRefreshing,
    isMutating,
    error,
    refresh,
    create,
    remove,
  };
}
