"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getSchoolSupportConversation,
  getSchoolSupportMessages,
  markSchoolSupportRead,
  sendSchoolSupportMessage,
  type SchoolSupportConversationSummary,
  type SchoolSupportMessage,
} from "@/features/support/api/schoolSupport.service";
import type {
  ConversationMessage,
  LocalMessageDeliveryStatus,
} from "@/features/communication/hooks/useConversationMessages";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/usePermissions";
import { isApiError } from "@/lib/api-error";

const PAGE_SIZE = 50;
const SUPPORT_CHAT_POLL_INTERVAL_MS = 5_000;
const SUPPORT_SENDER_ID = "moazez-support";
const SYSTEM_SENDER_ID = "support-system";

function createClientMessageId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `support-client-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function senderIdForMessage(message: SchoolSupportMessage, currentUserId?: string) {
  if (message.isMine && currentUserId) return currentUserId;
  if (message.sender.kind === "support") return SUPPORT_SENDER_ID;
  if (message.sender.kind === "system") return SYSTEM_SENDER_ID;
  return "school-support-user";
}

function toConversationMessage(
  message: SchoolSupportMessage,
  currentUserId?: string,
  deliveryStatus: LocalMessageDeliveryStatus = "sent",
): ConversationMessage {
  const senderId = senderIdForMessage(message, currentUserId);

  return {
    id: message.id,
    conversationId: message.conversationId,
    senderId,
    sender: {
      id: senderId,
      userId: senderId,
      name: message.sender.displayName,
      userType: message.sender.kind,
    },
    body: message.body ?? "",
    type: message.sender.kind === "system" ? "system" : "text",
    status: message.body === null ? "hidden" : "sent",
    createdAt: message.sentAt,
    deliveryStatus,
  };
}

function sortMessages(messages: ConversationMessage[]) {
  return [...messages].sort(
    (left, right) =>
      new Date(left.createdAt ?? "").getTime() -
      new Date(right.createdAt ?? "").getTime(),
  );
}

function upsertMessage(
  messages: ConversationMessage[],
  incoming: ConversationMessage,
) {
  const next = [...messages];
  const index = next.findIndex(
    (message) =>
      message.id === incoming.id ||
      (incoming.clientMessageId &&
        message.clientMessageId === incoming.clientMessageId),
  );

  if (index >= 0) {
    next[index] = { ...next[index], ...incoming };
  } else {
    next.push(incoming);
  }

  return sortMessages(next);
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unable to load support chat.";
}

function isSchoolSupportMessage(value: unknown): value is SchoolSupportMessage {
  return (
    value !== null &&
    typeof value === "object" &&
    "id" in value &&
    "conversationId" in value &&
    "sender" in value &&
    "sentAt" in value
  );
}

function unwrapSentMessage(
  response: SchoolSupportMessage | { message?: SchoolSupportMessage },
): SchoolSupportMessage | null {
  if (isSchoolSupportMessage(response)) {
    return response;
  }

  if ("message" in response && isSchoolSupportMessage(response.message)) {
    return response.message ?? null;
  }

  return null;
}

export function useSchoolSupportChat() {
  const { user } = useAuth();
  const { hasPermission, isPermissionsReady } = usePermissions();
  const currentUserId = user?.id;
  const canSend =
    isPermissionsReady && hasPermission("school.support.send");
  const mountedRef = useRef(false);
  const messagesRef = useRef<ConversationMessage[]>([]);
  const refreshRequestRef = useRef<{
    key: string;
    request: Promise<void>;
  } | null>(null);
  const [conversation, setConversation] =
    useState<SchoolSupportConversationSummary | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPollingForbidden, setIsPollingForbidden] = useState(false);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const currentUserName = useMemo(() => {
    if (!user) return "You";
    return [user.firstName, user.lastName].filter(Boolean).join(" ") || "You";
  }, [user]);

  const refresh = useCallback(async (options?: { silent?: boolean }) => {
    const requestKey = currentUserId ?? "anonymous";
    if (refreshRequestRef.current?.key === requestKey) {
      return refreshRequestRef.current.request;
    }

    const shouldShowLoading = !options?.silent;
    setError(null);

    const request = (async () => {
      const [conversationResponse, messagesResponse] = await Promise.all([
        getSchoolSupportConversation(),
        getSchoolSupportMessages({ page: 1, limit: PAGE_SIZE }),
      ]);

      if (!mountedRef.current) return;

      setConversation(conversationResponse.conversation);
      const nextMessages = messagesResponse.items.map((message) =>
        toConversationMessage(message, currentUserId),
      );
      setMessages(sortMessages(nextMessages));
      setHasOlderMessages(nextMessages.length >= PAGE_SIZE);
      void markSchoolSupportRead().catch((nextError) => {
        if (
          mountedRef.current &&
          options?.silent &&
          isApiError(nextError) &&
          nextError.status === 403
        ) {
          setIsPollingForbidden(true);
        }
      });
    })();

    refreshRequestRef.current = { key: requestKey, request };

    try {
      await request;
    } catch (nextError) {
      if (!mountedRef.current) return;
      if (
        options?.silent &&
        isApiError(nextError) &&
        nextError.status === 403
      ) {
        setIsPollingForbidden(true);
        return;
      }
      setError(errorMessage(nextError));
      if (shouldShowLoading) setMessages([]);
    } finally {
      if (refreshRequestRef.current?.request === request) {
        refreshRequestRef.current = null;
      }
      if (mountedRef.current && shouldShowLoading) setIsLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    mountedRef.current = true;
    void Promise.resolve().then(() => setIsLoading(true));
    void Promise.resolve().then(() => refresh());

    return () => {
      mountedRef.current = false;
    };
  }, [refresh]);

  useEffect(() => {
    if (isPollingForbidden) return;

    const pollSupportChat = () => {
      if (document.visibilityState === "hidden") return;
      void refresh({ silent: true });
    };

    const interval = window.setInterval(
      pollSupportChat,
      SUPPORT_CHAT_POLL_INTERVAL_MS,
    );

    return () => window.clearInterval(interval);
  }, [isPollingForbidden, refresh]);

  const loadOlderMessages = useCallback(async () => {
    if (isLoadingOlder || !hasOlderMessages) return;

    const oldestMessage = messagesRef.current[0];
    if (!oldestMessage?.createdAt) return;

    setIsLoadingOlder(true);
    try {
      const response = await getSchoolSupportMessages({
        before: oldestMessage.createdAt,
        limit: PAGE_SIZE,
      });
      const olderMessages = response.items.map((message) =>
        toConversationMessage(message, currentUserId),
      );

      if (!mountedRef.current) return;

      setHasOlderMessages(olderMessages.length >= PAGE_SIZE);
      setMessages((current) => sortMessages([...olderMessages, ...current]));
    } catch (nextError) {
      if (mountedRef.current) {
        setError(errorMessage(nextError));
      }
    } finally {
      if (mountedRef.current) setIsLoadingOlder(false);
    }
  }, [currentUserId, hasOlderMessages, isLoadingOlder]);

  const send = useCallback(
    async (body: string) => {
      const trimmed = body.trim();
      if (!canSend || !trimmed || !conversation) return undefined;

      const clientMessageId = createClientMessageId();
      const pendingMessage: ConversationMessage = {
        id: clientMessageId,
        clientMessageId,
        conversationId: conversation.id,
        senderId: currentUserId,
        sender: currentUserId
          ? {
              id: currentUserId,
              userId: currentUserId,
              name: currentUserName,
              userType: "school",
            }
          : undefined,
        body: trimmed,
        type: "text",
        status: "sent",
        deliveryStatus: "pending",
        createdAt: new Date().toISOString(),
      };

      setMessages((current) => upsertMessage(current, pendingMessage));
      setIsSending(true);

      try {
        const response = await sendSchoolSupportMessage({
          body: trimmed,
          clientMessageId,
        });
        const sentMessage = unwrapSentMessage(response);
        if (sentMessage?.id) {
          setMessages((current) =>
            upsertMessage(current, {
              ...toConversationMessage(sentMessage, currentUserId),
              clientMessageId,
              deliveryStatus: "sent",
            }),
          );
          return sentMessage.id;
        }
        return clientMessageId;
      } catch (nextError) {
        setError(errorMessage(nextError));
        setMessages((current) =>
          current.map((message) =>
            message.clientMessageId === clientMessageId
              ? { ...message, deliveryStatus: "failed" }
              : message,
          ),
        );
        throw nextError;
      } finally {
        setIsSending(false);
      }
    },
    [canSend, conversation, currentUserId, currentUserName],
  );

  const isClosed = conversation?.status === "closed";

  return {
    conversation,
    currentUserId,
    currentUserName,
    canSend,
    error,
    hasOlderMessages,
    isClosed,
    isLoading,
    isLoadingOlder,
    isSending,
    loadOlderMessages,
    messages,
    refresh,
    send,
  };
}
