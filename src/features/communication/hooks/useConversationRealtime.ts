"use client";

import { useEffect, useRef } from "react";
import { COMMUNICATION_SOCKET_EVENTS } from "@/features/communication/realtime/communication-events";
import type { CommunicationRecord } from "@/features/communication/types/communication.types";
import { useCommunicationSocket } from "./useCommunicationSocket";

interface ConversationRealtimeHandlers {
  conversationId: string;
  enabled?: boolean;
  onMessageCreated: (payload: unknown) => void;
  onMessageUpdated: (payload: unknown) => void;
  onMessageDeleted: (payload: unknown) => void;
  onMessageRead: (payload: unknown) => void;
  onReactionUpserted?: (payload: unknown) => void;
  onReactionDeleted?: (payload: unknown) => void;
  onAttachmentLinked?: (payload: unknown) => void;
  onAttachmentDeleted?: (payload: unknown) => void;
  onAnnouncementPublished?: (payload: unknown) => void;
  onTypingStarted: (payload: unknown) => void;
  onTypingStopped: (payload: unknown) => void;
  onPresenceUpdated: (payload: unknown) => void;
  onReconnect: () => void;
}

const isRecord = (value: unknown): value is CommunicationRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const stringValue = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value : undefined;

function extractConversationId(payload: unknown): string | undefined {
  if (!isRecord(payload)) return undefined;

  const nested = [
    payload.message,
    payload.data,
    payload.payload,
    payload.reaction,
    payload.attachment,
  ].find(isRecord);

  return (
    stringValue(payload.conversationId) ??
    stringValue(payload.conversation_id) ??
    (isRecord(nested)
      ? stringValue(nested.conversationId) ??
        stringValue(nested.conversation_id)
      : undefined)
  );
}

export function useConversationRealtime({
  conversationId,
  enabled = true,
  onMessageCreated,
  onMessageDeleted,
  onMessageRead,
  onMessageUpdated,
  onReactionDeleted,
  onReactionUpserted,
  onAttachmentDeleted,
  onAttachmentLinked,
  onAnnouncementPublished,
  onPresenceUpdated,
  onReconnect,
  onTypingStarted,
  onTypingStopped,
}: ConversationRealtimeHandlers) {
  const { isConnected, socket, joinConversation, leaveConversation, resyncVersion } =
    useCommunicationSocket();
  const handlersRef = useRef({
    onMessageCreated,
    onMessageDeleted,
    onMessageRead,
    onMessageUpdated,
    onReactionDeleted,
    onReactionUpserted,
    onAttachmentDeleted,
    onAttachmentLinked,
    onAnnouncementPublished,
    onPresenceUpdated,
    onReconnect,
    onTypingStarted,
    onTypingStopped,
  });

  useEffect(() => {
    handlersRef.current = {
      onMessageCreated,
      onMessageDeleted,
      onMessageRead,
      onMessageUpdated,
      onReactionDeleted,
      onReactionUpserted,
      onAttachmentDeleted,
      onAttachmentLinked,
      onAnnouncementPublished,
      onPresenceUpdated,
      onReconnect,
      onTypingStarted,
      onTypingStopped,
    };
  }, [
    onMessageCreated,
    onMessageDeleted,
    onMessageRead,
    onMessageUpdated,
    onReactionDeleted,
    onReactionUpserted,
    onAttachmentDeleted,
    onAttachmentLinked,
    onAnnouncementPublished,
    onPresenceUpdated,
    onReconnect,
    onTypingStarted,
    onTypingStopped,
  ]);

  useEffect(() => {
    if (!enabled || !isConnected) return;
    joinConversation(conversationId);
    return () => leaveConversation(conversationId);
  }, [
    conversationId,
    enabled,
    isConnected,
    joinConversation,
    leaveConversation,
  ]);

  useEffect(() => {
    if (!enabled || !socket) return;

    const isForActiveConversation = (payload: unknown) => {
      const payloadConversationId = extractConversationId(payload);
      return !payloadConversationId || payloadConversationId === conversationId;
    };

    const handleMessageCreated = (payload: unknown) => {
      if (isForActiveConversation(payload)) {
        handlersRef.current.onMessageCreated(payload);
      }
    };
    const handleMessageUpdated = (payload: unknown) => {
      if (isForActiveConversation(payload)) {
        handlersRef.current.onMessageUpdated(payload);
      }
    };
    const handleMessageDeleted = (payload: unknown) => {
      if (isForActiveConversation(payload)) {
        handlersRef.current.onMessageDeleted(payload);
      }
    };
    const handleMessageRead = (payload: unknown) => {
      if (isForActiveConversation(payload)) {
        handlersRef.current.onMessageRead(payload);
      }
    };
    const handleReactionUpserted = (payload: unknown) => {
      if (isForActiveConversation(payload)) {
        const handler = handlersRef.current.onReactionUpserted;
        if (handler) handler(payload);
        else handlersRef.current.onReconnect();
      }
    };
    const handleReactionDeleted = (payload: unknown) => {
      if (isForActiveConversation(payload)) {
        const handler = handlersRef.current.onReactionDeleted;
        if (handler) handler(payload);
        else handlersRef.current.onReconnect();
      }
    };
    const handleAttachmentLinked = (payload: unknown) => {
      if (isForActiveConversation(payload)) {
        const handler = handlersRef.current.onAttachmentLinked;
        if (handler) handler(payload);
        else handlersRef.current.onReconnect();
      }
    };
    const handleAttachmentDeleted = (payload: unknown) => {
      if (isForActiveConversation(payload)) {
        const handler = handlersRef.current.onAttachmentDeleted;
        if (handler) handler(payload);
        else handlersRef.current.onReconnect();
      }
    };
    const handleAnnouncementPublished = (payload: unknown) => {
      const handler = handlersRef.current.onAnnouncementPublished;
      if (handler) handler(payload);
    };
    const handleTypingStarted = (payload: unknown) => {
      if (isForActiveConversation(payload)) {
        handlersRef.current.onTypingStarted(payload);
      }
    };
    const handleTypingStopped = (payload: unknown) => {
      if (isForActiveConversation(payload)) {
        handlersRef.current.onTypingStopped(payload);
      }
    };
    const handlePresenceUpdated = (payload: unknown) => {
      handlersRef.current.onPresenceUpdated(payload);
    };

    socket.on(COMMUNICATION_SOCKET_EVENTS.messageCreated, handleMessageCreated);
    socket.on(COMMUNICATION_SOCKET_EVENTS.messageUpdated, handleMessageUpdated);
    socket.on(COMMUNICATION_SOCKET_EVENTS.messageDeleted, handleMessageDeleted);
    socket.on(COMMUNICATION_SOCKET_EVENTS.messageRead, handleMessageRead);
    socket.on(
      COMMUNICATION_SOCKET_EVENTS.reactionUpserted,
      handleReactionUpserted,
    );
    socket.on(COMMUNICATION_SOCKET_EVENTS.reactionDeleted, handleReactionDeleted);
    socket.on(COMMUNICATION_SOCKET_EVENTS.attachmentLinked, handleAttachmentLinked);
    socket.on(
      COMMUNICATION_SOCKET_EVENTS.attachmentDeleted,
      handleAttachmentDeleted,
    );
    socket.on(
      COMMUNICATION_SOCKET_EVENTS.announcementPublished,
      handleAnnouncementPublished,
    );
    socket.on(COMMUNICATION_SOCKET_EVENTS.typingStarted, handleTypingStarted);
    socket.on(COMMUNICATION_SOCKET_EVENTS.typingStopped, handleTypingStopped);
    socket.on(
      COMMUNICATION_SOCKET_EVENTS.presenceUserUpdated,
      handlePresenceUpdated,
    );

    return () => {
      socket.off(COMMUNICATION_SOCKET_EVENTS.messageCreated, handleMessageCreated);
      socket.off(COMMUNICATION_SOCKET_EVENTS.messageUpdated, handleMessageUpdated);
      socket.off(COMMUNICATION_SOCKET_EVENTS.messageDeleted, handleMessageDeleted);
      socket.off(COMMUNICATION_SOCKET_EVENTS.messageRead, handleMessageRead);
      socket.off(
        COMMUNICATION_SOCKET_EVENTS.reactionUpserted,
        handleReactionUpserted,
      );
      socket.off(
        COMMUNICATION_SOCKET_EVENTS.reactionDeleted,
        handleReactionDeleted,
      );
      socket.off(
        COMMUNICATION_SOCKET_EVENTS.attachmentLinked,
        handleAttachmentLinked,
      );
      socket.off(
        COMMUNICATION_SOCKET_EVENTS.attachmentDeleted,
        handleAttachmentDeleted,
      );
      socket.off(
        COMMUNICATION_SOCKET_EVENTS.announcementPublished,
        handleAnnouncementPublished,
      );
      socket.off(COMMUNICATION_SOCKET_EVENTS.typingStarted, handleTypingStarted);
      socket.off(COMMUNICATION_SOCKET_EVENTS.typingStopped, handleTypingStopped);
      socket.off(
        COMMUNICATION_SOCKET_EVENTS.presenceUserUpdated,
        handlePresenceUpdated,
      );
    };
  }, [conversationId, enabled, socket]);

  useEffect(() => {
    if (enabled && resyncVersion > 0) {
      handlersRef.current.onReconnect();
    }
  }, [enabled, resyncVersion]);
}
