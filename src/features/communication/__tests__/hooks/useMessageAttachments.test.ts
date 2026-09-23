import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMessageAttachments } from "@/features/communication/hooks/useMessageAttachments";
import type { ConversationMessage } from "@/features/communication/hooks/useConversationMessages";
import { COMMUNICATION_SOCKET_EVENTS } from "@/features/communication/realtime/communication-events";

const apiMocks = vi.hoisted(() => ({
  deleteAttachment: vi.fn(),
  getAttachments: vi.fn(),
  linkAttachment: vi.fn(),
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

vi.mock("@/features/communication/api/files.service", () => ({
  uploadFile: vi.fn(),
}));

vi.mock("@/features/communication/hooks/useCommunicationSocket", () => ({
  useCommunicationSocket: () => ({ socket: socketHarness.socket }),
}));

describe("useMessageAttachments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    socketHarness.listeners.clear();
    apiMocks.getAttachments.mockResolvedValue({ items: [] });
  });

  it("uses inline message attachments without fetching each message attachment list", async () => {
    const messages = [
      {
        id: "message-1",
        conversationId: "conversation-1",
        body: "📎",
        attachments: [
          {
            id: "attachment-1",
            attachmentId: "attachment-1",
            messageId: "message-1",
            fileId: "file-1",
            displayName: "photo.jpg",
            mimeType: "image/jpeg",
            downloadPath: "/api/v1/files/file-1/download",
          },
        ],
      },
    ] satisfies ConversationMessage[];

    const { result } = renderHook(() => useMessageAttachments(messages));

    await waitFor(() => {
      expect(result.current.attachmentsByMessageId["message-1"]).toHaveLength(1);
    });

    expect(result.current.attachmentsByMessageId["message-1"]?.[0]).toEqual(
      expect.objectContaining({
        id: "attachment-1",
        fileId: "file-1",
        displayName: "photo.jpg",
      }),
    );
    expect(apiMocks.getAttachments).not.toHaveBeenCalled();
  });

  it("does not fetch attachment lists for messages that already include an empty attachments array", async () => {
    const messages = [
      {
        id: "message-1",
        conversationId: "conversation-1",
        body: "No attachments",
        attachments: [],
      },
      {
        id: "message-2",
        conversationId: "conversation-1",
        body: "Also no attachments",
        attachments: [],
      },
    ] satisfies ConversationMessage[];

    renderHook(() => useMessageAttachments(messages));

    await waitFor(() => {
      expect(apiMocks.getAttachments).not.toHaveBeenCalled();
    });
  });

  it("removes stored attachments when their message is removed", async () => {
    const messageWithAttachment = {
      id: "message-1",
      conversationId: "conversation-1",
      body: "Voice message",
      attachments: [
        {
          id: "attachment-1",
          messageId: "message-1",
          fileId: "file-1",
          displayName: "voice-note.webm",
          mimeType: "audio/webm",
          downloadPath: "/api/v1/files/file-1/download",
        },
      ],
    } satisfies ConversationMessage;

    const { result, rerender } = renderHook(
      ({ messages }) => useMessageAttachments(messages),
      { initialProps: { messages: [messageWithAttachment] } },
    );

    await waitFor(() => {
      expect(result.current.attachmentsByMessageId["message-1"]).toHaveLength(1);
    });

    rerender({ messages: [] });

    await waitFor(() => {
      expect(result.current.attachmentsByMessageId["message-1"]).toBeUndefined();
    });
  });

  it("adds an attachment from the backend attachmentId payload", async () => {
    const messages = [
      {
        id: "message-1",
        conversationId: "conversation-1",
        body: "Existing message",
        attachments: [],
      },
    ] satisfies ConversationMessage[];
    const { result } = renderHook(() => useMessageAttachments(messages));
    await waitFor(() => {
      expect(
        socketHarness.listeners.has(
          COMMUNICATION_SOCKET_EVENTS.attachmentLinked,
        ),
      ).toBe(true);
    });

    act(() => {
      socketHarness.listeners.get(
        COMMUNICATION_SOCKET_EVENTS.attachmentLinked,
      )?.({
        conversationId: "conversation-1",
        messageId: "message-1",
        attachment: {
          attachmentId: "attachment-1",
          fileId: "file-1",
          displayName: "report.pdf",
          mimeType: "application/pdf",
          sizeBytes: "1200",
          downloadPath: "/api/v1/files/file-1/download",
        },
      });
    });

    expect(result.current.attachmentsByMessageId["message-1"]?.[0]).toEqual(
      expect.objectContaining({
        id: "attachment-1",
        name: "report.pdf",
        size: 1200,
        url: "/api/v1/files/file-1/download",
      }),
    );
  });
});
