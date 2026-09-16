"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createModerationAction,
  getMessage,
  getModerationActions,
} from "@/features/communication/api/communication.service";
import { COMMUNICATION_SOCKET_EVENTS } from "@/features/communication/realtime/communication-events";
import type { CommunicationRecord } from "@/features/communication/types/communication.types";
import type {
  Conversation,
  ConversationParticipant,
} from "@/features/communication/types/conversation.types";
import type { Message } from "@/features/communication/types/message.types";
import type {
  ModerationAction,
  SupportedModerationAction,
} from "@/features/communication/types/safety.types";
import { useCommunicationSocket } from "./useCommunicationSocket";
import { messageFromRealtimePayload } from "@/features/communication/utils/realtime-message";
import {
  loadConversationDisplayContext,
  participantForMessage,
} from "@/features/communication/utils/message-display-context";

const isRecord = (value: unknown): value is CommunicationRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

function unwrapItem<T>(response: unknown): T | null {
  if (!isRecord(response)) return (response ?? null) as T | null;
  const item = [response.data, response.item, response.result, response.payload].find(
    (candidate) => isRecord(candidate) && !Array.isArray(candidate),
  );
  return (item ?? response) as T;
}

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

  const arraySource = [
    response.data,
    response.result,
    response.payload,
  ].find(Array.isArray);
  return arraySource ? (arraySource as T[]) : [];
}

function sortActions(actions: ModerationAction[]) {
  return [...actions].sort((left, right) => {
    const leftDate = left.createdAt ?? "";
    const rightDate = right.createdAt ?? "";
    return new Date(rightDate).getTime() - new Date(leftDate).getTime();
  });
}

function errorMessageFromUnknown(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Unable to load moderation data.";
}

type LoadOptions = {
  refreshMessage?: true;
};

export function useModerationActions() {
  const { socket } = useCommunicationSocket();
  const mountedRef = useRef(false);
  const [messageId, setMessageId] = useState("");
  const [message, setMessage] = useState<Message | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [participants, setParticipants] = useState<ConversationParticipant[]>([]);
  const [actions, setActions] = useState<ModerationAction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const senderParticipant = useMemo(
    () => (message ? participantForMessage(message, participants) : null),
    [message, participants],
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const selectMessage = useCallback((nextMessage: Message | null) => {
    setMessage(nextMessage);
    setActions([]);
  }, []);

  const load = useCallback(async (nextMessageId = messageId, options?: LoadOptions) => {
    const trimmed = nextMessageId.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setError(null);

    try {
      const [actionsResponse, messageResponse] = await Promise.all([
        getModerationActions(trimmed),
        options?.refreshMessage || message?.id !== trimmed
          ? getMessage(trimmed)
          : undefined,
      ]);
      const nextMessage = messageResponse
        ? unwrapItem<Message>(messageResponse)
        : message;
      const nextActions = sortActions(
        unwrapList<ModerationAction>(actionsResponse),
      );

      if (!mountedRef.current) return;
      setMessageId(trimmed);
      setMessage(nextMessage);
      setActions(nextActions);
    } catch (nextError) {
      if (!mountedRef.current) return;
      setError(errorMessageFromUnknown(nextError));
      setMessage(null);
      setActions([]);
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [message, messageId]);

  const loadConversation = useCallback(async (conversationId: string) => {
    if (!conversationId) {
      setConversation(null);
      setParticipants([]);
      setMessage(null);
      setActions([]);
      return;
    }

    setError(null);
    setMessage(null);
    setActions([]);
    try {
      const context = await loadConversationDisplayContext(conversationId);
      if (!mountedRef.current) return;
      setConversation(context.conversation);
      setParticipants(context.participants);
    } catch (nextError) {
      if (!mountedRef.current) return;
      setError(errorMessageFromUnknown(nextError));
      setConversation(null);
      setParticipants([]);
    }
  }, []);

  const runAction = useCallback(
    async (action: SupportedModerationAction, reason?: string) => {
      if (!message?.id) return;
      setIsMutating(true);
      setError(null);

      try {
        await createModerationAction(message.id, {
          action,
          ...(reason?.trim() ? { reason: reason.trim() } : {}),
        });
        await load(message.id, { refreshMessage: true });
      } catch (nextError) {
        setError(errorMessageFromUnknown(nextError));
        throw nextError;
      } finally {
        if (mountedRef.current) setIsMutating(false);
      }
    },
    [load, message],
  );

  useEffect(() => {
    if (!socket) return;

    const reconcileMessage = (payload: unknown) => {
      const nextMessage = messageFromRealtimePayload(payload);
      if (!nextMessage || nextMessage.id !== message?.id) return;
      setMessage((current) => ({
        ...(current ?? nextMessage),
        ...nextMessage,
      }));
    };

    socket.on(COMMUNICATION_SOCKET_EVENTS.messageUpdated, reconcileMessage);
    socket.on(COMMUNICATION_SOCKET_EVENTS.messageDeleted, reconcileMessage);
    return () => {
      socket.off(COMMUNICATION_SOCKET_EVENTS.messageUpdated, reconcileMessage);
      socket.off(COMMUNICATION_SOCKET_EVENTS.messageDeleted, reconcileMessage);
    };
  }, [message?.id, socket]);

  return {
    messageId,
    setMessageId,
    selectMessage,
    message,
    conversation,
    senderParticipant,
    actions,
    isLoading,
    isMutating,
    error,
    loadConversation,
    load,
    runAction,
  };
}
