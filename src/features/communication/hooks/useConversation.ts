"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getConversation } from "@/features/communication/api/communication.service";
import type { CommunicationRecord } from "@/features/communication/types/communication.types";
import type { Conversation } from "@/features/communication/types/conversation.types";

const isRecord = (value: unknown): value is CommunicationRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

function unwrapItem<T>(response: unknown): T | null {
  if (!isRecord(response)) return (response ?? null) as T | null;
  const item = [response.data, response.item, response.result, response.payload].find(
    (candidate) => isRecord(candidate) && !Array.isArray(candidate),
  );
  return (item ?? response) as T;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unable to load conversation.";
}

export function useConversation(conversationId: string) {
  const mountedRef = useRef(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const response = await getConversation(conversationId);
      if (!mountedRef.current) return;
      setConversation(unwrapItem<Conversation>(response));
    } catch (nextError) {
      if (!mountedRef.current) return;
      setError(errorMessage(nextError));
      setConversation(null);
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    mountedRef.current = true;
    void Promise.resolve().then(() => setIsLoading(true));
    void Promise.resolve().then(refresh);
    return () => {
      mountedRef.current = false;
    };
  }, [refresh]);

  return {
    conversation,
    isLoading,
    error,
    refresh,
  };
}
