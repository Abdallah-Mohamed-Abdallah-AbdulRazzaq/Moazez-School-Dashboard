import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api-error";
import { useBatchPolling } from "../useBatchPolling";

interface BatchStatus {
  status: "RUNNING" | "PAUSED" | "COMPLETE";
}

function deferred<T>() {
  let resolve!: (response: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
}

function setDocumentVisibility(visibilityState: DocumentVisibilityState) {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: visibilityState,
  });
  Object.defineProperty(document, "hidden", {
    configurable: true,
    value: visibilityState === "hidden",
  });
}

function renderBatchPolling(
  load: (signal: AbortSignal) => Promise<BatchStatus>,
  overrides: Partial<{
    resourceId: string;
    shouldPoll: (batch: BatchStatus) => boolean;
    intervalMs: number;
    maxBackoffMs: number;
  }> = {},
) {
  return renderHook(
    ({ resourceId }) =>
      useBatchPolling({
        resourceId,
        load,
        shouldPoll: overrides.shouldPoll ?? ((batch) => batch.status === "RUNNING"),
        intervalMs: overrides.intervalMs ?? 100,
        maxBackoffMs: overrides.maxBackoffMs ?? 400,
      }),
    { initialProps: { resourceId: overrides.resourceId ?? "batch-1" } },
  );
}

describe("useBatchPolling", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setDocumentVisibility("visible");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("loads immediately and exposes the initial loading state", async () => {
    const load = vi.fn().mockResolvedValue({ status: "RUNNING" } satisfies BatchStatus);
    const { result } = renderBatchPolling(load);

    expect(result.current.isInitialLoading).toBe(true);
    expect(result.current.isRefreshing).toBe(false);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(load).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual({ status: "RUNNING" });
    expect(result.current.isInitialLoading).toBe(false);
  });

  it("waits for each request before scheduling the next polling read", async () => {
    const firstRead = deferred<BatchStatus>();
    const secondRead = deferred<BatchStatus>();
    const load = vi
      .fn()
      .mockReturnValueOnce(firstRead.promise)
      .mockReturnValueOnce(secondRead.promise);
    const { result } = renderBatchPolling(load);

    expect(load).toHaveBeenCalledTimes(1);
    await act(async () => {
      firstRead.resolve({ status: "RUNNING" });
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    expect(load).toHaveBeenCalledTimes(2);
    expect(result.current.isRefreshing).toBe(true);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });
    expect(load).toHaveBeenCalledTimes(2);

    await act(async () => {
      secondRead.resolve({ status: "COMPLETE" });
    });
  });

  it("stops scheduling when a terminal batch no longer needs polling", async () => {
    const load = vi.fn().mockResolvedValue({ status: "COMPLETE" } satisfies BatchStatus);
    renderBatchPolling(load);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });

    expect(load).toHaveBeenCalledTimes(1);
  });

  it("pauses polling when shouldPoll rejects the latest batch", async () => {
    const load = vi
      .fn()
      .mockResolvedValueOnce({ status: "RUNNING" } satisfies BatchStatus)
      .mockResolvedValueOnce({ status: "PAUSED" } satisfies BatchStatus);
    renderBatchPolling(load);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });

    expect(load).toHaveBeenCalledTimes(2);
  });

  it("aborts an active request and clears its scheduled polling timer on unmount", async () => {
    const pendingRead = deferred<BatchStatus>();
    let activeSignal: AbortSignal | undefined;
    const load = vi.fn((signal: AbortSignal) => {
      activeSignal = signal;
      return pendingRead.promise;
    });
    const { unmount } = renderBatchPolling(load);

    unmount();
    expect(activeSignal?.aborted).toBe(true);

    await act(async () => {
      pendingRead.reject(new DOMException("Cancelled", "AbortError"));
      await vi.advanceTimersByTimeAsync(1_000);
    });
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("clears a pending polling timer when unmounted after a successful read", async () => {
    const load = vi.fn().mockResolvedValue({ status: "RUNNING" } satisfies BatchStatus);
    const { unmount } = renderBatchPolling(load);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    unmount();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("aborts the previous request and loads the replacement resource immediately", async () => {
    const firstRead = deferred<BatchStatus>();
    let firstSignal: AbortSignal | undefined;
    const load = vi
      .fn()
      .mockImplementationOnce((signal: AbortSignal) => {
        firstSignal = signal;
        return firstRead.promise;
      })
      .mockResolvedValueOnce({ status: "COMPLETE" } satisfies BatchStatus);
    const { rerender } = renderBatchPolling(load);

    rerender({ resourceId: "batch-2" });

    expect(firstSignal?.aborted).toBe(true);
    expect(load).toHaveBeenCalledTimes(2);

    await act(async () => {
      firstRead.reject(new DOMException("Cancelled", "AbortError"));
    });
  });

  it("defers scheduled reads while hidden and refreshes immediately on return", async () => {
    const load = vi
      .fn()
      .mockResolvedValueOnce({ status: "RUNNING" } satisfies BatchStatus)
      .mockResolvedValueOnce({ status: "COMPLETE" } satisfies BatchStatus);
    renderBatchPolling(load);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    setDocumentVisibility("hidden");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });
    expect(load).toHaveBeenCalledTimes(1);

    setDocumentVisibility("visible");
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
      await Promise.resolve();
    });
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("exposes failures, backs off retries to a cap, and resets the delay after retry", async () => {
    const requestError = new ApiError("Temporary failure", 503, "TEMPORARY_FAILURE");
    const load = vi.fn().mockRejectedValue(requestError);
    const { result } = renderBatchPolling(load);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(result.current.error).toBe(requestError);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(199);
    });
    expect(load).toHaveBeenCalledTimes(1);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(load).toHaveBeenCalledTimes(2);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(399);
    });
    expect(load).toHaveBeenCalledTimes(2);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(load).toHaveBeenCalledTimes(3);

    act(() => result.current.retry());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(load).toHaveBeenCalledTimes(4);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(199);
    });
    expect(load).toHaveBeenCalledTimes(4);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(load).toHaveBeenCalledTimes(5);
  });
});
