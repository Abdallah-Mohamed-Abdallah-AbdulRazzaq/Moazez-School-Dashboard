"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  addParticipant,
  demoteParticipant,
  getParticipants,
  leaveConversation,
  promoteParticipant,
  removeParticipant,
  updateParticipant,
} from "@/features/communication/api/communication.service";
import { communicationErrorMessage } from "@/features/communication/utils/communication-errors";
import { createCommunicationMetadata } from "@/features/communication/utils/communication-metadata";
import type {
  CommunicationList,
  CommunicationRecord,
} from "@/features/communication/types/communication.types";
import type {
  AddParticipantPayload,
  ConversationParticipant,
  ParticipantRole,
  ParticipantRoleChangePayload,
  ParticipantStatus,
  UpdateParticipantPayload,
} from "@/features/communication/types/conversation.types";

export interface ParticipantFormValues {
  userId?: string;
  role?: ParticipantRole;
  status?: ParticipantStatus;
  mutedUntil?: string;
}

export interface ParticipantRoleChangeValues {
  targetRole?: ParticipantRole;
}

export interface UseConversationParticipantsOptions {
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
  return communicationErrorMessage(error, "Unable to load participants.");
}

function isoDateTime(value?: string): string | null | undefined {
  if (value === undefined) return undefined;
  if (!value.trim()) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function addPayloadFromValues(values: ParticipantFormValues): AddParticipantPayload {
  return {
    userId: values.userId?.trim() ?? "",
    ...(values.role ? { role: values.role } : {}),
    ...(values.status ? { status: values.status } : {}),
    ...(isoDateTime(values.mutedUntil) !== undefined
      ? { mutedUntil: isoDateTime(values.mutedUntil) }
      : {}),
    metadata: createCommunicationMetadata("conversation_update", {
      updatedFrom: "conversation_participants_panel",
      participantAction: "add",
    }),
  };
}

function updatePayloadFromValues(
  values: ParticipantFormValues,
): UpdateParticipantPayload {
  return {
    ...(values.role ? { role: values.role } : {}),
    ...(values.status ? { status: values.status } : {}),
    ...(isoDateTime(values.mutedUntil) !== undefined
      ? { mutedUntil: isoDateTime(values.mutedUntil) }
      : {}),
    metadata: createCommunicationMetadata("conversation_update", {
      updatedFrom: "conversation_participants_panel",
      participantAction: "update",
    }),
  };
}

function roleChangePayloadFromValues(
  values?: ParticipantRoleChangeValues,
): ParticipantRoleChangePayload {
  return values?.targetRole ? { targetRole: values.targetRole } : {};
}

function sortParticipants(participants: ConversationParticipant[]) {
  return [...participants].sort((left, right) => {
    const leftName =
      left.user?.displayName ||
      left.actor?.name ||
      left.actor?.nameEn ||
      left.actor?.nameAr ||
      left.userId ||
      "";
    const rightName =
      right.user?.displayName ||
      right.actor?.name ||
      right.actor?.nameEn ||
      right.actor?.nameAr ||
      right.userId ||
      "";
    return leftName.localeCompare(rightName);
  });
}

export function useConversationParticipants(
  conversationId: string,
  options: UseConversationParticipantsOptions = {},
) {
  const enabled = options.enabled ?? true;
  const mountedRef = useRef(false);
  const [participants, setParticipants] = useState<ConversationParticipant[]>([]);
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
      const response = await getParticipants(conversationId);
      const list = unwrapList<ConversationParticipant>(response);
      const nextParticipants = sortParticipants(list.items);
      if (!mountedRef.current) return;
      setParticipants(nextParticipants);
      setTotal(list.total ?? nextParticipants.length);
    } catch (nextError) {
      if (!mountedRef.current) return;
      setError(errorMessage(nextError));
      setParticipants([]);
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
        const message = errorMessage(nextError);
        if (mountedRef.current) setError(message);
        throw nextError;
      } finally {
        if (mountedRef.current) setIsMutating(false);
      }
    },
    [refresh],
  );

  const add = useCallback(
    async (values: ParticipantFormValues) => {
      const response = await mutate(() =>
        addParticipant(conversationId, addPayloadFromValues(values)),
      );
      return unwrapItem<ConversationParticipant>(response);
    },
    [conversationId, mutate],
  );

  const update = useCallback(
    async (participantId: string, values: ParticipantFormValues) => {
      const response = await mutate(() =>
        updateParticipant(
          conversationId,
          participantId,
          updatePayloadFromValues(values),
        ),
      );
      return unwrapItem<ConversationParticipant>(response);
    },
    [conversationId, mutate],
  );

  const remove = useCallback(
    (participantId: string) =>
      mutate(() => removeParticipant(conversationId, participantId)),
    [conversationId, mutate],
  );

  const leave = useCallback(
    () => mutate(() => leaveConversation(conversationId)),
    [conversationId, mutate],
  );

  const promote = useCallback(
    async (participantId: string, values?: ParticipantRoleChangeValues) => {
      const response = await mutate(() =>
        promoteParticipant(
          conversationId,
          participantId,
          roleChangePayloadFromValues(values),
        ),
      );
      return unwrapItem<ConversationParticipant>(response);
    },
    [conversationId, mutate],
  );

  const demote = useCallback(
    async (participantId: string, values?: ParticipantRoleChangeValues) => {
      const response = await mutate(() =>
        demoteParticipant(
          conversationId,
          participantId,
          roleChangePayloadFromValues(values),
        ),
      );
      return unwrapItem<ConversationParticipant>(response);
    },
    [conversationId, mutate],
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
    participants,
    total,
    isLoading,
    isRefreshing,
    isMutating,
    error,
    refresh,
    add,
    update,
    remove,
    leave,
    promote,
    demote,
  };
}
