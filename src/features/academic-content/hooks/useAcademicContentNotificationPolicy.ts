"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { notificationPolicyChanges } from "../model/academicContentNotificationPolicy";
import {
  getAcademicContentNotificationPolicy,
  updateAcademicContentNotificationPolicy,
} from "../services/academicContentApi";
import {
  academicContentUiError,
  type AcademicContentUiError,
} from "../services/academicContentErrors";
import type { AcademicContentNotificationPolicy } from "../types/contracts";

export function useAcademicContentNotificationPolicy() {
  const requestId = useRef(0);
  const [policy, setPolicy] =
    useState<AcademicContentNotificationPolicy | null>(null);
  const [draft, setDraft] = useState<AcademicContentNotificationPolicy | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<AcademicContentUiError | null>(null);
  const [saved, setSaved] = useState(false);

  const reload = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setIsLoading(true);
    setError(null);
    try {
      const loaded = await getAcademicContentNotificationPolicy();
      if (requestId.current !== currentRequest) return;
      setPolicy(loaded);
      setDraft(loaded);
    } catch (loadError) {
      if (requestId.current !== currentRequest) return;
      setPolicy(null);
      setDraft(null);
      setError(academicContentUiError(loadError));
    } finally {
      if (requestId.current === currentRequest) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
    return () => {
      requestId.current += 1;
    };
  }, [reload]);

  const changes = useMemo(
    () => (policy && draft ? notificationPolicyChanges(policy, draft) : {}),
    [draft, policy],
  );

  const updateDraft = useCallback(
    (updates: Partial<AcademicContentNotificationPolicy>) => {
      setDraft((current) => (current ? { ...current, ...updates } : current));
      setSaved(false);
    },
    [],
  );

  const save = useCallback(
    async (overrides: Partial<AcademicContentNotificationPolicy> = {}) => {
      if (!draft || !policy) return false;
      const nextDraft = { ...draft, ...overrides };
      const nextChanges = notificationPolicyChanges(policy, nextDraft);
      if (Object.keys(nextChanges).length === 0) return false;
      setDraft(nextDraft);
      setIsSaving(true);
      setError(null);
      setSaved(false);
      try {
        const updated =
          await updateAcademicContentNotificationPolicy(nextChanges);
        setPolicy(updated);
        setDraft(updated);
        setSaved(true);
        return true;
      } catch (saveError) {
        setError(academicContentUiError(saveError));
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [draft, policy],
  );

  return {
    policy,
    draft,
    isLoading,
    isSaving,
    error,
    saved,
    isDirty: Object.keys(changes).length > 0,
    reload,
    updateDraft,
    save,
  };
}
