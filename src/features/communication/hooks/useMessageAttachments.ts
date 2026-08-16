"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  deleteAttachment,
  getAttachments,
  linkAttachment,
} from "@/features/communication/api/communication.service";
import { uploadFile } from "@/features/communication/api/files.service";
import { COMMUNICATION_SOCKET_EVENTS } from "@/features/communication/realtime/communication-events";
import type {
  CommunicationFile,
  CommunicationRecord,
} from "@/features/communication/types/communication.types";
import type { MessageAttachment } from "@/features/communication/types/message.types";
import { useCommunicationSocket } from "./useCommunicationSocket";

type MessageAttachmentInput =
  | string
  | {
      id?: string;
      attachments?: MessageAttachment[];
      deliveryStatus?: string;
    };

const isRecord = (value: unknown): value is CommunicationRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const stringValue = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value : undefined;

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

function unwrapAttachment(payload: unknown): MessageAttachment | null {
  if (!isRecord(payload)) return null;
  const source = [payload.attachment, payload.data, payload.payload].find(isRecord) ??
    payload;
  if (!isRecord(source)) return null;
  const messageId =
    stringValue(source.messageId) ?? stringValue(payload.messageId);
  if (!messageId) return null;
  return normalizeAttachment({
    ...(source as MessageAttachment),
    messageId,
    fileId: stringValue(source.fileId) ?? stringValue(payload.fileId),
  }, messageId);
}

function mergeAttachment(
  current: MessageAttachment[],
  incoming: MessageAttachment,
) {
  const next = current.filter((attachment) => {
    if (attachment.id === incoming.id) return false;
    if (incoming.fileId && attachment.fileId === incoming.fileId) return false;
    return true;
  });
  return [...next, incoming];
}

function normalizeAttachment(
  attachment: MessageAttachment,
  messageId: string,
): MessageAttachment | null {
  const record = attachment as Record<string, unknown>;
  const id = stringValue(attachment.id) ?? stringValue(record.attachmentId);
  if (!id) return null;

  const sizeBytes = record.sizeBytes;
  const parsedSize =
    typeof sizeBytes === "string" ? Number.parseInt(sizeBytes, 10) : undefined;

  return {
    ...attachment,
    id,
    messageId: stringValue(attachment.messageId) ?? messageId,
    fileId: stringValue(attachment.fileId),
    name:
      stringValue(attachment.name) ??
      stringValue(record.displayName) ??
      stringValue(record.fileName),
    size:
      typeof attachment.size === "number"
        ? attachment.size
        : Number.isFinite(parsedSize)
          ? parsedSize
          : undefined,
    url: stringValue(attachment.url) ?? stringValue(record.downloadPath),
  };
}

function fileIdFromUpload(response: unknown): string | null {
  const file = unwrapItem<CommunicationFile>(response);
  return file?.fileId ?? file?.id ?? null;
}

export function useMessageAttachments(
  messageInputs: MessageAttachmentInput[],
  maxAttachmentSizeMb?: number,
) {
  const { socket } = useCommunicationSocket();
  const mountedRef = useRef(false);
  const messageIds = useMemo(
    () =>
      messageInputs
        .map((message) => (typeof message === "string" ? message : message.id))
        .filter((id): id is string => Boolean(id)),
    [messageInputs],
  );
  const messageIdsRef = useRef<Set<string>>(new Set(messageIds));
  const fetchedIdsRef = useRef<Set<string>>(new Set());
  const [attachmentsByMessageId, setAttachmentsByMessageId] = useState<
    Record<string, MessageAttachment[]>
  >({});
  const [uploadingMessageId, setUploadingMessageId] = useState<string | null>(null);

  useEffect(() => {
    const nextMessageIds = new Set(messageIds);
    messageIdsRef.current = nextMessageIds;
    fetchedIdsRef.current.forEach((messageId) => {
      if (!nextMessageIds.has(messageId)) {
        fetchedIdsRef.current.delete(messageId);
      }
    });
    void Promise.resolve().then(() => {
      setAttachmentsByMessageId((current) => {
        const next = Object.fromEntries(
          Object.entries(current).filter(([messageId]) =>
            nextMessageIds.has(messageId),
          ),
        );
        return Object.keys(next).length === Object.keys(current).length
          ? current
          : next;
      });
    });
  }, [messageIds]);

  useEffect(() => {
    const inlineAttachmentsByMessageId: Record<string, MessageAttachment[]> = {};

    messageInputs.forEach((message) => {
      if (typeof message === "string") return;
      const messageId = message.id;
      if (!messageId) return;
      if (!Array.isArray(message.attachments)) {
        return;
      }

      fetchedIdsRef.current.add(messageId);

      const attachments = message.attachments.reduce<MessageAttachment[]>(
        (next, attachment) => {
          const normalized = normalizeAttachment(attachment, messageId);
          return normalized ? mergeAttachment(next, normalized) : next;
        },
        [],
      );

      if (attachments.length > 0) {
        inlineAttachmentsByMessageId[messageId] = attachments;
      }
    });

    if (Object.keys(inlineAttachmentsByMessageId).length === 0) return;

    setAttachmentsByMessageId((current) => {
      const next = { ...current };
      Object.entries(inlineAttachmentsByMessageId).forEach(
        ([messageId, attachments]) => {
          next[messageId] = attachments.reduce<MessageAttachment[]>(
            (merged, attachment) => mergeAttachment(merged, attachment),
            next[messageId] ?? [],
          );
        },
      );
      return next;
    });
  }, [messageInputs]);

  const refreshMessage = useCallback(async (messageId: string) => {
    const response = await getAttachments(messageId);
    const attachments = unwrapList<MessageAttachment>(response).reduce<
      MessageAttachment[]
    >((next, attachment) => mergeAttachment(next, attachment), []);
    if (!mountedRef.current) return;
    setAttachmentsByMessageId((current) => {
      // Merge with existing attachments (don't overwrite optimistic updates)
      const existing = current[messageId] ?? [];
      if (attachments.length === 0 && existing.length > 0) return current;
      const merged = attachments.reduce<MessageAttachment[]>(
        (acc, att) => mergeAttachment(acc, att),
        existing,
      );
      return { ...current, [messageId]: merged };
    });
  }, []);

  const refreshAll = useCallback(async () => {
    fetchedIdsRef.current = new Set(messageIds);
    await Promise.all(messageIds.map((messageId) => refreshMessage(messageId)));
  }, [messageIds, refreshMessage]);

  useEffect(() => {
    mountedRef.current = true;
    // Only fetch attachments for message IDs we haven't fetched yet
    const newIds = messageIds.filter((id) => !fetchedIdsRef.current.has(id));
    if (newIds.length > 0) {
      newIds.forEach((id) => fetchedIdsRef.current.add(id));
      void Promise.all(newIds.map((id) => refreshMessage(id)));
    }
    return () => {
      mountedRef.current = false;
    };
  }, [messageIds, refreshMessage]);

  const attachFile = useCallback(
    async (messageId: string, file: File) => {
      if (maxAttachmentSizeMb && file.size > maxAttachmentSizeMb * 1024 * 1024) {
        throw new Error(`File must be ${maxAttachmentSizeMb}MB or smaller.`);
      }

      setUploadingMessageId(messageId);
      try {
        const uploadResponse = await uploadFile(file);
        const fileId = fileIdFromUpload(uploadResponse);
        if (!fileId) throw new Error("Upload response did not include a file id.");
        const linkResponse = await linkAttachment(messageId, { fileId });
        const attachment = unwrapAttachment(linkResponse);
        if (attachment) {
          setAttachmentsByMessageId((current) => ({
            ...current,
            [messageId]: mergeAttachment(current[messageId] ?? [], attachment),
          }));
        } else {
          await refreshMessage(messageId);
        }
      } finally {
        setUploadingMessageId(null);
      }
    },
    [maxAttachmentSizeMb, refreshMessage],
  );

  const removeAttachment = useCallback(
    async (messageId: string, attachmentId: string) => {
      await deleteAttachment(messageId, attachmentId);
      setAttachmentsByMessageId((current) => ({
        ...current,
        [messageId]: (current[messageId] ?? []).filter(
          (attachment) => attachment.id !== attachmentId,
        ),
      }));
    },
    [],
  );

  useEffect(() => {
    if (!socket) return;

    const handleLinked = (payload: unknown) => {
      const attachment = unwrapAttachment(payload);
      if (!attachment?.messageId) {
        return;
      }
      setAttachmentsByMessageId((current) => ({
        ...current,
        [attachment.messageId!]: mergeAttachment(
          current[attachment.messageId!] ?? [],
          attachment,
        ),
      }));
    };

    const handleDeleted = (payload: unknown) => {
      if (!isRecord(payload)) return;
      const messageId = stringValue(payload.messageId);
      const attachmentId =
        stringValue(payload.attachmentId) ??
        (isRecord(payload.attachment) ? stringValue(payload.attachment.id) : undefined);
      const fileId =
        stringValue(payload.fileId) ??
        (isRecord(payload.attachment)
          ? stringValue(payload.attachment.fileId)
          : undefined);
      if (!messageId) return;
      setAttachmentsByMessageId((current) => ({
        ...current,
        [messageId]: (current[messageId] ?? []).filter(
          (attachment) =>
            !(
              (attachmentId && attachment.id === attachmentId) ||
              (fileId && attachment.fileId === fileId)
            ),
        ),
      }));
    };

    socket.on(COMMUNICATION_SOCKET_EVENTS.attachmentLinked, handleLinked);
    socket.on(COMMUNICATION_SOCKET_EVENTS.attachmentDeleted, handleDeleted);
    return () => {
      socket.off(COMMUNICATION_SOCKET_EVENTS.attachmentLinked, handleLinked);
      socket.off(COMMUNICATION_SOCKET_EVENTS.attachmentDeleted, handleDeleted);
    };
  }, [socket]);

  return {
    attachmentsByMessageId,
    uploadingMessageId,
    refreshAll,
    attachFile,
    removeAttachment,
  };
}
