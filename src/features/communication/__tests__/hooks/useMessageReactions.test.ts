import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMessageReactions } from "@/features/communication/hooks/useMessageReactions";
import { COMMUNICATION_SOCKET_EVENTS } from "@/features/communication/realtime/communication-events";

const apiMocks = vi.hoisted(() => ({
  deleteMyReaction: vi.fn(),
  getReactions: vi.fn(),
  upsertReaction: vi.fn(),
}));

const socketHarness = vi.hoisted(() => {
  const listeners = new Map<string, (payload: unknown) => void>();
  return {
    listeners,
    socket: {
      on: vi.fn((event: string, listener: (payload: unknown) => void) => {
        listeners.set(event, listener);
      }),
      off: vi.fn((event: string) => {
        listeners.delete(event);
      }),
    },
  };
});

vi.mock("@/features/communication/api/communication.service", () => apiMocks);
vi.mock("@/features/communication/hooks/useCommunicationSocket", () => ({
  useCommunicationSocket: () => ({ socket: socketHarness.socket }),
}));

describe("useMessageReactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    socketHarness.listeners.clear();
    apiMocks.getReactions.mockResolvedValue({
      items: [
        {
          id: "reaction-1",
          messageId: "message-1",
          userId: "user-1",
          type: "love",
        },
      ],
    });
  });

  it("removes a reaction from the backend deletion payload", async () => {
    const { result } = renderHook(() => useMessageReactions(["message-1"]));
    await waitFor(() => {
      expect(result.current.reactionsByMessageId["message-1"]).toHaveLength(1);
    });

    act(() => {
      socketHarness.listeners.get(
        COMMUNICATION_SOCKET_EVENTS.reactionDeleted,
      )?.({
        conversationId: "conversation-1",
        messageId: "message-1",
        reactionId: "reaction-1",
        userId: "user-1",
      });
    });

    expect(result.current.reactionsByMessageId["message-1"]).toEqual([]);
  });

  it("does not fetch reactions for a locally confirmed message", async () => {
    renderHook(() => useMessageReactions(["message-1"], ["message-1"]));

    await Promise.resolve();

    expect(apiMocks.getReactions).not.toHaveBeenCalled();
  });
});
