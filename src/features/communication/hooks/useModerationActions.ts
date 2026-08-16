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
  Message,
  MessageStatus,
} from "@/features/communication/types/message.types";
import type {
  ModerationAction,
  ModerationActionType,
} from "@/features/communication/types/safety.types";
import { useCommunicationSocket } from "./useCommunicationSocket";

const isRecord = (value: unknown): value is CommunicationRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const stringValue = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value : undefined;

function messageStatus(value: unknown): MessageStatus {
  if (value === "hidden" || value === "deleted") return value;
  return "sent";
}

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

function messageFromPayload(payload: unknown): Message | null {
  if (!isRecord(payload)) return null;
  const source = [payload.message, payload.data, payload.payload].find(isRecord) ??
    payload;
  if (!isRecord(source)) return null;

  const id = stringValue(source.id);
  if (!id) return null;

  return {
    ...(source as Message),
    id,
    conversationId:
      stringValue(source.conversationId) ?? stringValue(payload.conversationId),
    body:
      stringValue(source.body) ??
      stringValue(source.content) ??
      stringValue(source.text) ??
      "",
    status: messageStatus(source.status),
    createdAt: stringValue(source.createdAt),
    updatedAt: stringValue(source.updatedAt),
    deletedAt: stringValue(source.deletedAt) ?? null,
    senderId: stringValue(source.senderId) ?? stringValue(source.userId),
    sender: isRecord(source.sender) ? (source.sender as Message["sender"]) : undefined,
  };
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
  }, [messageId]);

  const runAction = useCallback(
    async (action: ModerationActionType, reason?: string) => {
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

    const patchMessage = (payload: unknown) => {
      const nextMessage = messageFromPayload(payload);
      if (!nextMessage || nextMessage.id !== message?.id) return;
      setMessage((current) => ({
        ...(current ?? nextMessage),
        ...nextMessage,
      }));
    };

    const deleteMessage = (payload: unknown) => {
      const nextMessage = messageFromPayload(payload);
      if (!nextMessage || nextMessage.id !== message?.id) return;
      setMessage((current) => ({
        ...(current ?? nextMessage),
        ...nextMessage,
        body: "",
        status: "deleted",
        deletedAt: nextMessage.deletedAt ?? new Date().toISOString(),
      }));
    };

    socket.on(COMMUNICATION_SOCKET_EVENTS.messageUpdated, patchMessage);
    socket.on(COMMUNICATION_SOCKET_EVENTS.messageDeleted, deleteMessage);
    return () => {
      socket.off(COMMUNICATION_SOCKET_EVENTS.messageUpdated, patchMessage);
      socket.off(COMMUNICATION_SOCKET_EVENTS.messageDeleted, deleteMessage);
    };
  }, [message?.id, socket]);

  return {
    messageId,
    setMessageId,
    message,
    actions,
    isLoading,
    isMutating,
    error,
    load,
    runAction,
  };
}
