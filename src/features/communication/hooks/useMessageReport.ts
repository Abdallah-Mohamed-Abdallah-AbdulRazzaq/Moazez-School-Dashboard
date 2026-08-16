"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getMessage,
  getMessageReport,
  updateMessageReport,
} from "@/features/communication/api/communication.service";
import { COMMUNICATION_SOCKET_EVENTS } from "@/features/communication/realtime/communication-events";
import type { CommunicationRecord } from "@/features/communication/types/communication.types";
import type {
  Message,
  MessageStatus,
} from "@/features/communication/types/message.types";
import type {
  MessageReport,
  MessageReportStatus,
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

function errorMessageFromUnknown(error: unknown): string {
  return error instanceof Error ? error.message : "Unable to load report.";
}

export function useMessageReport(reportId: string) {
  const { socket } = useCommunicationSocket();
  const mountedRef = useRef(false);
  const [report, setReport] = useState<MessageReport | null>(null);
  const [message, setMessage] = useState<Message | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshReport = useCallback(async () => {
    const response = await getMessageReport(reportId);
    const nextReport = unwrapItem<MessageReport>(response);
    if (!mountedRef.current) return;
    setReport(nextReport);
    return nextReport;
  }, [reportId]);

  const refreshMessage = useCallback(async (messageId?: string) => {
    if (!messageId) {
      if (mountedRef.current) setMessage(null);
      return;
    }

    try {
      const response = await getMessage(messageId);
      const nextMessage = unwrapItem<Message>(response);
      if (mountedRef.current) setMessage(nextMessage);
    } catch {
      if (mountedRef.current) setMessage(null);
    }
  }, []);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);

    try {
      const nextReport = await refreshReport();
      await refreshMessage(nextReport?.messageId);
    } catch (nextError) {
      if (mountedRef.current) setError(errorMessageFromUnknown(nextError));
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [refreshMessage, refreshReport]);

  useEffect(() => {
    mountedRef.current = true;
    void Promise.resolve().then(() => setIsLoading(true));
    void Promise.resolve().then(refresh);

    return () => {
      mountedRef.current = false;
    };
  }, [refresh]);

  useEffect(() => {
    if (!socket) return;

    const patchMessage = (payload: unknown) => {
      const nextMessage = messageFromPayload(payload);
      if (!nextMessage || nextMessage.id !== report?.messageId) return;
      setMessage((current) => ({
        ...(current ?? nextMessage),
        ...nextMessage,
      }));
    };

    const deleteMessage = (payload: unknown) => {
      const nextMessage = messageFromPayload(payload);
      if (!nextMessage || nextMessage.id !== report?.messageId) return;
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
  }, [report?.messageId, socket]);

  const updateStatus = useCallback(
    async (status: MessageReportStatus, resolutionNote?: string) => {
      setIsMutating(true);
      setError(null);

      try {
        const response = await updateMessageReport(reportId, {
          status,
          ...(resolutionNote?.trim()
            ? { resolutionNote: resolutionNote.trim() }
            : {}),
        });
        const nextReport = unwrapItem<MessageReport>(response);
        if (mountedRef.current && nextReport) setReport(nextReport);
        await refresh();
        return nextReport;
      } catch (nextError) {
        setError(errorMessageFromUnknown(nextError));
        throw nextError;
      } finally {
        if (mountedRef.current) setIsMutating(false);
      }
    },
    [refresh, reportId],
  );

  return {
    report,
    message,
    isLoading,
    isRefreshing,
    isMutating,
    error,
    refresh,
    refreshMessage,
    updateStatus,
  };
}
