"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  approveJoinRequest,
  createJoinRequest,
  getJoinRequests,
  rejectJoinRequest,
} from "@/features/communication/api/communication.service";
import type {
  CommunicationList,
  CommunicationRecord,
} from "@/features/communication/types/communication.types";
import type {
  ConversationJoinRequest,
  CreateJoinRequestPayload,
  ReviewJoinRequestPayload,
} from "@/features/communication/types/conversation.types";
import { communicationErrorMessage } from "@/features/communication/utils/communication-errors";
import { createCommunicationMetadata } from "@/features/communication/utils/communication-metadata";

export interface CreateConversationJoinRequestValues {
  note?: string;
}

export interface ReviewConversationJoinRequestValues {
  reason?: string;
}

export interface UseConversationJoinRequestsOptions {
  enabled?: boolean;
}

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

function errorMessage(error: unknown): string {
  return communicationErrorMessage(error, "Unable to load join requests.");
}

function createPayloadFromValues(
  values?: CreateConversationJoinRequestValues,
): CreateJoinRequestPayload {
  const note = values?.note?.trim();

  return {
    ...(note ? { note } : {}),
    metadata: createCommunicationMetadata("conversation_join_request_create", {
      createdFrom: "conversation_join_requests_panel",
    }),
  };
}

function reviewPayloadFromValues(
  values?: ReviewConversationJoinRequestValues,
): ReviewJoinRequestPayload {
  const reason = values?.reason?.trim();
  return reason ? { reason } : {};
}

function sortJoinRequests(joinRequests: ConversationJoinRequest[]) {
  return [...joinRequests].sort((left, right) => {
    const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
    const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
    return rightTime - leftTime;
  });
}

export function useConversationJoinRequests(
  conversationId: string,
  options: UseConversationJoinRequestsOptions = {},
) {
  const enabled = options.enabled ?? true;
  const mountedRef = useRef(false);
  const [joinRequests, setJoinRequests] = useState<ConversationJoinRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setIsRefreshing(true);
    setError(null);
    try {
      const response = await getJoinRequests(conversationId);
      const list = unwrapList<ConversationJoinRequest>(response);
      const nextJoinRequests = sortJoinRequests(list.items);
      if (!mountedRef.current) return;
      setJoinRequests(nextJoinRequests);
      setTotal(list.total ?? nextJoinRequests.length);
    } catch (nextError) {
      if (!mountedRef.current) return;
      setError(errorMessage(nextError));
      setJoinRequests([]);
      setTotal(0);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [conversationId, enabled]);

  const mutate = useCallback(
    async (operation: () => Promise<unknown>) => {
      setIsMutating(true);
      setError(null);
      try {
        const response = await operation();
        await refresh();
        return response;
      } catch (nextError) {
        if (mountedRef.current) setError(errorMessage(nextError));
        throw nextError;
      } finally {
        if (mountedRef.current) setIsMutating(false);
      }
    },
    [refresh],
  );

  const create = useCallback(
    async (values?: CreateConversationJoinRequestValues) => {
      const response = await mutate(() =>
        createJoinRequest(conversationId, createPayloadFromValues(values)),
      );
      return unwrapItem<ConversationJoinRequest>(response);
    },
    [conversationId, mutate],
  );

  const approve = useCallback(
    async (requestId: string, values?: ReviewConversationJoinRequestValues) => {
      const payload = reviewPayloadFromValues(values);
      const response = await mutate(() =>
        approveJoinRequest(
          requestId,
          Object.keys(payload).length > 0 ? payload : undefined,
        ),
      );
      return unwrapItem<ConversationJoinRequest>(response);
    },
    [mutate],
  );

  const reject = useCallback(
    async (requestId: string, values?: ReviewConversationJoinRequestValues) => {
      const payload = reviewPayloadFromValues(values);
      const response = await mutate(() =>
        rejectJoinRequest(
          requestId,
          Object.keys(payload).length > 0 ? payload : undefined,
        ),
      );
      return unwrapItem<ConversationJoinRequest>(response);
    },
    [mutate],
  );

  useEffect(() => {
    mountedRef.current = true;
    if (enabled) {
    void Promise.resolve().then(() => setIsLoading(true));
    void Promise.resolve().then(refresh);
    } else {
      void Promise.resolve().then(() => setIsLoading(false));
    }
    return () => {
      mountedRef.current = false;
    };
  }, [enabled, refresh]);

  return {
    joinRequests,
    total,
    isLoading,
    isRefreshing,
    isMutating,
    error,
    refresh,
    create,
    approve,
    reject,
  };
}
