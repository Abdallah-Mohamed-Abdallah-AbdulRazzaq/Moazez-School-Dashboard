"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getAcademicContentWorkflowPolicy,
  listAcademicContentApprovalHistory,
  submitAcademicContent,
} from "../services/academicContentApi";
import {
  academicContentUiError,
  type AcademicContentUiError,
} from "../services/academicContentErrors";
import type {
  AcademicContentApprovalHistoryResponse,
  AcademicContentTransitionResponse,
  AcademicContentWorkflowPolicy,
} from "../types/contracts";

const HISTORY_PAGE = { page: 1, limit: 50 } as const;

export function useAcademicContentWorkflow(contentId: string) {
  const activeContentId = useRef(contentId);
  activeContentId.current = contentId;
  const [policy, setPolicy] = useState<AcademicContentWorkflowPolicy | null>(null);
  const [history, setHistory] =
    useState<AcademicContentApprovalHistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<AcademicContentUiError | null>(null);

  const refreshHistory = useCallback(async () => {
    const loadedHistory = await listAcademicContentApprovalHistory(
      contentId,
      HISTORY_PAGE,
    );
    if (activeContentId.current === contentId) setHistory(loadedHistory);
    return loadedHistory;
  }, [contentId]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [loadedPolicy, loadedHistory] = await Promise.all([
        getAcademicContentWorkflowPolicy(),
        listAcademicContentApprovalHistory(contentId, HISTORY_PAGE),
      ]);
      if (activeContentId.current !== contentId) return;
      setPolicy(loadedPolicy);
      setHistory(loadedHistory);
    } catch (loadError) {
      if (activeContentId.current === contentId) {
        setError(academicContentUiError(loadError));
      }
    } finally {
      if (activeContentId.current === contentId) setIsLoading(false);
    }
  }, [contentId]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = useCallback(async (): Promise<AcademicContentTransitionResponse | null> => {
    setIsSubmitting(true);
    setError(null);
    let transition: AcademicContentTransitionResponse;
    try {
      transition = await submitAcademicContent(contentId);
    } catch (submitError) {
      if (activeContentId.current === contentId) {
        setError(academicContentUiError(submitError));
        setIsSubmitting(false);
      }
      return null;
    }

    if (activeContentId.current !== contentId) return null;
    try {
      await refreshHistory();
    } catch (historyError) {
      if (activeContentId.current === contentId) {
        setError(academicContentUiError(historyError));
      }
    }
    if (activeContentId.current === contentId) setIsSubmitting(false);
    return transition;
  }, [contentId, refreshHistory]);

  return {
    policy,
    history,
    isLoading,
    isSubmitting,
    error,
    submit,
    reload: load,
  };
}
