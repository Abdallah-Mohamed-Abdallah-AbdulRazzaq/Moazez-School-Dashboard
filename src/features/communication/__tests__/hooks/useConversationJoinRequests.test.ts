import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const apiMocks = vi.hoisted(() => ({
  getJoinRequests: vi.fn(),
  createJoinRequest: vi.fn(),
  approveJoinRequest: vi.fn(),
  rejectJoinRequest: vi.fn(),
}));

vi.mock("@/features/communication/api/communication.service", () => apiMocks);
vi.mock("@/features/communication/utils/communication-metadata", () => ({
  createCommunicationMetadata: vi.fn().mockReturnValue(null),
}));

import { useConversationJoinRequests } from "@/features/communication/hooks/useConversationJoinRequests";

describe("useConversationJoinRequests error boundaries", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    apiMocks.getJoinRequests.mockResolvedValue({
      data: { items: [{ id: "request-1", status: "pending" }], total: 1 },
    });
    apiMocks.createJoinRequest.mockResolvedValue({ data: {} });
  });

  afterEach(() => vi.useRealTimers());

  it("exposes loading errors but not join-request mutation errors", async () => {
    apiMocks.getJoinRequests.mockRejectedValueOnce(new Error("Load failed"));
    const { result } = renderHook(() => useConversationJoinRequests("conv-1"));
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    expect(result.current.error).toBe("Load failed");

    await act(async () => {
      await result.current.refresh();
    });
    apiMocks.createJoinRequest.mockRejectedValueOnce(new Error("Create failed"));
    await act(async () => {
      await expect(result.current.create({ note: "Please add me" })).rejects.toThrow(
        "Create failed",
      );
    });

    expect(result.current.error).toBeNull();
    expect(result.current.joinRequests.map(({ id }) => id)).toEqual([
      "request-1",
    ]);
  });
});
