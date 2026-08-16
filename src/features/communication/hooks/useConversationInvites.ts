"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  acceptConversationInvite,
  createConversationInvite,
  getConversationInvites,
  rejectConversationInvite,
} from "@/features/communication/api/communication.service";
import type {
  CommunicationList,
  CommunicationRecord,
} from "@/features/communication/types/communication.types";
import type {
  ConversationInvite,
  CreateConversationInvitePayload,
  RejectConversationInvitePayload,
} from "@/features/communication/types/conversation.types";
import { communicationErrorMessage } from "@/features/communication/utils/communication-errors";
import { createCommunicationMetadata } from "@/features/communication/utils/communication-metadata";

export interface CreateConversationInviteValues {
  invitedUserId: string;
  expiresAt?: string;
}

export interface RejectConversationInviteValues {
  reason?: string;
}

export interface UseConversationInvitesOptions {
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
  return communicationErrorMessage(error, "Unable to load invites.");
}

function isoDateTime(value?: string): string | null | undefined {
  if (value === undefined) return undefined;
  if (!value.trim()) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function createPayloadFromValues(
  values: CreateConversationInviteValues,
): CreateConversationInvitePayload {
  const expiresAt = isoDateTime(values.expiresAt);

  return {
    invitedUserId: values.invitedUserId.trim(),
    ...(expiresAt !== undefined ? { expiresAt } : {}),
    metadata: createCommunicationMetadata("conversation_invite_create", {
      createdFrom: "conversation_invites_panel",
    }),
  };
}

function rejectPayloadFromValues(
  values?: RejectConversationInviteValues,
): RejectConversationInvitePayload {
  const reason = values?.reason?.trim();
  return reason ? { reason } : {};
}

function sortInvites(invites: ConversationInvite[]) {
  return [...invites].sort((left, right) => {
    const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
    const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
    return rightTime - leftTime;
  });
}

export function useConversationInvites(
  conversationId: string,
  options: UseConversationInvitesOptions = {},
) {
  const enabled = options.enabled ?? true;
  const mountedRef = useRef(false);
  const [invites, setInvites] = useState<ConversationInvite[]>([]);
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
      const response = await getConversationInvites(conversationId);
      const list = unwrapList<ConversationInvite>(response);
      const nextInvites = sortInvites(list.items);
      if (!mountedRef.current) return;
      setInvites(nextInvites);
      setTotal(list.total ?? nextInvites.length);
    } catch (nextError) {
      if (!mountedRef.current) return;
      setError(errorMessage(nextError));
      setInvites([]);
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
    async (values: CreateConversationInviteValues) => {
      const response = await mutate(() =>
        createConversationInvite(conversationId, createPayloadFromValues(values)),
      );
      return unwrapItem<ConversationInvite>(response);
    },
    [conversationId, mutate],
  );

  const accept = useCallback(
    async (inviteId: string) => {
      const response = await mutate(() => acceptConversationInvite(inviteId));
      return unwrapItem<ConversationInvite>(response);
    },
    [mutate],
  );

  const reject = useCallback(
    async (inviteId: string, values?: RejectConversationInviteValues) => {
      const payload = rejectPayloadFromValues(values);
      const response = await mutate(() =>
        rejectConversationInvite(
          inviteId,
          Object.keys(payload).length > 0 ? payload : undefined,
        ),
      );
      return unwrapItem<ConversationInvite>(response);
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
    invites,
    total,
    isLoading,
    isRefreshing,
    isMutating,
    error,
    refresh,
    create,
    accept,
    reject,
  };
}
