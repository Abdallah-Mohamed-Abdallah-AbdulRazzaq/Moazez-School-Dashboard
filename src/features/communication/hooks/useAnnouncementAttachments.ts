"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  deleteAnnouncementAttachment,
  getAnnouncementAttachments,
  linkAnnouncementAttachment,
} from "@/features/communication/api/communication.service";
import { uploadFile } from "@/features/communication/api/files.service";
import type {
  CommunicationFile,
  CommunicationRecord,
} from "@/features/communication/types/communication.types";
import type { MessageAttachment } from "@/features/communication/types/message.types";

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

function fileIdFromUpload(response: unknown): string | null {
  const file = unwrapItem<CommunicationFile>(response);
  return file?.fileId ?? file?.id ?? null;
}

function mergeAttachment(
  current: MessageAttachment[],
  incoming: MessageAttachment,
) {
  return [
    ...current.filter(
      (attachment) =>
        attachment.id !== incoming.id &&
        (!incoming.fileId || attachment.fileId !== incoming.fileId),
    ),
    incoming,
  ];
}

export function useAnnouncementAttachments(
  announcementId: string,
  maxAttachmentSizeMb?: number,
) {
  const mountedRef = useRef(false);
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const response = await getAnnouncementAttachments(announcementId);
      if (!mountedRef.current) return;
      setAttachments(unwrapList<MessageAttachment>(response));
    } catch (nextError) {
      if (!mountedRef.current) return;
      setError(nextError);
      setAttachments([]);
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [announcementId]);

  useEffect(() => {
    mountedRef.current = true;
    void Promise.resolve().then(refresh);
    return () => {
      mountedRef.current = false;
    };
  }, [refresh]);

  const attachFile = useCallback(
    async (file: File) => {
      if (maxAttachmentSizeMb && file.size > maxAttachmentSizeMb * 1024 * 1024) {
        throw new Error(`File must be ${maxAttachmentSizeMb}MB or smaller.`);
      }

      setIsUploading(true);
      setError(null);
      try {
        const uploadResponse = await uploadFile(file);
        const fileId = fileIdFromUpload(uploadResponse);
        if (!fileId) throw new Error("Upload response did not include a file id.");

        const linkResponse = await linkAnnouncementAttachment(announcementId, {
          fileId,
        });
        const attachment = unwrapItem<MessageAttachment>(linkResponse);
        if (mountedRef.current && attachment) {
          setAttachments((current) => mergeAttachment(current, attachment));
        } else {
          await refresh();
        }
      } catch (nextError) {
        if (mountedRef.current) {
          setError(nextError);
        }
        throw nextError;
      } finally {
        if (mountedRef.current) setIsUploading(false);
      }
    },
    [announcementId, maxAttachmentSizeMb, refresh],
  );

  const removeAttachment = useCallback(
    async (attachmentId: string) => {
      setError(null);
      try {
        await deleteAnnouncementAttachment(announcementId, attachmentId);
        if (mountedRef.current) {
          setAttachments((current) =>
            current.filter((attachment) => attachment.id !== attachmentId),
          );
        }
      } catch (nextError) {
        if (mountedRef.current) setError(nextError);
      }
    },
    [announcementId],
  );

  return {
    attachments,
    isLoading,
    isUploading,
    error,
    refresh,
    attachFile,
    removeAttachment,
  };
}
