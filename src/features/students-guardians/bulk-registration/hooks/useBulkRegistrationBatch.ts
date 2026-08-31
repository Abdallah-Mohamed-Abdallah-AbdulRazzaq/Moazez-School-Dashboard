"use client";

import { useCallback } from "react";
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

export type BulkRegistrationBatchPollingState =
  BatchPollingState<BulkRegistrationBatchDetail>;

function shouldPollBatch(batch: BulkRegistrationBatchDetail): boolean {
  return POLLING_STATUSES.has(batch.status);
}

export function useBulkRegistrationBatch(
  batchId: string,
): BulkRegistrationBatchPollingState {
  const loadBatch = useCallback(
    (signal: AbortSignal) => getBulkRegistrationBatch(batchId, signal),
    [batchId],
  );

  return useBatchPolling({
    resourceId: batchId,
    load: loadBatch,
    shouldPoll: shouldPollBatch,
  });
}
