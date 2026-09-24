"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  deleteMyReaction,
  getReactions,
  upsertReaction,
} from "@/features/communication/api/communication.service";
import { COMMUNICATION_SOCKET_EVENTS } from "@/features/communication/realtime/communication-events";
import type { CommunicationRecord } from "@/features/communication/types/communication.types";
import type {
  MessageReaction,
  ReactionType,
} from "@/features/communication/types/message.types";
import { useCommunicationSocket } from "./useCommunicationSocket";

const isRecord = (value: unknown): value is CommunicationRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const stringValue = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value : undefined;

function unwrapList<T>(response: unknown): T[] {
  if (Array.isArray(response)) return response as T[];
  if (!isRecord(response)) return [];
  const sources = [
    response,
    response.data,
    response.result,
    response.payload,
  ].filter(isRecord);
  const itemSource = sources.find((source) => Array.isArray(source.items));
  if (itemSource) return itemSource.items as T[];
  const arraySource = [response.data, response.result, response.payload].find(
    Array.isArray,
  );
  return arraySource ? (arraySource as T[]) : [];
}

function unwrapReaction(payload: unknown): MessageReaction | null {
  if (!isRecord(payload)) return null;
  const source =
    [payload.reaction, payload.data, payload.payload].find(isRecord) ?? payload;
  if (!isRecord(source)) return null;
  const messageId =
    stringValue(source.messageId) ?? stringValue(payload.messageId);
  const type = stringValue(source.type) as ReactionType | undefined;
  if (!messageId || !type) return null;
  return {
    ...(source as MessageReaction),
    id:
      stringValue(source.id) ?? `${messageId}-${type}-${source.userId ?? "me"}`,
    messageId,
    type,
    userId: stringValue(source.userId) ?? stringValue(payload.userId),
  };
}

function mergeReaction(
  current: MessageReaction[],
  incoming: MessageReaction,
): MessageReaction[] {
  const next = current.filter((reaction) => {
    if (reaction.id === incoming.id) return false;
    if (
      reaction.messageId === incoming.messageId &&
      incoming.userId &&
      reaction.userId === incoming.userId
    ) {
      return false;
    }
    return true;
  });
  return [...next, incoming];
}

export function useMessageReactions(
  messageIds: string[],
  skipInitialFetchMessageIds: string[] = [],
) {
  const { socket } = useCommunicationSocket();
  const mountedRef = useRef(false);
  const messageIdsRef = useRef<Set<string>>(new Set(messageIds));
  const [reactionsByMessageId, setReactionsByMessageId] = useState<
    Record<string, MessageReaction[]>
  >({});

  useEffect(() => {
    messageIdsRef.current = new Set(messageIds);
  }, [messageIds]);

  const refreshMessage = useCallback(async (messageId: string) => {
    const response = await getReactions(messageId);
    const reactions = unwrapList<MessageReaction>(response).reduce<
      MessageReaction[]
    >((next, reaction) => mergeReaction(next, reaction), []);
    if (!mountedRef.current) return;
    setReactionsByMessageId((current) => ({
      ...current,
      [messageId]: reactions,
    }));
  }, []);

  const fetchedIdsRef = useRef<Set<string>>(new Set());
  const skipInitialFetchIdsRef = useRef<Set<string>>(
    new Set(skipInitialFetchMessageIds),
  );

  useEffect(() => {
    skipInitialFetchIdsRef.current = new Set(skipInitialFetchMessageIds);
  }, [skipInitialFetchMessageIds]);

  const refreshAll = useCallback(async () => {
    fetchedIdsRef.current = new Set(messageIds);
    await Promise.all(messageIds.map((messageId) => refreshMessage(messageId)));
  }, [messageIds, refreshMessage]);

  useEffect(() => {
    mountedRef.current = true;
    // Only fetch reactions for message IDs we haven't fetched yet
    const newIds = messageIds.filter((id) => {
      if (fetchedIdsRef.current.has(id)) return false;
      fetchedIdsRef.current.add(id);
      return !skipInitialFetchIdsRef.current.has(id);
    });
    if (newIds.length > 0) {
      void Promise.all(newIds.map((id) => refreshMessage(id)));
    }
    return () => {
      mountedRef.current = false;
    };
  }, [messageIds, refreshMessage]);

  const addReaction = useCallback(
    async (messageId: string, type: ReactionType) => {
      const response = await upsertReaction(messageId, type);
      const reaction = unwrapReaction(response);
      if (reaction) {
        setReactionsByMessageId((current) => ({
          ...current,
          [messageId]: mergeReaction(current[messageId] ?? [], reaction),
        }));
      } else {
        await refreshMessage(messageId);
      }
    },
    [refreshMessage],
  );

  const removeMyReaction = useCallback(
    async (messageId: string) => {
      await deleteMyReaction(messageId);
      await refreshMessage(messageId);
    },
    [refreshMessage],
  );

  useEffect(() => {
    if (!socket) return;

    const handleUpserted = (payload: unknown) => {
      const reaction = unwrapReaction(payload);
      if (
        !reaction?.messageId ||
        !messageIdsRef.current.has(reaction.messageId)
      ) {
        return;
      }
      setReactionsByMessageId((current) => ({
        ...current,
        [reaction.messageId!]: mergeReaction(
          current[reaction.messageId!] ?? [],
          reaction,
        ),
      }));
    };

    const handleDeleted = (payload: unknown) => {
      const reaction = unwrapReaction(payload);
      const messageId =
        reaction?.messageId ??
        (isRecord(payload) ? stringValue(payload.messageId) : undefined);
      const reactionId =
        reaction?.id ??
        (isRecord(payload) ? stringValue(payload.reactionId) : undefined);
      const userId =
        reaction?.userId ??
        (isRecord(payload) ? stringValue(payload.userId) : undefined);
      if (!messageId || !messageIdsRef.current.has(messageId)) return;
      setReactionsByMessageId((current) => ({
        ...current,
        [messageId]: (current[messageId] ?? []).filter((item) => {
          if (reactionId && item.id === reactionId) return false;
          if (
            userId &&
            item.messageId === messageId &&
            item.userId === userId
          ) {
            return false;
          }
          return true;
        }),
      }));
    };

    socket.on(COMMUNICATION_SOCKET_EVENTS.reactionUpserted, handleUpserted);
    socket.on(COMMUNICATION_SOCKET_EVENTS.reactionDeleted, handleDeleted);
    return () => {
      socket.off(COMMUNICATION_SOCKET_EVENTS.reactionUpserted, handleUpserted);
      socket.off(COMMUNICATION_SOCKET_EVENTS.reactionDeleted, handleDeleted);
    };
  }, [socket]);

  return {
    reactionsByMessageId,
    refreshAll,
    addReaction,
    removeMyReaction,
  };
}
