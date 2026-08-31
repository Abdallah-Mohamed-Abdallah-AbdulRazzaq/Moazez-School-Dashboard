"use client";

import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/ui/toast/Toast";
import { isApiError } from "@/lib/api-error";
import { confirmBulkRegistration } from "../api/bulkRegistrationApi";
import type { BulkRegistrationBatchDetail } from "../api/bulkRegistrationDtos";
import type { BulkRegistrationBatchPollingState } from "./useBulkRegistrationBatch";

interface ConfirmationMessages {
  stale: string;
  confirmFailed: string;
  confirmed: string;
}

interface ConfirmationOptions {
  batchId: string;
  polledBatch: BulkRegistrationBatchDetail | null;
  polling: BulkRegistrationBatchPollingState;
  messages: ConfirmationMessages;
}

interface ConfirmedSnapshot {
  batch: BulkRegistrationBatchDetail;
  previousBatch: BulkRegistrationBatchDetail;
}

export function useBulkRegistrationConfirmation({
  batchId,
  polledBatch,
  polling,
  messages,
}: ConfirmationOptions) {
  const { showError, showSuccess, showWarning } = useToast();
  const [confirmedSnapshot, setConfirmedSnapshot] =
    useState<ConfirmedSnapshot | null>(null);
  const [conflictSnapshot, setConflictSnapshot] =
    useState<BulkRegistrationBatchDetail | null>(null);
  const [confirming, setConfirming] = useState(false);
  const confirmationInFlight = useRef(false);
  const batch = confirmedSnapshot?.batch ?? polledBatch;

  useEffect(() => {
    setConfirmedSnapshot(null);
    setConflictSnapshot(null);
  }, [batchId]);

  useEffect(() => {
    if (confirmedSnapshot && polledBatch !== confirmedSnapshot.previousBatch) {
      setConfirmedSnapshot(null);
    }
  }, [confirmedSnapshot, polledBatch]);

  useEffect(() => {
    if (conflictSnapshot && polledBatch && polledBatch !== conflictSnapshot) {
      setConflictSnapshot(null);
    }
  }, [conflictSnapshot, polledBatch]);

  const confirm = async () => {
    if (!batch || batch.status !== "READY" || confirmationInFlight.current) return;
    confirmationInFlight.current = true;
    setConfirming(true);
    try {
      const executingBatch = await confirmBulkRegistration(batch.id);
      setConfirmedSnapshot({ batch: executingBatch, previousBatch: batch });
      polling.retry();
      showSuccess(messages.confirmed);
    } catch (error) {
      if (isApiError(error) && error.status === 409) {
        setConflictSnapshot(polledBatch);
        polling.retry();
        showWarning(messages.stale);
      } else {
        showError(messages.confirmFailed);
      }
    } finally {
      confirmationInFlight.current = false;
      setConfirming(false);
    }
  };

  const freshReady = Boolean(
    batch === polledBatch &&
      batch?.status === "READY" &&
      !polling.isRefreshing &&
      !polling.error &&
      !conflictSnapshot,
  );

  return { batch, confirming, freshReady, confirm };
}
