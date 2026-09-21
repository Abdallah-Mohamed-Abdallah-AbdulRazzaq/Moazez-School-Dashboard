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
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<TimetableGenerationResponse | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    requestIdRef.current += 1;
    setIsGenerating(false);
    setResult(null);
    setError(null);
  }, [configId, enabled]);

  const generateCurrentConfig = useCallback(async () => {
    if (!enabled || !configId) return null;

    const requestId = ++requestIdRef.current;
    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      const response = await generate(configId);
      if (requestId !== requestIdRef.current) return null;

      await reloadAuthoritativeState();
      if (requestId !== requestIdRef.current) return null;

      setResult(response);
      return response;
    } catch (generationError) {
      if (requestId === requestIdRef.current) {
        setError(generationErrorMessage(generationError));
      }
      return null;
    } finally {
      if (requestId === requestIdRef.current) setIsGenerating(false);
    }
  }, [configId, enabled, generate, reloadAuthoritativeState]);

  return { generateCurrentConfig, isGenerating, result, error };
}

function generationErrorMessage(generationError: unknown): string {
  return generationError instanceof Error
    ? generationError.message
    : "Generation failed.";
}
