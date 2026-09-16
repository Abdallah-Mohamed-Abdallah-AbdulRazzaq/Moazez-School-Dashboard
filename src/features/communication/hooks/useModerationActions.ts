"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { loadMessageDisplayContext } from "@/features/communication/utils/message-display-context";

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

export function useModerationActions() {
  const { socket } = useCommunicationSocket();
  const mountedRef = useRef(false);
  const [messageId, setMessageId] = useState("");
  const [message, setMessage] = useState<Message | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [senderParticipant, setSenderParticipant] = useState<ConversationParticipant | null>(null);
  const [actions, setActions] = useState<ModerationAction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async (nextMessageId = messageId) => {
    const trimmed = nextMessageId.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setError(null);

    try {
      const [messageResponse, actionsResponse] = await Promise.all([
        getMessage(trimmed),
        getModerationActions(trimmed),
      ]);
      const nextMessage = unwrapItem<Message>(messageResponse);
      const nextActions = sortActions(
        unwrapList<ModerationAction>(actionsResponse),
      );
      const context = nextMessage
        ? await loadMessageDisplayContext(nextMessage)
        : { conversation: null, senderParticipant: null };

      if (!mountedRef.current) return;
      setMessageId(trimmed);
      setMessage(nextMessage);
      setConversation(context.conversation);
      setSenderParticipant(context.senderParticipant);
      setActions(nextActions);
    } catch (nextError) {
      if (!mountedRef.current) return;
      setError(errorMessageFromUnknown(nextError));
      setMessage(null);
      setConversation(null);
      setSenderParticipant(null);
      setActions([]);
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [messageId]);

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
        await load(message.id);
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
    message,
    conversation,
    senderParticipant,
    actions,
    isLoading,
    isMutating,
    error,
    load,
    runAction,
  };
}
