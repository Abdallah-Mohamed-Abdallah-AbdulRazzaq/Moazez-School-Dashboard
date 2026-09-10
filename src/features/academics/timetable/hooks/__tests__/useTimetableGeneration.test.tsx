import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useTimetableGeneration } from "@/features/academics/timetable/hooks/useTimetableGeneration";
import type { TimetableGenerationResponse } from "@/features/academics/timetable/services/timetableApiTypes";

const generationResponse: TimetableGenerationResponse = {
  timetableConfigId: "config-1",
  createdCount: 2,
  existingCount: 1,
  remainingDemandCount: 0,
  complete: true,
  createdEntryIds: ["entry-1", "entry-2"],
  unresolved: [],
  searchNodesVisited: 4,
  searchBudgetExhausted: false,
  validation: {} as never,
  publishReadiness: {
    canPublish: true,
    blockingReasons: [],
    warnings: [],
  },
};

describe("useTimetableGeneration", () => {
  it("generates once and reloads authoritative state after success", async () => {
    const generate = vi.fn().mockResolvedValue(generationResponse);
    const reloadAuthoritativeState = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useTimetableGeneration({
        configId: "config-1",
        enabled: true,
        generate,
        reloadAuthoritativeState,
      }),
    );

    await act(async () => {
      await result.current.generateCurrentConfig();
    });

    expect(result.current.result).toBe(generationResponse);
    expect(generate).toHaveBeenCalledTimes(1);
    expect(generate).toHaveBeenCalledWith("config-1");
    expect(reloadAuthoritativeState).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBeNull();
  });

  it("keeps the failure state without reloading", async () => {
    const generate = vi.fn().mockRejectedValue(new Error("Generation failed"));
    const reloadAuthoritativeState = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useTimetableGeneration({
        configId: "config-1",
        enabled: true,
        generate,
        reloadAuthoritativeState,
      }),
    );

    await act(async () => {
      await result.current.generateCurrentConfig();
    });

    expect(result.current.result).toBeNull();
    expect(result.current.error).toBe("Generation failed");
    expect(reloadAuthoritativeState).not.toHaveBeenCalled();
  });

  it("ignores a stale generation response after a newer request starts", async () => {
    const firstRequest = deferred<TimetableGenerationResponse>();
    const secondRequest = deferred<TimetableGenerationResponse>();
    const generate = vi
      .fn()
      .mockReturnValueOnce(firstRequest.promise)
      .mockReturnValueOnce(secondRequest.promise);
    const reloadAuthoritativeState = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useTimetableGeneration({
        configId: "config-1",
        enabled: true,
        generate,
        reloadAuthoritativeState,
      }),
    );

    let firstOutcome: TimetableGenerationResponse | null = null;
    let secondOutcome: TimetableGenerationResponse | null = null;
    act(() => {
      void result.current.generateCurrentConfig().then((response) => {
        firstOutcome = response;
      });
      void result.current.generateCurrentConfig().then((response) => {
        secondOutcome = response;
      });
    });

    await act(async () => {
      secondRequest.resolve({ ...generationResponse, createdCount: 3 });
      await secondRequest.promise;
    });
    await act(async () => {
      firstRequest.resolve(generationResponse);
      await firstRequest.promise;
    });

    expect(firstOutcome).toBeNull();
    expect(secondOutcome).toMatchObject({ createdCount: 3 });
    expect(result.current.result).toMatchObject({ createdCount: 3 });
    expect(reloadAuthoritativeState).toHaveBeenCalledTimes(1);
  });

  it("invalidates an in-flight generation when the selected config changes", async () => {
    const pendingGeneration = deferred<TimetableGenerationResponse>();
    const generate = vi.fn().mockReturnValue(pendingGeneration.promise);
    const reloadAuthoritativeState = vi.fn().mockResolvedValue(undefined);
    let configId = "config-1";
    const { result, rerender } = renderHook(() =>
      useTimetableGeneration({
        configId,
        enabled: true,
        generate,
        reloadAuthoritativeState,
      }),
    );

    act(() => {
      void result.current.generateCurrentConfig();
    });
    expect(result.current.isGenerating).toBe(true);

    configId = "config-2";
    rerender();
    expect(result.current.isGenerating).toBe(false);
    expect(result.current.result).toBeNull();

    await act(async () => {
      pendingGeneration.resolve(generationResponse);
      await pendingGeneration.promise;
    });

    expect(result.current.result).toBeNull();
    expect(reloadAuthoritativeState).not.toHaveBeenCalled();
  });
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}
