"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  archiveAnnouncement,
  cancelAnnouncement,
  getAnnouncement,
  getAnnouncementReadSummary,
  markAnnouncementRead,
  publishAnnouncement,
  updateAnnouncement,
} from "@/features/communication/api/communication.service";
import { audienceFromScope } from "@/features/communication/api/communication.mappers";
import { createCommunicationMetadata } from "@/features/communication/utils/communication-metadata";
import type { CommunicationRecord } from "@/features/communication/types/communication.types";
import type {
  Announcement,
  AnnouncementReadSummary,
  UpdateAnnouncementPayload,
} from "@/features/communication/types/announcement.types";
import type { AnnouncementFormValues } from "./useAnnouncements";

const isRecord = (value: unknown): value is CommunicationRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

function unwrapItem<T>(response: unknown): T | null {
  if (!isRecord(response)) return (response ?? null) as T | null;

  const item = [response.data, response.item, response.result, response.payload].find(
    (candidate) => isRecord(candidate) && !Array.isArray(candidate),
  );

  return (item ?? response) as T;
}

function payloadFromValues(
  values: AnnouncementFormValues,
): UpdateAnnouncementPayload {
  const audience = audienceFromScope(values.audienceType, values.audienceId?.trim());
  const title = values.title?.trim();
  const body = values.body?.trim();
  const metadata = createCommunicationMetadata("announcement_update", {
    updatedFrom: "announcement_editor",
  });

  return {
    ...(title ? { title } : {}),
    ...(body ? { body } : {}),
    ...(values.priority ? { priority: values.priority } : {}),
    ...(values.audienceType ? { audienceType: values.audienceType } : {}),
    ...(audience ? { audiences: [audience] } : {}),
    ...(values.scheduledAt
      ? { scheduledAt: new Date(values.scheduledAt).toISOString() }
      : {}),
    ...(values.expiresAt
      ? { expiresAt: new Date(values.expiresAt).toISOString() }
      : {}),
    ...(metadata ? { metadata } : {}),
  };
}

export function useAnnouncement(announcementId: string) {
  const mountedRef = useRef(false);
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [readSummary, setReadSummary] =
    useState<AnnouncementReadSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const refreshAnnouncement = useCallback(async () => {
    const response = await getAnnouncement(announcementId);
    const item = unwrapItem<Announcement>(response);
    if (mountedRef.current) setAnnouncement(item);
  }, [announcementId]);

  const refreshReadSummary = useCallback(async () => {
    try {
      const response = await getAnnouncementReadSummary(announcementId);
      const item = unwrapItem<AnnouncementReadSummary>(response);
      if (mountedRef.current) setReadSummary(item);
    } catch {
      if (mountedRef.current) setReadSummary(null);
    }
  }, [announcementId]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);

    try {
      await Promise.all([refreshAnnouncement(), refreshReadSummary()]);
    } catch (nextError) {
      if (mountedRef.current) setError(nextError);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [refreshAnnouncement, refreshReadSummary]);

  useEffect(() => {
    mountedRef.current = true;
    void Promise.resolve().then(() => setIsLoading(true));
    void Promise.resolve().then(refresh);

    return () => {
      mountedRef.current = false;
    };
  }, [refresh]);

  useEffect(() => {
    void markAnnouncementRead(announcementId).catch(() => undefined);
  }, [announcementId]);

  const mutate = useCallback(
    async (operation: () => Promise<unknown>) => {
      setIsMutating(true);
      setError(null);

      try {
        const response = await operation();
        await refresh();
        return response;
      } catch (nextError) {
        setError(nextError);
        throw nextError;
      } finally {
        if (mountedRef.current) setIsMutating(false);
      }
    },
    [refresh],
  );

  const update = useCallback(
    async (values: AnnouncementFormValues) => {
      const response = await mutate(() =>
        updateAnnouncement(announcementId, payloadFromValues(values)),
      );
      return unwrapItem<Announcement>(response);
    },
    [announcementId, mutate],
  );

  const publish = useCallback(
    () => mutate(() => publishAnnouncement(announcementId)),
    [announcementId, mutate],
  );

  const archive = useCallback(
    () => mutate(() => archiveAnnouncement(announcementId)),
    [announcementId, mutate],
  );

  const cancel = useCallback(
    () => mutate(() => cancelAnnouncement(announcementId)),
    [announcementId, mutate],
  );

  return {
    announcement,
    readSummary,
    isLoading,
    isRefreshing,
    isMutating,
    error,
    refresh,
    update,
    publish,
    archive,
    cancel,
  };
}
