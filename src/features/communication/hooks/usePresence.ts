"use client";

import { useCallback, useMemo, useState } from "react";
import type { CommunicationRecord } from "@/features/communication/types/communication.types";

export interface CommunicationPresence {
  userId: string;
  status?: string;
  isOnline?: boolean;
}

const isRecord = (value: unknown): value is CommunicationRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const stringValue = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value : undefined;

function presenceOnlineState(
  source: CommunicationRecord,
  payload: CommunicationRecord,
  status?: string,
): boolean | undefined {
  const explicitOnline = [
    source.isOnline,
    source.online,
    payload.isOnline,
    payload.online,
  ].find((candidate): candidate is boolean => typeof candidate === "boolean");
  if (explicitOnline !== undefined) return explicitOnline;

  const normalizedStatus = status?.toLowerCase();
  return normalizedStatus === "online"
    ? true
    : normalizedStatus === "offline"
      ? false
      : undefined;
}

export function usePresence({ enabled = true }: { enabled?: boolean } = {}) {
  const [presenceByUserId, setPresenceByUserId] = useState<
    Record<string, CommunicationPresence>
  >({});

  const handlePresenceUpdated = useCallback((payload: unknown) => {
    if (!enabled || !isRecord(payload)) return;
    const source = isRecord(payload.user) ? payload.user : payload;
    const userId =
      stringValue(source.userId) ??
      stringValue(source.id) ??
      stringValue(payload.userId);
    if (!userId) return;

    const status = stringValue(source.status) ?? stringValue(payload.status);

    setPresenceByUserId((current) => ({
      ...current,
      [userId]: {
        userId,
        status,
        isOnline: presenceOnlineState(source, payload, status),
      },
    }));
  }, [enabled]);

  return useMemo(
    () => ({
      presenceByUserId: enabled ? presenceByUserId : {},
      handlePresenceUpdated,
    }),
    [enabled, handlePresenceUpdated, presenceByUserId],
  );
}
