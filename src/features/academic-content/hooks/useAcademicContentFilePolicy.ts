"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getAcademicContentFilePolicy } from "../services/academicContentApi";
import {
  academicContentUiError,
  type AcademicContentUiError,
} from "../services/academicContentErrors";
import type { AcademicContentFilePolicy } from "../types/contracts";

export interface AcademicContentFilePolicyState {
  policy: AcademicContentFilePolicy | null;
  isLoading: boolean;
  error: AcademicContentUiError | null;
  reload: () => Promise<void>;
}

export function useAcademicContentFilePolicy(
  enabled = true,
): AcademicContentFilePolicyState {
  const requestIdRef = useRef(0);
  const [policy, setPolicy] = useState<AcademicContentFilePolicy | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<AcademicContentUiError | null>(null);

  const reload = useCallback(async () => {
    if (!enabled) return;

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setIsLoading(true);
    setError(null);

    try {
      const loadedPolicy = await getAcademicContentFilePolicy();
      if (requestIdRef.current === requestId) {
        setPolicy(loadedPolicy);
      }
    } catch (loadError) {
      if (requestIdRef.current === requestId) {
        setPolicy(null);
        setError(academicContentUiError(loadError));
      }
    } finally {
      if (requestIdRef.current === requestId) {
        setIsLoading(false);
      }
    }
  }, [enabled]);

  useEffect(() => {
    void reload();
    return () => {
      requestIdRef.current += 1;
    };
  }, [reload]);

  return { policy, isLoading, error, reload };
}
