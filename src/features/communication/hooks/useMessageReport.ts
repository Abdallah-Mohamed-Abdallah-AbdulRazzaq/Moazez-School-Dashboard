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
  Conversation,
  ConversationParticipant,
} from "@/features/communication/types/conversation.types";
import type { Message } from "@/features/communication/types/message.types";
import type {
  MessageReport,
  MessageReportStatus,
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

function errorMessageFromUnknown(error: unknown): string {
  return error instanceof Error ? error.message : "Unable to load report.";
}

export function useMessageReport(reportId: string) {
  const { socket } = useCommunicationSocket();
  const mountedRef = useRef(false);
  const [report, setReport] = useState<MessageReport | null>(null);
  const [message, setMessage] = useState<Message | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [participant, setParticipant] = useState<ConversationParticipant | null>(null);
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

  const refreshMessage = useCallback(
    async (messageId?: string, reportConversationId?: string) => {
      if (!messageId) {
        if (mountedRef.current) {
          setMessage(null);
          setConversation(null);
          setParticipant(null);
        }
        return;
      }

      const response = await getMessage(messageId);
      const nextMessage = unwrapItem<Message>(response);
      if (!nextMessage) {
        if (mountedRef.current) {
          setMessage(null);
          setConversation(null);
          setParticipant(null);
        }
        return;
      }

      if (mountedRef.current) setMessage(nextMessage);
      const context = await loadMessageDisplayContext(
        nextMessage,
        reportConversationId,
      );
      if (mountedRef.current) {
        setConversation(context.conversation);
        setParticipant(context.senderParticipant);
      }
    },
    [],
  );

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);

    try {
      const nextReport = await refreshReport();
      await refreshMessage(nextReport?.messageId, nextReport?.conversationId);
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

    const reconcileMessage = (payload: unknown) => {
      const nextMessage = messageFromRealtimePayload(payload);
      if (!nextMessage || nextMessage.id !== report?.messageId) return;
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
    conversation,
    senderParticipant: participant,
    isLoading,
    isRefreshing,
    isMutating,
    error,
    refresh,
    refreshMessage,
    updateStatus,
  };
}
