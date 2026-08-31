"use client";

import { useCallback, useEffect, useRef } from "react";
import { getBulkRegistrationBatch } from "../api/bulkRegistrationApi";
import type {
  BulkRegistrationBatchDetail,
  BulkRegistrationBatchStatus,
} from "../api/bulkRegistrationDtos";
import {
  type BatchPollingState,
  useBatchPolling,
} from "../../shared/hooks/useBatchPolling";

const POLLING_STATUSES: ReadonlySet<BulkRegistrationBatchStatus> = new Set([
  "UPLOADED",
  "VALIDATING",
  "EXECUTING",
]);

export interface BulkRegistrationBatchPollingState
  extends BatchPollingState<BulkRegistrationBatchDetail> {
  resumeFrom: (batch: BulkRegistrationBatchDetail) => void;
}

function newerBatch(
  loadedBatch: BulkRegistrationBatchDetail,
  knownBatch: BulkRegistrationBatchDetail | null,
): BulkRegistrationBatchDetail {
  if (!knownBatch) return loadedBatch;
  return Date.parse(loadedBatch.updatedAt) > Date.parse(knownBatch.updatedAt)
    ? loadedBatch
    : knownBatch;
}

function shouldPollBatch(batch: BulkRegistrationBatchDetail): boolean {
  return POLLING_STATUSES.has(batch.status);
}

export function useBulkRegistrationBatch(
  batchId: string,
): BulkRegistrationBatchPollingState {
  const latestBatch = useRef<BulkRegistrationBatchDetail | null>(null);

  useEffect(() => {
    latestBatch.current = null;
  }, [batchId]);

  const loadBatch = useCallback(
    async (signal: AbortSignal) => {
      const loadedBatch = await getBulkRegistrationBatch(batchId, signal);
      const authoritativeBatch = newerBatch(
        loadedBatch,
        latestBatch.current,
      );
      latestBatch.current = authoritativeBatch;
      return authoritativeBatch;
    },
    [batchId],
  );
  const polling = useBatchPolling({
    resourceId: batchId,
    load: loadBatch,
    shouldPoll: shouldPollBatch,
  });
  const retry = polling.retry;
  const resumeFrom = useCallback(
    (batch: BulkRegistrationBatchDetail) => {
      latestBatch.current = batch;
      retry();
    },
    [retry],
  );

  return { ...polling, resumeFrom };
}
