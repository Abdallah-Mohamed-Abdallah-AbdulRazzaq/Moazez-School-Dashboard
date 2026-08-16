/**
 * Tests for useConversationMessages hook.
 *
 * Validates:
 * - Property 4: Data Hook Fetches Correct Conversation ID (Requirements 3.2)
 * - Property 8: Real-Time Message Upsert Without Refetch (Requirements 4.1)
 * - Property 10: Message Update Preserves Order (Requirements 4.4)
 * - Property 11: Message Delete Marks as Deleted (Requirements 4.5)
 * - Property 15: Composer Action Correctness (Requirements 6.1)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { createMessage } from "../utils/test-data-generators";

// ─── Hoisted Mocks ──────────────────────────────────────────────────────────

const apiMocks = vi.hoisted(() => ({
  getMessages: vi.fn(),
  sendMessage: vi.fn(),
  updateMessage: vi.fn(),
  deleteMessage: vi.fn(),
  markConversationRead: vi.fn(),
  markMessageRead: vi.fn(),
  getConversationReadSummary: vi.fn(),
}));

const filesApiMocks = vi.hoisted(() => ({
  uploadFile: vi.fn(),
}));

const authMock = vi.hoisted(() => ({
  useAuth: vi.fn(),
}));

vi.mock("@/features/communication/api/communication.service", () => apiMocks);
vi.mock("@/features/communication/api/files.service", () => filesApiMocks);
vi.mock("@/hooks/use-auth", () => authMock);

// ─── Import Hook Under Test ─────────────────────────────────────────────────

import { useConversationMessages } from "@/features/communication/hooks/useConversationMessages";

// ─── Test Setup ─────────────────────────────────────────────────────────────

const TEST_CONVERSATION_ID = "conv-test-001";
const TEST_USER_ID = "user-test-001";

function setupDefaultMocks() {
  authMock.useAuth.mockReturnValue({
    user: {
      id: TEST_USER_ID,
      firstName: "Test",
      lastName: "User",
    },
    isAuthenticated: true,
  });

  apiMocks.getMessages.mockResolvedValue({ data: { items: [], total: 0 } });
  apiMocks.sendMessage.mockResolvedValue({
    data: {
      id: "msg-server-001",
      conversationId: TEST_CONVERSATION_ID,
      senderId: TEST_USER_ID,
      body: "Hello",
      type: "text",
      status: "sent",
      createdAt: new Date().toISOString(),
    },
  });
  apiMocks.updateMessage.mockResolvedValue({ data: {} });
  apiMocks.deleteMessage.mockResolvedValue({ data: { success: true } });
  apiMocks.markConversationRead.mockResolvedValue({});
  apiMocks.markMessageRead.mockResolvedValue({});
  apiMocks.getConversationReadSummary.mockResolvedValue({
    data: {
      conversationId: TEST_CONVERSATION_ID,
      items: [],
      total: 0,
      limit: 100,
      page: 1,
    },
  });
  filesApiMocks.uploadFile.mockResolvedValue({
    data: { id: "file-voice-001" },
  });
}

describe("useConversationMessages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
  });

  // ─── Property 4: Data Hook Fetches Correct Conversation ID ──────────────

  describe("Property 4: initial fetch with correct conversation ID", () => {
    it("calls getMessages with the provided conversation ID on mount", async () => {
      renderHook(() => useConversationMessages(TEST_CONVERSATION_ID));

      await waitFor(() => {
        expect(apiMocks.getMessages).toHaveBeenCalledWith(
          TEST_CONVERSATION_ID,
          expect.objectContaining({ limit: 30 }),
        );
      });
    });

    it("does not mark the conversation read merely because messages were loaded", async () => {
      renderHook(() => useConversationMessages(TEST_CONVERSATION_ID));

      await waitFor(() => expect(apiMocks.getMessages).toHaveBeenCalled());
      expect(apiMocks.markConversationRead).not.toHaveBeenCalled();
    });

    it("populates messages state from API response", async () => {
      const existingMessages = [
        createMessage({
          id: "msg-1",
          conversationId: TEST_CONVERSATION_ID,
          body: "First message",
          createdAt: "2024-01-01T10:00:00.000Z",
        }),
        createMessage({
          id: "msg-2",
          conversationId: TEST_CONVERSATION_ID,
          body: "Second message",
          createdAt: "2024-01-01T10:01:00.000Z",
        }),
      ];

      apiMocks.getMessages.mockResolvedValue({
        data: { items: existingMessages, total: 2 },
      });

      const { result } = renderHook(() =>
        useConversationMessages(TEST_CONVERSATION_ID),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.messages).toHaveLength(2);
      expect(result.current.messages[0].body).toBe("First message");
      expect(result.current.messages[1].body).toBe("Second message");
    });

    it("applies read counts from the backend paginated summary", async () => {
      apiMocks.getMessages.mockResolvedValue({
        data: {
          items: [
            createMessage({
              id: "msg-1",
              conversationId: TEST_CONVERSATION_ID,
              readCount: 0,
            }),
          ],
          total: 1,
        },
      });
      apiMocks.getConversationReadSummary.mockResolvedValue({
        data: {
          conversationId: TEST_CONVERSATION_ID,
          items: [{ messageId: "msg-1", readCount: 2 }],
          total: 1,
          limit: 100,
          page: 1,
        },
      });

      const { result } = renderHook(() =>
        useConversationMessages(TEST_CONVERSATION_ID),
      );

      await waitFor(() => {
        expect(result.current.messages[0]?.readCount).toBe(2);
      });
      expect(result.current.readSummary.items).toEqual([
        { messageId: "msg-1", readCount: 2 },
      ]);
    });
  });

  // ─── Property 8: Real-Time Message Upsert Without Refetch ───────────────

  describe("Property 8: upsertFromRealtime adds message without refetch", () => {
    it("adds a new message to the list via upsertFromRealtime without calling getMessages again", async () => {
      apiMocks.getMessages.mockResolvedValue({
        data: { items: [], total: 0 },
      });

      const { result } = renderHook(() =>
        useConversationMessages(TEST_CONVERSATION_ID),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Clear call count after initial fetch
      apiMocks.getMessages.mockClear();

      const realtimePayload = {
        message: {
          id: "msg-realtime-001",
          conversationId: TEST_CONVERSATION_ID,
          senderId: "user-other-001",
          body: "Hello from realtime!",
          type: "text",
          status: "sent",
          createdAt: new Date().toISOString(),
        },
      };

      act(() => {
        result.current.upsertFromRealtime(realtimePayload);
      });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].body).toBe("Hello from realtime!");
      expect(result.current.messages[0].id).toBe("msg-realtime-001");

      // Verify no additional API call was made
      expect(apiMocks.getMessages).not.toHaveBeenCalled();
    });

    it("ignores messages for a different conversation ID", async () => {
      const { result } = renderHook(() =>
        useConversationMessages(TEST_CONVERSATION_ID),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const realtimePayload = {
        message: {
          id: "msg-other-conv",
          conversationId: "conv-different-999",
          senderId: "user-other-001",
          body: "Wrong conversation",
          type: "text",
          status: "sent",
          createdAt: new Date().toISOString(),
        },
      };

      act(() => {
        result.current.upsertFromRealtime(realtimePayload);
      });

      expect(result.current.messages).toHaveLength(0);
    });
  });

  // ─── Property 10: Message Update Preserves Order ────────────────────────

  describe("Property 10: patchFromRealtime updates message body without reordering", () => {
    it("updates message body in place without changing sort order", async () => {
      const existingMessages = [
        createMessage({
          id: "msg-1",
          conversationId: TEST_CONVERSATION_ID,
          body: "First",
          createdAt: "2024-01-01T10:00:00.000Z",
        }),
        createMessage({
          id: "msg-2",
          conversationId: TEST_CONVERSATION_ID,
          body: "Second",
          createdAt: "2024-01-01T10:01:00.000Z",
        }),
        createMessage({
          id: "msg-3",
          conversationId: TEST_CONVERSATION_ID,
          body: "Third",
          createdAt: "2024-01-01T10:02:00.000Z",
        }),
      ];

      apiMocks.getMessages.mockResolvedValue({
        data: { items: existingMessages, total: 3 },
      });

      const { result } = renderHook(() =>
        useConversationMessages(TEST_CONVERSATION_ID),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Patch the middle message
      const patchPayload = {
        message: {
          id: "msg-2",
          conversationId: TEST_CONVERSATION_ID,
          body: "Second (edited)",
          type: "text",
          status: "sent",
          createdAt: "2024-01-01T10:01:00.000Z",
          updatedAt: "2024-01-01T11:00:00.000Z",
        },
      };

      act(() => {
        result.current.patchFromRealtime(patchPayload);
      });

      // Verify body was updated
      expect(result.current.messages[1].body).toBe("Second (edited)");

      // Verify order is preserved (sorted by createdAt ascending)
      expect(result.current.messages[0].id).toBe("msg-1");
      expect(result.current.messages[1].id).toBe("msg-2");
      expect(result.current.messages[2].id).toBe("msg-3");
    });

    it("ignores patch for a different conversation", async () => {
      const existingMessages = [
        createMessage({
          id: "msg-1",
          conversationId: TEST_CONVERSATION_ID,
          body: "Original",
          createdAt: "2024-01-01T10:00:00.000Z",
        }),
      ];

      apiMocks.getMessages.mockResolvedValue({
        data: { items: existingMessages, total: 1 },
      });

      const { result } = renderHook(() =>
        useConversationMessages(TEST_CONVERSATION_ID),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const patchPayload = {
        message: {
          id: "msg-1",
          conversationId: "conv-different-999",
          body: "Should not apply",
          type: "text",
          status: "sent",
          createdAt: "2024-01-01T10:00:00.000Z",
        },
      };

      act(() => {
        result.current.patchFromRealtime(patchPayload);
      });

      // Body should remain unchanged
      expect(result.current.messages[0].body).toBe("Original");
    });

    it("preserves content when moderation sends a metadata-only update", async () => {
      apiMocks.getMessages.mockResolvedValue({
        data: {
          items: [
            createMessage({
              id: "msg-1",
              conversationId: TEST_CONVERSATION_ID,
              body: "Original",
              status: "hidden",
              createdAt: "2024-01-01T10:00:00.000Z",
            }),
          ],
          total: 1,
        },
      });
      const { result } = renderHook(() =>
        useConversationMessages(TEST_CONVERSATION_ID),
      );
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => {
        result.current.patchFromRealtime({
          messageId: "msg-1",
          conversationId: TEST_CONVERSATION_ID,
          status: "sent",
          updatedAt: "2024-01-01T10:05:00.000Z",
        });
      });

      expect(result.current.messages[0]).toEqual(
        expect.objectContaining({ body: "Original", status: "sent" }),
      );
    });
  });

  // ─── Property 11: Message Delete Marks as Deleted ───────────────────────

  describe("Property 11: message deletion preserves the timeline row", () => {
    it("marks the target message deleted when the backend event is received", async () => {
      const existingMessages = [
        createMessage({
          id: "msg-1",
          conversationId: TEST_CONVERSATION_ID,
          body: "Keep this",
          createdAt: "2024-01-01T10:00:00.000Z",
          clientMessageId: "client-msg-1",
        }),
        createMessage({
          id: "msg-2",
          conversationId: TEST_CONVERSATION_ID,
          body: "Delete this",
          createdAt: "2024-01-01T10:01:00.000Z",
          clientMessageId: "client-msg-2",
        }),
      ];

      apiMocks.getMessages.mockResolvedValue({
        data: { items: existingMessages, total: 2 },
      });

      const { result } = renderHook(() =>
        useConversationMessages(TEST_CONVERSATION_ID),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const deletePayload = {
        messageId: "msg-2",
        conversationId: TEST_CONVERSATION_ID,
        status: "deleted",
        deletedAt: "2024-01-01T10:02:00.000Z",
      };

      act(() => {
        result.current.deleteFromRealtime(deletePayload);
      });

      expect(result.current.messages.find((m) => m.id === "msg-2")).toEqual(
        expect.objectContaining({
          body: "Delete this",
          status: "deleted",
        }),
      );

      // The other message should be unaffected
      const keptMsg = result.current.messages.find((m) => m.id === "msg-1");
      expect(keptMsg?.body).toBe("Keep this");
      expect(keptMsg?.status).toBe("sent");
    });

    it("keeps a deleted local message in place and clears its content", async () => {
      const existingMessages = [
        createMessage({
          id: "msg-1",
          conversationId: TEST_CONVERSATION_ID,
          body: "Keep this",
          createdAt: "2024-01-01T10:00:00.000Z",
        }),
        createMessage({
          id: "msg-2",
          conversationId: TEST_CONVERSATION_ID,
          body: "Voice message",
          type: "audio",
          createdAt: "2024-01-01T10:01:00.000Z",
          attachments: [
            {
              id: "att-1",
              messageId: "msg-2",
              name: "voice-note.webm",
              mimeType: "audio/webm",
              size: 1234,
            },
          ],
        }),
      ];

      apiMocks.getMessages.mockResolvedValue({
        data: { items: existingMessages, total: 2 },
      });

      const { result } = renderHook(() =>
        useConversationMessages(TEST_CONVERSATION_ID),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.remove("msg-2");
      });

      expect(apiMocks.deleteMessage).toHaveBeenCalledWith("msg-2");
      expect(result.current.messages.map((message) => message.id)).toEqual([
        "msg-1",
        "msg-2",
      ]);
      expect(result.current.messages[1]).toEqual(
        expect.objectContaining({
          body: undefined,
          attachments: [],
          status: "deleted",
        }),
      );
    });

    it("ignores delete for a different conversation", async () => {
      const existingMessages = [
        createMessage({
          id: "msg-1",
          conversationId: TEST_CONVERSATION_ID,
          body: "Should stay",
          createdAt: "2024-01-01T10:00:00.000Z",
        }),
      ];

      apiMocks.getMessages.mockResolvedValue({
        data: { items: existingMessages, total: 1 },
      });

      const { result } = renderHook(() =>
        useConversationMessages(TEST_CONVERSATION_ID),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const deletePayload = {
        messageId: "msg-1",
        conversationId: "conv-different-999",
        status: "deleted",
      };

      act(() => {
        result.current.deleteFromRealtime(deletePayload);
      });

      // Message should remain unchanged
      expect(result.current.messages[0].body).toBe("Should stay");
      expect(result.current.messages[0].status).toBe("sent");
    });
  });

  describe("backend read receipt contract", () => {
    it("updates only messages named by a conversation read event", async () => {
      apiMocks.getMessages.mockResolvedValue({
        data: {
          items: [
            createMessage({
              id: "msg-1",
              conversationId: TEST_CONVERSATION_ID,
              readCount: 0,
            }),
            createMessage({
              id: "msg-2",
              conversationId: TEST_CONVERSATION_ID,
              readCount: 4,
            }),
          ],
          total: 2,
        },
      });
      const { result } = renderHook(() =>
        useConversationMessages(TEST_CONVERSATION_ID),
      );
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => {
        result.current.patchReadFromRealtime({
          conversationId: TEST_CONVERSATION_ID,
          readerId: "reader-1",
          markedCount: 1,
          messages: [{ messageId: "msg-1", readCount: 3 }],
        });
      });

      expect(result.current.messages[0]).toEqual(
        expect.objectContaining({
          readCount: 3,
          readByUserIds: ["reader-1"],
        }),
      );
      expect(result.current.messages[1].readCount).toBe(4);
    });
  });

  // ─── Property 15: Composer Action Correctness (send) ────────────────────

  describe("Property 15: send produces optimistic message in list", () => {
    it("adds an optimistic pending message to the list immediately on send", async () => {
      const { result } = renderHook(() =>
        useConversationMessages(TEST_CONVERSATION_ID),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Use a never-resolving promise to keep the message in pending state
      apiMocks.sendMessage.mockReturnValue(new Promise(() => {}));

      act(() => {
        void result.current.send("Hello world");
      });

      // The optimistic message should appear immediately
      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].body).toBe("Hello world");
      expect(result.current.messages[0].deliveryStatus).toBe("pending");
      expect(result.current.messages[0].senderId).toBe(TEST_USER_ID);
      expect(result.current.messages[0].conversationId).toBe(
        TEST_CONVERSATION_ID,
      );
    });

    it("updates optimistic message to sent status after server confirms", async () => {
      const serverResponse = {
        data: {
          id: "msg-server-confirmed",
          conversationId: TEST_CONVERSATION_ID,
          senderId: TEST_USER_ID,
          body: "Hello world",
          type: "text",
          status: "sent",
          createdAt: new Date().toISOString(),
        },
      };
      apiMocks.sendMessage.mockResolvedValue(serverResponse);

      const { result } = renderHook(() =>
        useConversationMessages(TEST_CONVERSATION_ID),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.send("Hello world");
      });

      // After server confirms, message should be in sent state
      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].body).toBe("Hello world");
      expect(result.current.messages[0].deliveryStatus).toBe("sent");
    });

    it("does not send empty or whitespace-only messages", async () => {
      const { result } = renderHook(() =>
        useConversationMessages(TEST_CONVERSATION_ID),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        const returnedId = await result.current.send("   ");
        expect(returnedId).toBeUndefined();
      });

      expect(result.current.messages).toHaveLength(0);
      expect(apiMocks.sendMessage).not.toHaveBeenCalled();
    });

    it("calls sendMessage API with correct conversation ID and body", async () => {
      apiMocks.sendMessage.mockResolvedValue({
        data: {
          id: "msg-server-001",
          conversationId: TEST_CONVERSATION_ID,
          senderId: TEST_USER_ID,
          body: "Test message",
          type: "text",
          status: "sent",
          createdAt: new Date().toISOString(),
        },
      });

      const { result } = renderHook(() =>
        useConversationMessages(TEST_CONVERSATION_ID),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.send("Test message");
      });

      expect(apiMocks.sendMessage).toHaveBeenCalledWith(
        TEST_CONVERSATION_ID,
        expect.objectContaining({
          body: "Test message",
          type: "text",
          clientMessageId: expect.any(String),
        }),
      );
    });

    it("uploads a recorded voice file and sends it as one backend media message", async () => {
      const voiceFile = new File(["voice"], "voice-note.webm", {
        type: "audio/webm",
      });
      apiMocks.sendMessage.mockResolvedValue({
        data: {
          id: "msg-voice-001",
          conversationId: TEST_CONVERSATION_ID,
          senderId: TEST_USER_ID,
          body: "Voice message",
          type: "audio",
          status: "sent",
          createdAt: new Date().toISOString(),
          attachments: [
            {
              attachmentId: "attachment-voice-001",
              fileId: "file-voice-001",
              displayName: "voice-note.webm",
              mimeType: "audio/webm",
              mediaKind: "audio",
              downloadPath: "/api/v1/files/file-voice-001/download",
            },
          ],
        },
      });

      const { result } = renderHook(() =>
        useConversationMessages(TEST_CONVERSATION_ID),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.sendMedia({
          type: "voice",
          files: [voiceFile],
          caption: "Voice message",
        });
      });

      expect(filesApiMocks.uploadFile).toHaveBeenCalledTimes(1);
      expect(filesApiMocks.uploadFile).toHaveBeenCalledWith(voiceFile);
      expect(apiMocks.sendMessage).toHaveBeenCalledWith(
        TEST_CONVERSATION_ID,
        expect.objectContaining({
          type: "voice",
          caption: "Voice message",
          body: "Voice message",
          attachments: [
            {
              fileId: "file-voice-001",
              mediaKind: "audio",
              caption: "Voice message",
              sortOrder: 0,
            },
          ],
          clientMessageId: expect.any(String),
        }),
      );
      expect(result.current.messages[0]).toEqual(
        expect.objectContaining({
          id: "msg-voice-001",
          deliveryStatus: "sent",
          type: "audio",
        }),
      );
    });

    it("marks message as failed when sendMessage API throws", async () => {
      apiMocks.sendMessage.mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() =>
        useConversationMessages(TEST_CONVERSATION_ID),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        try {
          await result.current.send("Will fail");
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].deliveryStatus).toBe("failed");
      expect(result.current.error).toBe("Network error");
    });

    it("always sorts pending messages after non-pending messages even if pending message has an older client timestamp", async () => {
      // Mock API to return one successfully sent message with a server timestamp
      const serverMessage = createMessage({
        id: "msg-server-old",
        conversationId: TEST_CONVERSATION_ID,
        senderId: TEST_USER_ID,
        body: "Message 1 (already sent)",
        createdAt: "2026-06-27T12:00:00.300Z", // Server timestamp (newer)
        deliveryStatus: "sent",
      });

      apiMocks.getMessages.mockResolvedValue({
        data: { items: [serverMessage], total: 1 },
      });

      const { result } = renderHook(() =>
        useConversationMessages(TEST_CONVERSATION_ID),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.messages).toHaveLength(1);

      // Mock Date to return an older client timestamp when the pending message is created
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-06-27T12:00:00.100Z")); // Older time

      // Mock sendMessage to not resolve so it stays in "pending" status
      apiMocks.sendMessage.mockReturnValue(new Promise(() => {}));

      // Send a new message — this creates a pending message
      act(() => {
        void result.current.send("Message 2 (pending)");
      });

      // The pending message (Message 2) should be sorted after the sent message (Message 1)
      expect(result.current.messages).toHaveLength(2);
      expect(result.current.messages[0].id).toBe("msg-server-old");
      expect(result.current.messages[1].deliveryStatus).toBe("pending");

      vi.useRealTimers();
    });
  });
});
