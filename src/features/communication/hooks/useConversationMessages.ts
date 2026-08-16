"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  deleteMessage,
  getConversationReadSummary,
  getMessages,
  markMessageRead,
  sendMessage,
  updateMessage,
} from "@/features/communication/api/communication.service";
import { uploadFile } from "@/features/communication/api/files.service";
import { createCommunicationMetadata } from "@/features/communication/utils/communication-metadata";
import type {
  CommunicationFile,
  CommunicationRecord,
} from "@/features/communication/types/communication.types";
import type {
  ConversationMessageReadCount,
  ConversationReadSummary,
} from "@/features/communication/types/conversation.types";
import type {
  Message,
  MessageStatus,
  SendableMessageType,
  SendMessageAttachmentPayload,
  SendMessagePayload,
} from "@/features/communication/types/message.types";
import { useAuth } from "@/hooks/use-auth";

export type LocalMessageDeliveryStatus = "pending" | "sent" | "failed";

export interface ConversationMessage extends Message {
  clientMessageId?: string;
  deliveryStatus?: LocalMessageDeliveryStatus;
  readByUserIds?: string[];
  readCount?: number;
}

export interface SendMediaMessageInput {
  type: SendableMessageType;
  files: File[];
  caption?: string;
  replyToMessageId?: string;
}

export type ReadSummaryState = ConversationReadSummary;

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
  const item = [
    response.data,
    response.item,
    response.result,
    response.payload,
  ].find((candidate) => isRecord(candidate) && !Array.isArray(candidate));
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

  const arraySource = [response.data, response.result, response.payload].find(
    Array.isArray,
  );
  return arraySource ? (arraySource as T[]) : [];
}

function fileIdFromUpload(response: unknown): string | null {
  const file = unwrapItem<CommunicationFile>(response);
  return file?.fileId ?? file?.id ?? null;
}

function mediaKindFromFile(
  file: File,
): NonNullable<SendMessageAttachmentPayload["mediaKind"]> {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  return "file";
}

function responseMessageType(type: SendableMessageType): Message["type"] {
  return type === "voice" ? "audio" : type;
}

function mediaMessageBody(type: SendableMessageType, caption?: string): string {
  return caption || (type === "voice" ? "Voice message" : "");
}

function optimisticMediaAttachments(
  clientMessageId: string,
  files: File[],
): Message["attachments"] {
  return files.map((file, index) => ({
    id: `${clientMessageId}-attachment-${index}`,
    messageId: clientMessageId,
    name: file.name,
    mimeType: file.type,
    size: file.size,
  }));
}

async function uploadMessageAttachments(
  files: File[],
  caption?: string,
): Promise<SendMessageAttachmentPayload[]> {
  return Promise.all(
    files.map(async (file, index) => {
      const uploadResponse = await uploadFile(file);
      const fileId = fileIdFromUpload(uploadResponse);
      if (!fileId) {
        throw new Error("Upload response did not include a file id.");
      }
      return {
        fileId,
        mediaKind: mediaKindFromFile(file),
        caption,
        sortOrder: index,
      };
    }),
  );
}

function messageFromPayload(payload: unknown): ConversationMessage | null {
  if (!isRecord(payload)) return null;
  const source =
    [payload.message, payload.data, payload.payload].find(isRecord) ?? payload;
  if (!isRecord(source)) return null;

  const id =
    stringValue(source.id) ??
    stringValue(source.messageId) ??
    stringValue(payload.messageId);
  const clientMessageId = stringValue(source.clientMessageId);
  if (!id && !clientMessageId) return null;
  const body =
    stringValue(source.body) ??
    stringValue(source.content) ??
    stringValue(source.text);
  const createdAt = stringValue(source.createdAt) ?? stringValue(source.sentAt);
  const senderId =
    stringValue(source.senderId) ??
    stringValue(source.senderUserId) ??
    stringValue(source.userId);

  return {
    ...(source as Message),
    id: id ?? clientMessageId ?? `local-${Date.now()}`,
    conversationId:
      stringValue(source.conversationId) ??
      stringValue(source.conversation_id) ??
      stringValue(payload.conversationId) ??
      stringValue(payload.conversation_id),
    clientMessageId,
    ...(body !== undefined ? { body } : {}),
    status: messageStatus(source.status),
    ...(createdAt !== undefined ? { createdAt } : {}),
    updatedAt: stringValue(source.updatedAt),
    ...(senderId !== undefined ? { senderId } : {}),
    sender: isRecord(source.sender)
      ? (source.sender as Message["sender"])
      : undefined,
    readCount:
      typeof source.readCount === "number" ? source.readCount : undefined,
    deliveryStatus: "sent",
  };
}

function sortMessages(messages: ConversationMessage[]): ConversationMessage[] {
  return [...messages].sort((left, right) => {
    const leftPending = left.deliveryStatus === "pending";
    const rightPending = right.deliveryStatus === "pending";

    if (leftPending && !rightPending) return 1;
    if (!leftPending && rightPending) return -1;

    const leftTime = new Date(left.createdAt ?? "").getTime();
    const rightTime = new Date(right.createdAt ?? "").getTime();
    return leftTime - rightTime;
  });
}

function dedupeMessages(
  messages: ConversationMessage[],
): ConversationMessage[] {
  const seenIds = new Set<string>();
  const seenClientIds = new Set<string>();
  const output: ConversationMessage[] = [];

  for (const message of messages) {
    const id = stringValue(message.id);
    const clientMessageId = stringValue(message.clientMessageId);
    const duplicate =
      Boolean(id && seenIds.has(id)) ||
      Boolean(clientMessageId && seenClientIds.has(clientMessageId)) ||
      Boolean(clientMessageId && seenIds.has(clientMessageId)) ||
      Boolean(id && seenClientIds.has(id));

    if (duplicate) {
      const existingIndex = output.findIndex(
        (item) =>
          (id && item.id === id) ||
          (clientMessageId && item.clientMessageId === clientMessageId) ||
          (clientMessageId && item.id === clientMessageId) ||
          (id && item.clientMessageId === id),
      );

      if (existingIndex >= 0) {
        output[existingIndex] = {
          ...output[existingIndex],
          ...message,
          id:
            message.id && !message.id.startsWith("client-")
              ? message.id
              : output[existingIndex].id,
          clientMessageId:
            message.clientMessageId ?? output[existingIndex].clientMessageId,
        };
      }
      continue;
    }

    if (id) seenIds.add(id);
    if (clientMessageId) seenClientIds.add(clientMessageId);
    output.push(message);
  }

  return output;
}

function upsertMessage(
  messages: ConversationMessage[],
  incoming: ConversationMessage,
): ConversationMessage[] {
  const next = [...messages];
  const index = next.findIndex(
    (message) =>
      message.id === incoming.id ||
      (incoming.id && message.clientMessageId === incoming.id) ||
      (incoming.clientMessageId &&
        (message.clientMessageId === incoming.clientMessageId ||
          message.id === incoming.clientMessageId)),
  );

  if (index >= 0) {
    const definedIncoming = Object.fromEntries(
      Object.entries(incoming).filter(
        ([, fieldValue]) => fieldValue !== undefined,
      ),
    ) as Partial<ConversationMessage>;
    next[index] = {
      ...next[index],
      ...definedIncoming,
      deliveryStatus: incoming.deliveryStatus ?? next[index].deliveryStatus,
    };
  } else {
    next.push(incoming);
  }

  return sortMessages(dedupeMessages(next));
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unable to load messages.";
}

function createClientMessageId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `client-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function emptyReadSummary(conversationId: string): ReadSummaryState {
  return {
    conversationId,
    items: [],
    total: 0,
    limit: 0,
    page: 1,
  };
}

function normalizeReadSummary(
  summary: ConversationReadSummary,
  conversationId: string,
): ReadSummaryState {
  const items = readCountEntries(summary.items);
  return {
    conversationId: stringValue(summary.conversationId) ?? conversationId,
    items,
    total: typeof summary.total === "number" ? summary.total : items.length,
    limit: typeof summary.limit === "number" ? summary.limit : items.length,
    page: typeof summary.page === "number" ? summary.page : 1,
  };
}

function readCountEntries(payload: unknown): ConversationMessageReadCount[] {
  if (!Array.isArray(payload)) return [];
  return payload.flatMap((entry) => {
    if (!isRecord(entry)) return [];
    const messageId = stringValue(entry.messageId);
    const readCount =
      typeof entry.readCount === "number" ? entry.readCount : undefined;
    return messageId && readCount !== undefined
      ? [{ messageId, readCount }]
      : [];
  });
}

function applyReadCountEntry(
  current: ConversationMessageReadCount[],
  incoming: ConversationMessageReadCount,
): ConversationMessageReadCount[] {
  return [
    ...current.filter((entry) => entry.messageId !== incoming.messageId),
    incoming,
  ];
}

function applyReadCounts(
  messages: ConversationMessage[],
  readCounts: ConversationMessageReadCount[],
): ConversationMessage[] {
  if (readCounts.length === 0) return messages;
  const countByMessageId = new Map(
    readCounts.map(({ messageId, readCount }) => [messageId, readCount]),
  );
  return messages.map((message) => {
    const readCount = countByMessageId.get(message.id);
    return readCount === undefined ? message : { ...message, readCount };
  });
}

function applyReader(
  message: ConversationMessage,
  readerId: string,
  readCount: number,
): ConversationMessage {
  const readByUserIds = new Set(message.readByUserIds ?? []);
  readByUserIds.add(readerId);
  return {
    ...message,
    readByUserIds: Array.from(readByUserIds),
    readCount,
  };
}

export function useConversationMessages(conversationId: string) {
  const { user } = useAuth();
  const mountedRef = useRef(false);
  const activeConversationIdRef = useRef(conversationId);
  const messagesRef = useRef<ConversationMessage[]>([]);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [readSummary, setReadSummary] = useState<ReadSummaryState>(() =>
    emptyReadSummary(conversationId),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [hasOlderMessages, setHasOlderMessages] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep ref in sync for use in callbacks without stale closures
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const PAGE_SIZE = 30;

  const refreshMessages = useCallback(async () => {
    const requestConversationId = conversationId;
    setError(null);
    try {
      const response = await getMessages(requestConversationId, {
        limit: PAGE_SIZE,
      });
      const nextMessages = unwrapList<Message>(response).map((message) => {
        const record = message as Record<string, unknown>;
        return {
          ...message,
          senderId:
            message.senderId ??
            (typeof record.senderUserId === "string"
              ? record.senderUserId
              : undefined),
          deliveryStatus: "sent" as const,
        };
      });
      if (
        !mountedRef.current ||
        activeConversationIdRef.current !== requestConversationId
      ) {
        return;
      }
      setMessages(sortMessages(dedupeMessages(nextMessages)));
      setHasOlderMessages(nextMessages.length >= PAGE_SIZE);
    } catch (nextError) {
      if (
        !mountedRef.current ||
        activeConversationIdRef.current !== requestConversationId
      ) {
        return;
      }
      setError(errorMessage(nextError));
      setMessages([]);
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [conversationId]);

  const loadOlderMessages = useCallback(async () => {
    if (isLoadingOlder || !hasOlderMessages) return;
    const currentMessages = messagesRef.current;
    const oldestMessage = currentMessages[0];
    if (!oldestMessage?.createdAt) return;

    const requestConversationId = conversationId;
    setIsLoadingOlder(true);
    try {
      const response = await getMessages(requestConversationId, {
        before: oldestMessage.createdAt,
        limit: PAGE_SIZE,
      });
      const olderMessages = unwrapList<Message>(response).map((message) => {
        const record = message as Record<string, unknown>;
        return {
          ...message,
          senderId:
            message.senderId ??
            (typeof record.senderUserId === "string"
              ? record.senderUserId
              : undefined),
          deliveryStatus: "sent" as const,
        };
      });
      if (
        !mountedRef.current ||
        activeConversationIdRef.current !== requestConversationId
      ) {
        return;
      }
      if (olderMessages.length < PAGE_SIZE) {
        setHasOlderMessages(false);
      }
      if (olderMessages.length > 0) {
        setMessages((current) =>
          sortMessages(dedupeMessages([...olderMessages, ...current])),
        );
      }
    } catch {
      // Silently fail — user can scroll up again to retry
    } finally {
      if (mountedRef.current) setIsLoadingOlder(false);
    }
  }, [conversationId, hasOlderMessages, isLoadingOlder]);

  const refreshReadSummary = useCallback(async () => {
    const requestConversationId = conversationId;
    try {
      const response = await getConversationReadSummary(requestConversationId, {
        limit: 100,
      });
      const summary = unwrapItem<ConversationReadSummary>(response);
      if (
        mountedRef.current &&
        activeConversationIdRef.current === requestConversationId &&
        summary
      ) {
        const normalizedSummary = normalizeReadSummary(
          summary,
          requestConversationId,
        );
        setReadSummary(normalizedSummary);
        setMessages((current) =>
          applyReadCounts(current, normalizedSummary.items),
        );
      }
    } catch {
      if (
        mountedRef.current &&
        activeConversationIdRef.current === requestConversationId
      ) {
        setReadSummary(emptyReadSummary(requestConversationId));
      }
    }
  }, [conversationId]);

  const refresh = useCallback(async () => {
    await refreshMessages();
    await refreshReadSummary();
  }, [refreshMessages, refreshReadSummary]);

  useEffect(() => {
    mountedRef.current = true;
    activeConversationIdRef.current = conversationId;
    void Promise.resolve().then(() => setIsLoading(true));
    void Promise.resolve().then(() => setMessages([]));
    void Promise.resolve().then(() =>
      setReadSummary(emptyReadSummary(conversationId)),
    );
    void Promise.resolve().then(() => setHasOlderMessages(true));
    void Promise.resolve().then(refresh);
    return () => {
      mountedRef.current = false;
    };
  }, [conversationId, refresh]);

  const send = useCallback(
    async (
      body: string,
      options?: { replyToMessageId?: string },
    ): Promise<string | undefined> => {
      const trimmed = body.trim();
      if (!trimmed) return undefined;

      const clientMessageId = createClientMessageId();
      const pendingMessage: ConversationMessage = {
        id: clientMessageId,
        clientMessageId,
        conversationId,
        senderId: user?.id,
        sender: user
          ? {
              id: user.id,
              userId: user.id,
              name: `${user.firstName} ${user.lastName}`.trim(),
            }
          : undefined,
        body: trimmed,
        type: "text",
        status: "sent",
        deliveryStatus: "pending",
        createdAt: new Date().toISOString(),
        replyToMessageId: options?.replyToMessageId,
      };

      setMessages((current) => upsertMessage(current, pendingMessage));
      setIsMutating(true);

      try {
        const payload: SendMessagePayload = {
          type: "text",
          body: trimmed,
          clientMessageId,
          ...(options?.replyToMessageId
            ? { replyToMessageId: options.replyToMessageId }
            : {}),
          metadata: createCommunicationMetadata("message_send", {
            composer: "conversation_thread",
          }),
        };
        const response = await sendMessage(conversationId, payload);
        const serverMessage = messageFromPayload(response);
        if (!serverMessage) return clientMessageId;
        setMessages((current) =>
          upsertMessage(current, {
            ...serverMessage,
            clientMessageId:
              serverMessage.clientMessageId ?? pendingMessage.clientMessageId,
            deliveryStatus: "sent",
          }),
        );
        return serverMessage.id ?? clientMessageId;
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
        setIsMutating(false);
      }
    },
    [conversationId, user],
  );

  const sendMedia = useCallback(
    async ({
      type,
      files,
      caption,
      replyToMessageId,
    }: SendMediaMessageInput): Promise<string | undefined> => {
      if (files.length === 0) return undefined;

      const trimmedCaption = caption?.trim();
      const body = mediaMessageBody(type, trimmedCaption);
      const clientMessageId = createClientMessageId();
      const createdAt = new Date().toISOString();
      const pendingMessage: ConversationMessage = {
        id: clientMessageId,
        clientMessageId,
        conversationId,
        senderId: user?.id,
        sender: user
          ? {
              id: user.id,
              userId: user.id,
              name: `${user.firstName} ${user.lastName}`.trim(),
            }
          : undefined,
        body,
        type: responseMessageType(type),
        status: "sent",
        deliveryStatus: "pending",
        createdAt,
        replyToMessageId,
        attachments: optimisticMediaAttachments(clientMessageId, files),
      };

      setMessages((current) => upsertMessage(current, pendingMessage));
      setIsMutating(true);

      try {
        const attachments = await uploadMessageAttachments(
          files,
          trimmedCaption,
        );
        const payload: SendMessagePayload = {
          type,
          body,
          caption: trimmedCaption,
          clientMessageId,
          attachments,
          ...(replyToMessageId ? { replyToMessageId } : {}),
          metadata: createCommunicationMetadata("message_send", {
            composer: "conversation_thread",
          }),
        };
        const response = await sendMessage(conversationId, payload);
        const serverMessage = messageFromPayload(response);
        if (!serverMessage) return clientMessageId;
        setMessages((current) =>
          upsertMessage(current, {
            ...serverMessage,
            clientMessageId:
              serverMessage.clientMessageId ?? pendingMessage.clientMessageId,
            deliveryStatus: "sent",
          }),
        );
        return serverMessage.id ?? clientMessageId;
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
        setIsMutating(false);
      }
    },
    [conversationId, user],
  );

  const edit = useCallback(
    async (messageId: string, body: string) => {
      const trimmed = body.trim();
      if (!trimmed) return;
      setIsMutating(true);
      setMessages((current) =>
        current.map((message) =>
          message.id === messageId
            ? { ...message, body: trimmed, updatedAt: new Date().toISOString() }
            : message,
        ),
      );

      try {
        const response = await updateMessage(messageId, { body: trimmed });
        const serverMessage = messageFromPayload(response);
        if (serverMessage) {
          setMessages((current) => upsertMessage(current, serverMessage));
        }
      } catch (nextError) {
        setError(errorMessage(nextError));
        await refreshMessages();
        throw nextError;
      } finally {
        setIsMutating(false);
      }
    },
    [refreshMessages],
  );

  const remove = useCallback(
    async (messageId: string) => {
      setIsMutating(true);
      setMessages((current) =>
        current.map((message) =>
          message.id === messageId
            ? {
                ...message,
                body: undefined,
                attachments: [],
                status: "deleted",
                deletedAt: new Date().toISOString(),
              }
            : message,
        ),
      );

      try {
        await deleteMessage(messageId);
      } catch (nextError) {
        setError(errorMessage(nextError));
        await refreshMessages();
        throw nextError;
      } finally {
        setIsMutating(false);
      }
    },
    [refreshMessages],
  );

  const markRead = useCallback(async (messageId: string) => {
    await markMessageRead(messageId).catch(() => undefined);
  }, []);

  const upsertFromRealtime = useCallback(
    (payload: unknown) => {
      const message = messageFromPayload(payload);
      if (!message || message.conversationId !== conversationId) return;
      setMessages((current) => upsertMessage(current, message));
    },
    [conversationId],
  );

  const patchFromRealtime = useCallback(
    (payload: unknown) => {
      const message = messageFromPayload(payload);
      if (!message || message.conversationId !== conversationId) return;
      setMessages((current) => upsertMessage(current, message));
    },
    [conversationId],
  );

  const deleteFromRealtime = useCallback(
    (payload: unknown) => {
      const message = messageFromPayload(payload);
      if (!message || message.conversationId !== conversationId) return;
      setMessages((current) => upsertMessage(current, message));
    },
    [conversationId],
  );

  const patchReadFromRealtime = useCallback(
    (payload: unknown) => {
      if (!isRecord(payload)) return;
      const payloadConversationId = stringValue(payload.conversationId);
      if (payloadConversationId && payloadConversationId !== conversationId)
        return;

      const messageId = stringValue(payload.messageId);
      const userId =
        stringValue(payload.userId) ?? stringValue(payload.readerId);
      if (!userId) return;
      const readCount =
        typeof payload.readCount === "number" ? payload.readCount : undefined;

      if (messageId && readCount !== undefined) {
        setMessages((current) =>
          current.map((message) => {
            if (message.id !== messageId) return message;
            return applyReader(message, userId, readCount);
          }),
        );
        setReadSummary((current) => {
          const items = applyReadCountEntry(current.items, {
            messageId,
            readCount,
          });
          return {
            ...current,
            items,
            total: Math.max(current.total, items.length),
          };
        });
        return;
      }

      const messagesRead = readCountEntries(payload.messages);
      if (messagesRead.length > 0) {
        const readCountByMessageId = new Map(
          messagesRead.map((entry) => [entry.messageId, entry.readCount]),
        );
        setMessages((current) =>
          current.map((message) => {
            const nextReadCount = readCountByMessageId.get(message.id);
            return nextReadCount === undefined
              ? message
              : applyReader(message, userId, nextReadCount);
          }),
        );
        setReadSummary((current) => {
          const items = messagesRead.reduce(applyReadCountEntry, current.items);
          return {
            ...current,
            items,
            total: Math.max(current.total, items.length),
          };
        });
      }
    },
    [conversationId],
  );

  return {
    messages,
    readSummary,
    isLoading,
    isLoadingOlder,
    hasOlderMessages,
    isMutating,
    error,
    refresh,
    loadOlderMessages,
    send,
    sendMedia,
    edit,
    remove,
    markRead,
    upsertFromRealtime,
    patchFromRealtime,
    deleteFromRealtime,
    patchReadFromRealtime,
  };
}
