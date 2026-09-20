import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const serviceMocks = vi.hoisted(() => ({
  getConversation: vi.fn(),
  getMessage: vi.fn(),
  getMessageReport: vi.fn(),
  getParticipants: vi.fn(),
  updateMessageReport: vi.fn(),
}));

vi.mock(
  "@/features/communication/api/communication.service",
  () => serviceMocks,
);
vi.mock("@/features/communication/hooks/useCommunicationSocket", () => ({
  useCommunicationSocket: () => ({ socket: null }),
}));

import { useMessageReport } from "@/features/communication/hooks/useMessageReport";

describe("useMessageReport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    serviceMocks.getMessageReport.mockResolvedValue({
      data: {
        id: "report-1",
        messageId: "message-1",
        conversationId: "conversation-1",
      },
    });
    serviceMocks.getMessage.mockResolvedValue({
      data: {
        id: "message-1",
        senderUserId: "user-1",
        body: "Reported content",
      },
    });
    serviceMocks.getConversation.mockResolvedValue({
      data: { id: "conversation-1", titleEn: "Grade 6 Parents" },
    });
    serviceMocks.getParticipants.mockResolvedValue({
      data: {
        items: [
          {
            id: "participant-1",
            userId: "user-1",
            user: {
              id: "user-1",
              displayName: "Aya Hassan",
              userType: "parent",
            },
          },
        ],
      },
    });
  });

  it("loads the reported message sender and conversation display data", async () => {
    const { result } = renderHook(() => useMessageReport("report-1"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.conversation?.titleEn).toBe("Grade 6 Parents");
    expect(result.current.senderParticipant?.user?.displayName).toBe(
      "Aya Hassan",
    );
  });
});
