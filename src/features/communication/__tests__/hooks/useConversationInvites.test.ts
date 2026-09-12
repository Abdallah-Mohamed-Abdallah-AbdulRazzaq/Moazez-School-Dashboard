import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const apiMocks = vi.hoisted(() => ({
  getConversationInvites: vi.fn(),
  createConversationInvite: vi.fn(),
  acceptConversationInvite: vi.fn(),
  rejectConversationInvite: vi.fn(),
}));

vi.mock("@/features/communication/api/communication.service", () => apiMocks);
vi.mock("@/features/communication/utils/communication-metadata", () => ({
  createCommunicationMetadata: vi.fn().mockReturnValue(null),
}));

import { useConversationInvites } from "@/features/communication/hooks/useConversationInvites";

describe("useConversationInvites error boundaries", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    apiMocks.getConversationInvites.mockResolvedValue({
      data: { items: [{ id: "invite-1", status: "pending" }], total: 1 },
    });
    apiMocks.createConversationInvite.mockResolvedValue({ data: {} });
  });

  afterEach(() => vi.useRealTimers());

  it("exposes loading errors but not invitation mutation errors", async () => {
    apiMocks.getConversationInvites.mockRejectedValueOnce(
      new Error("Load failed"),
    );
    const { result } = renderHook(() => useConversationInvites("conv-1"));
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    expect(result.current.error).toBe("Load failed");

    await act(async () => {
      await result.current.refresh();
    });
    apiMocks.createConversationInvite.mockRejectedValueOnce(
      new Error("Create failed"),
    );
    await act(async () => {
      await expect(
        result.current.create({ invitedUserId: "user-1" }),
      ).rejects.toThrow("Create failed");
    });

    expect(result.current.error).toBeNull();
    expect(result.current.invites.map(({ id }) => id)).toEqual(["invite-1"]);
  });
});
