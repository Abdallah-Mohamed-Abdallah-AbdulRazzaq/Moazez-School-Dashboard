"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchAdmissionRequiredDocumentsForSchool } from "@/features/settings/services/settingsService";
import type { AdmissionRequiredDocument } from "@/features/settings/types";

interface AdmissionDocumentRequirementsOptions {
  enabled: boolean;
  schoolId: string;
  loadErrorMessage: string;
}

export function useAdmissionDocumentRequirements({
  enabled,
  schoolId,
  loadErrorMessage,
}: AdmissionDocumentRequirementsOptions) {
  const [requirements, setRequirements] = useState<AdmissionRequiredDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const latestRequestId = useRef(0);

  const reload = useCallback(async () => {
    const requestId = ++latestRequestId.current;
    if (!enabled) return;
    if (!schoolId) {
      setRequirements([]);
      setError(loadErrorMessage);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const schoolRequirements =
        await fetchAdmissionRequiredDocumentsForSchool(schoolId);
      if (requestId !== latestRequestId.current) return;
      setRequirements(schoolRequirements);
    } catch (loadError) {
      if (requestId !== latestRequestId.current) return;
      console.error("Failed to load admission required documents:", loadError);
      setRequirements([]);
      setError(loadErrorMessage);
    } finally {
      if (requestId === latestRequestId.current) setIsLoading(false);
    }
  }, [enabled, loadErrorMessage, schoolId]);

  useEffect(() => {
    if (!enabled) return;

    void Promise.resolve().then(reload);
    return () => {
      latestRequestId.current += 1;
    };
  }, [enabled, reload]);

  return { requirements, isLoading, error, reload };
}
