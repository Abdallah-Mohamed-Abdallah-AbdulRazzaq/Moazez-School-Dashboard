import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const serviceMocks = vi.hoisted(() => ({
  createModerationAction: vi.fn(),
  getConversation: vi.fn(),
  getMessage: vi.fn(),
  getModerationActions: vi.fn(),
  getParticipants: vi.fn(),
}));

vi.mock("@/features/communication/api/communication.service", () => serviceMocks);
vi.mock("@/features/communication/hooks/useCommunicationSocket", () => ({
  useCommunicationSocket: () => ({ socket: null }),
}));

import { useModerationActions } from "@/features/communication/hooks/useModerationActions";

describe("useModerationActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    serviceMocks.getMessage.mockResolvedValue({
      data: { id: "message-1", conversationId: "conversation-1", senderUserId: "user-1" },
    });
    serviceMocks.getModerationActions.mockResolvedValue({ data: { items: [] } });
    serviceMocks.getConversation.mockResolvedValue({
      data: { id: "conversation-1", titleAr: "محادثة الصف السادس" },
    });
    serviceMocks.getParticipants.mockResolvedValue({
      data: {
        items: [
          {
            id: "participant-1",
            userId: "user-1",
            user: { id: "user-1", displayName: "آية حسن", userType: "parent" },
          },
        ],
      },
    });
  });

  it("loads participants once on conversation selection and reuses them for the message", async () => {
    const { result } = renderHook(() => useModerationActions());

    await act(async () => {
      await result.current.loadConversation("conversation-1");
    });
    await waitFor(() =>
      expect(result.current.conversation?.titleAr).toBe("محادثة الصف السادس"),
    );

    await act(async () => {
      result.current.selectMessage({
        id: "message-1",
        conversationId: "conversation-1",
        senderUserId: "user-1",
      });
    });
    await waitFor(() => expect(result.current.message?.id).toBe("message-1"));

    await act(async () => {
      await result.current.load("message-1");
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.senderParticipant?.user?.displayName).toBe("آية حسن");
    expect(serviceMocks.getParticipants).toHaveBeenCalledTimes(1);
    expect(serviceMocks.getMessage).not.toHaveBeenCalled();
  });

  it("hydrates the selected message conversation context from a direct message load", async () => {
    const { result } = renderHook(() => useModerationActions());

    await act(async () => {
      await result.current.load("message-1");
    });

    await waitFor(() =>
      expect(result.current.conversation?.titleAr).toBe("محادثة الصف السادس"),
    );

    expect(result.current.senderParticipant?.user?.displayName).toBe("آية حسن");
    expect(serviceMocks.getParticipants).toHaveBeenCalledTimes(1);
  });
});
