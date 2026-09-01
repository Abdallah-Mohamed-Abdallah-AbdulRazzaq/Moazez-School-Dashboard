"use client";

import { useCallback } from "react";
import { getCredentialBatch } from "../api/credentialBatchApi";
import type { CredentialBatch } from "../api/credentialBatchDtos";
import {
  type BatchPollingState,
  useBatchPolling,
} from "../../shared/hooks/useBatchPolling";

export type CredentialBatchPollingState = BatchPollingState<CredentialBatch>;

export function shouldPollCredentialBatch(
  batch: Pick<CredentialBatch, "status">,
): boolean {
  return batch.status === "pending" || batch.status === "processing";
}

export function useCredentialBatch(
  batchId: string,
): CredentialBatchPollingState {
  const loadBatch = useCallback(
    (signal: AbortSignal) => getCredentialBatch(batchId, signal),
    [batchId],
  );

  return useBatchPolling({
    resourceId: batchId,
    load: loadBatch,
    shouldPoll: shouldPollCredentialBatch,
  });
}
