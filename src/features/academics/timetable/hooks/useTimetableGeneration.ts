"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TimetableGenerationResponse } from "@/features/academics/timetable/services/timetableApiTypes";

interface UseTimetableGenerationParams {
  configId: string | null;
  enabled: boolean;
  generate: (configId: string) => Promise<TimetableGenerationResponse>;
  reloadAuthoritativeState: () => Promise<void>;
}

export function useTimetableGeneration({
  configId,
  enabled,
  generate,
  reloadAuthoritativeState,
}: UseTimetableGenerationParams) {
  const requestIdRef = useRef(0);
  const [phase, setPhase] = useState<"generating" | "refreshing" | null>(null);
  const [refreshFailed, setRefreshFailed] = useState(false);
  const [result, setResult] = useState<TimetableGenerationResponse | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const resetGeneration = useCallback(() => {
    requestIdRef.current += 1;
    setPhase(null);
    setRefreshFailed(false);
    setResult(null);
    setError(null);
  }, []);

  useEffect(resetGeneration, [configId, enabled, resetGeneration]);

  const refreshGeneration = useCallback(async (requestId: number) => {
    setPhase("refreshing");
    setRefreshFailed(false);
    try {
      await reloadAuthoritativeState();
    } catch {
      // Generation has already persisted; recovery must retry reads, not the mutation.
      if (requestId === requestIdRef.current) setRefreshFailed(true);
    } finally {
      if (requestId === requestIdRef.current) setPhase(null);
    }
  }, [reloadAuthoritativeState]);

  const retryRefresh = useCallback(async () => {
    if (!result || phase !== null) return;
    await refreshGeneration(++requestIdRef.current);
  }, [phase, refreshGeneration, result]);

  const generateCurrentConfig = useCallback(async () => {
    if (!enabled || !configId) return null;

    const requestId = ++requestIdRef.current;
    setPhase("generating");
    setRefreshFailed(false);
    setError(null);
    setResult(null);

    try {
      const response = await generate(configId);
      if (requestId !== requestIdRef.current) return null;

      setResult(response);
      await refreshGeneration(requestId);
      if (requestId !== requestIdRef.current) return null;

      return response;
    } catch (generationError) {
      if (requestId === requestIdRef.current) {
        setError(generationErrorMessage(generationError));
      }
      return null;
    } finally {
      if (requestId === requestIdRef.current) setPhase(null);
    }
  }, [configId, enabled, generate, refreshGeneration]);

  return {
    generateCurrentConfig, isGenerating: phase !== null, phase, result, error,
    refreshFailed, retryRefresh, resetGeneration,
  };
}

function generationErrorMessage(generationError: unknown): string {
  return generationError instanceof Error
    ? generationError.message
    : "Generation failed.";
}
