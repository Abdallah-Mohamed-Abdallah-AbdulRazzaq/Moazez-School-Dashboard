import { useCallback, useEffect, useRef, useState } from "react";
import {
  validationReviewIssueKeys,
  validationReviewProgress,
  type ValidationReviewReport,
} from "../services/timetableValidationReview";

interface CheckedReview {
  contextId: string;
  fingerprint: string;
  checkedAt: number;
  issueKeys: string[];
  previousKeys: string[] | null;
  canPublish: boolean;
}

export function useTimetableValidationReview({
  contextId,
  fingerprint,
  refresh,
}: {
  contextId: string;
  fingerprint: string;
  refresh: () => Promise<ValidationReviewReport | null>;
}) {
  const [checked, setChecked] = useState<CheckedReview | null>(null);
  const [pendingContext, setPendingContext] = useState<string | null>(null);
  const [failureContext, setFailureContext] = useState<string | null>(null);
  const requestId = useRef(0);
  useEffect(
    () => () => {
      requestId.current += 1;
    },
    [contextId],
  );
  const recheck = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setPendingContext(contextId);
    setFailureContext(null);
    try {
      const report = await refresh();
      if (currentRequest !== requestId.current) return;
      if (!report) {
        setFailureContext(contextId);
        return;
      }
      const issueKeys = validationReviewIssueKeys(report);
      setChecked((previous) => ({
        contextId,
        fingerprint,
        checkedAt: Date.now(),
        canPublish: report.publication.canPublish,
        issueKeys,
        previousKeys:
          previous?.contextId === contextId ? previous.issueKeys : null,
      }));
    } catch {
      if (currentRequest === requestId.current) setFailureContext(contextId);
    } finally {
      if (currentRequest === requestId.current) setPendingContext(null);
    }
  }, [contextId, fingerprint, refresh]);
  const current = checked?.contextId === contextId ? checked : null;
  return {
    recheck,
    isChecking: pendingContext === contextId,
    failed: failureContext === contextId,
    checkedAt: current?.checkedAt ?? null,
    canPublish: current?.canPublish ?? false,
    isCurrent:
      current?.fingerprint === fingerprint && failureContext !== contextId,
    progress: current?.previousKeys
      ? validationReviewProgress(current.previousKeys, current.issueKeys)
      : null,
  };
}
