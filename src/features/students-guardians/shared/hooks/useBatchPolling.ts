import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, isApiError } from "@/lib/api-error";

const DEFAULT_INTERVAL_MS = 3_000;
const DEFAULT_MAX_BACKOFF_MS = 30_000;

export interface BatchPollingOptions<T> {
  resourceId: string;
  load: (signal: AbortSignal) => Promise<T>;
  shouldPoll: (value: T) => boolean;
  intervalMs?: number;
  maxBackoffMs?: number;
}

export interface BatchPollingState<T> {
  data: T | null;
  error: ApiError | null;
  isInitialLoading: boolean;
  isRefreshing: boolean;
  retry: () => void;
}

function toApiError(error: unknown): ApiError {
  if (isApiError(error)) return error;

  return new ApiError(
    error instanceof Error ? error.message : "Unable to refresh the batch.",
    0,
    "BATCH_POLLING_ERROR",
  );
}

export function useBatchPolling<T>(
  options: BatchPollingOptions<T>,
): BatchPollingState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const latestOptions = useRef(options);
  const retryRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    latestOptions.current = options;
  }, [options]);

  useEffect(() => {
    let activeController: AbortController | null = null;
    let consecutiveFailures = 0;
    let hasFinishedInitialRead = false;
    let inFlight = false;
    let pollingEnabled = true;
    let stopped = false;
    let timeoutId: number | null = null;

    const clearScheduledRead = () => {
      if (timeoutId === null) return;
      window.clearTimeout(timeoutId);
      timeoutId = null;
    };

    const scheduleRead = (delayMs: number, read: () => void) => {
      clearScheduledRead();
      if (stopped || !pollingEnabled || document.hidden) return;

      timeoutId = window.setTimeout(() => {
        timeoutId = null;
        read();
      }, delayMs);
    };

    const read = () => {
      if (stopped || inFlight || !pollingEnabled || document.hidden) return;

      const controller = new AbortController();
      activeController = controller;
      inFlight = true;
      if (!hasFinishedInitialRead) {
        setData(null);
        setError(null);
      }
      setIsInitialLoading(!hasFinishedInitialRead);
      setIsRefreshing(hasFinishedInitialRead);

      void latestOptions.current
        .load(controller.signal)
        .then((nextBatch) => {
          if (stopped || controller.signal.aborted) return;

          consecutiveFailures = 0;
          setData(nextBatch);
          setError(null);
          pollingEnabled = latestOptions.current.shouldPoll(nextBatch);
          if (pollingEnabled) {
            scheduleRead(latestOptions.current.intervalMs ?? DEFAULT_INTERVAL_MS, read);
          }
        })
        .catch((loadError: unknown) => {
          if (stopped || controller.signal.aborted) return;

          consecutiveFailures += 1;
          setError(toApiError(loadError));
          pollingEnabled = true;
          const intervalMs = latestOptions.current.intervalMs ?? DEFAULT_INTERVAL_MS;
          const maxBackoffMs = latestOptions.current.maxBackoffMs ?? DEFAULT_MAX_BACKOFF_MS;
          const retryDelayMs = Math.min(
            intervalMs * 2 ** consecutiveFailures,
            maxBackoffMs,
          );
          scheduleRead(retryDelayMs, read);
        })
        .finally(() => {
          if (stopped || controller.signal.aborted) return;

          hasFinishedInitialRead = true;
          inFlight = false;
          activeController = null;
          setIsInitialLoading(false);
          setIsRefreshing(false);
        });
    };

    const onVisibilityChange = () => {
      if (document.hidden || !pollingEnabled || inFlight) return;

      clearScheduledRead();
      read();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    retryRef.current = () => {
      consecutiveFailures = 0;
      pollingEnabled = true;
      clearScheduledRead();
      read();
    };
    read();

    return () => {
      stopped = true;
      retryRef.current = () => undefined;
      clearScheduledRead();
      activeController?.abort();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [options.resourceId]);

  const retry = useCallback(() => {
    retryRef.current();
  }, []);

  return { data, error, isInitialLoading, isRefreshing, retry };
}
