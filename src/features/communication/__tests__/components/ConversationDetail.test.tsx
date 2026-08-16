/**
 * Tests for ConversationDetail component.
 *
 * Validates:
 * - Property 1: Error-Free Rendering — all hooks initialize without throwing (Requirements 1.5)
 * - Property 3: Tab Switch Does Not Re-Fetch Loaded Data (Requirements 2.5)
 * - Property 17: ReadOnlyComposer for Restricted Users (Requirements 6.5)
 * - Property 21: Permission-Based Action Visibility (Requirements 8.2, 8.3)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import {
  createConversation,
  createMessage,
  createParticipant,
} from "../utils/test-data-generators";

// ─── Hoisted Mocks ──────────────────────────────────────────────────────────

const useConversationMock = vi.hoisted(() => vi.fn());
const useConversationMessagesMock = vi.hoisted(() => vi.fn());
const useConversationParticipantsMock = vi.hoisted(() => vi.fn());
const useConversationInvitesMock = vi.hoisted(() => vi.fn());
const useConversationJoinRequestsMock = vi.hoisted(() => vi.fn());
const useConversationRealtimeMock = vi.hoisted(() => vi.fn());
const usePresenceMock = vi.hoisted(() => vi.fn());
const useTypingIndicatorMock = vi.hoisted(() => vi.fn());
const useMessageReactionsMock = vi.hoisted(() => vi.fn());
const useMessageAttachmentsMock = vi.hoisted(() => vi.fn());
const useCommunicationPolicyMock = vi.hoisted(() => vi.fn());
const useAuthMock = vi.hoisted(() => vi.fn());
const hasPermissionMock = vi.hoisted(() => vi.fn());
const markConversationReadMock = vi.hoisted(() => vi.fn());
const archiveConversationMock = vi.hoisted(() => vi.fn());
const closeConversationMock = vi.hoisted(() => vi.fn());
const getMessageInfoMock = vi.hoisted(() => vi.fn());
const refreshConversationMock = vi.hoisted(() => vi.fn());
const refreshMessagesMock = vi.hoisted(() => vi.fn());
const refreshParticipantsMock = vi.hoisted(() => vi.fn());
const refreshReactionsMock = vi.hoisted(() => vi.fn());
const refreshAttachmentsMock = vi.hoisted(() => vi.fn());

// ─── Module Mocks ───────────────────────────────────────────────────────────

vi.mock("@/features/communication/hooks/useConversation", () => ({
  useConversation: useConversationMock,
}));

vi.mock("@/features/communication/hooks/useConversationMessages", () => ({
  useConversationMessages: useConversationMessagesMock,
}));

vi.mock("@/features/communication/hooks/useConversationParticipants", () => ({
  useConversationParticipants: useConversationParticipantsMock,
}));

vi.mock("@/features/communication/hooks/useConversationInvites", () => ({
  useConversationInvites: useConversationInvitesMock,
}));

vi.mock("@/features/communication/hooks/useConversationJoinRequests", () => ({
  useConversationJoinRequests: useConversationJoinRequestsMock,
}));

vi.mock("@/features/communication/hooks/useConversationRealtime", () => ({
  useConversationRealtime: useConversationRealtimeMock,
}));

vi.mock("@/features/communication/hooks/usePresence", () => ({
  usePresence: usePresenceMock,
}));

vi.mock("@/features/communication/hooks/useTypingIndicator", () => ({
  useTypingIndicator: useTypingIndicatorMock,
}));

vi.mock("@/features/communication/hooks/useMessageReactions", () => ({
  useMessageReactions: useMessageReactionsMock,
}));

vi.mock("@/features/communication/hooks/useMessageAttachments", () => ({
  useMessageAttachments: useMessageAttachmentsMock,
}));

vi.mock("@/features/communication/hooks/useCommunicationPolicy", () => ({
  useCommunicationPolicy: useCommunicationPolicyMock,
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: useAuthMock,
}));

// ─── Module Mocks ───────────────────────────────────────────────────────────

vi.mock("@/features/communication/hooks/useConversation", () => ({
  useConversation: useConversationMock,
}));

vi.mock("@/features/communication/hooks/useConversationMessages", () => ({
  useConversationMessages: useConversationMessagesMock,
}));

vi.mock("@/features/communication/hooks/useConversationParticipants", () => ({
  useConversationParticipants: useConversationParticipantsMock,
}));

vi.mock("@/features/communication/hooks/useConversationInvites", () => ({
  useConversationInvites: useConversationInvitesMock,
}));

vi.mock("@/features/communication/hooks/useConversationJoinRequests", () => ({
  useConversationJoinRequests: useConversationJoinRequestsMock,
}));

vi.mock("@/features/communication/hooks/useConversationRealtime", () => ({
  useConversationRealtime: useConversationRealtimeMock,
}));

vi.mock("@/features/communication/hooks/usePresence", () => ({
  usePresence: usePresenceMock,
}));

vi.mock("@/features/communication/hooks/useTypingIndicator", () => ({
  useTypingIndicator: useTypingIndicatorMock,
}));

vi.mock("@/features/communication/hooks/useMessageReactions", () => ({
  useMessageReactions: useMessageReactionsMock,
}));

vi.mock("@/features/communication/hooks/useMessageAttachments", () => ({
  useMessageAttachments: useMessageAttachmentsMock,
}));

vi.mock("@/features/communication/hooks/useCommunicationPolicy", () => ({
  useCommunicationPolicy: useCommunicationPolicyMock,
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: useAuthMock,
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    hasPermission: hasPermissionMock,
  }),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/features/communication/api/communication.service", () => ({
  markConversationRead: markConversationReadMock,
  archiveConversation: archiveConversationMock,
  closeConversation: closeConversationMock,
  createMessageReport: vi.fn(),
  getMessageInfo: getMessageInfoMock,
  reopenConversation: vi.fn(),
  updateConversation: vi.fn(),
}));

// Mock child components to isolate ConversationDetail logic
vi.mock(
  "@/features/communication/conversations_redesign/components/ConversationHeader",
  () => ({
    default: ({
      onArchive,
      onClose,
    }: {
      onArchive?: () => void;
      onClose?: () => void;
    }) => (
      <div data-testid="conversation-header">
        Header
        {onArchive && (
          <button data-testid="header-archive-btn" onClick={onArchive}>
            Archive
          </button>
        )}
        {onClose && (
          <button data-testid="header-close-btn" onClick={onClose}>
            Close
          </button>
        )}
      </div>
    ),
  }),
);

vi.mock(
  "@/features/communication/conversations_redesign/components/ConversationTabs",
  () => ({
    default: ({ onTabChange }: { onTabChange: (tab: string) => void }) => (
      <div data-testid="conversation-tabs">
        <button
          data-testid="tab-messages"
          onClick={() => onTabChange("messages")}
        >
          Messages
        </button>
        <button
          data-testid="tab-participants"
          onClick={() => onTabChange("participants")}
        >
          Participants
        </button>
        <button
          data-testid="tab-invites"
          onClick={() => onTabChange("invites")}
        >
          Invites
        </button>
        <button
          data-testid="tab-joinRequests"
          onClick={() => onTabChange("joinRequests")}
        >
          Join Requests
        </button>
      </div>
    ),
  }),
);

vi.mock(
  "@/features/communication/conversations_redesign/components/MessagesPanel",
  () => ({
    MessagesPanel: ({
      messages,
      onDeleteMessage,
      onInfo,
    }: {
      messages?: Array<{ id: string }>;
      onDeleteMessage?: (messageId: string) => Promise<unknown>;
      onInfo?: (messageId: string) => Promise<unknown>;
    }) => (
      <div data-testid="messages-panel">
        MessagesPanel
        {messages?.map((message) => (
          <div key={message.id}>
            <button
              data-testid={`delete-message-${message.id}`}
              onClick={() => void onDeleteMessage?.(message.id)}
            >
              Delete message
            </button>
            <button
              data-testid={`message-info-${message.id}`}
              onClick={() => void onInfo?.(message.id)}
            >
              Message info
            </button>
          </div>
        ))}
      </div>
    ),
    MessageComposer: ({
      onSendWithAttachment,
    }: {
      onSendWithAttachment?: (
        files: File[],
        caption: string,
      ) => Promise<unknown>;
    }) => (
      <div data-testid="message-composer">
        MessageComposer
        <button
          data-testid="send-image-attachment"
          onClick={() =>
            void onSendWithAttachment?.(
              [new File(["image"], "photo.png", { type: "image/png" })],
              "Photo caption",
            )
          }
        >
          Send image
        </button>
      </div>
    ),
    ReadOnlyComposer: ({
      labels,
    }: {
      labels: { readOnlyComposer: string };
    }) => <div data-testid="read-only-composer">{labels.readOnlyComposer}</div>,
  }),
);

vi.mock(
  "@/features/communication/conversations_redesign/components/ParticipantsPanel",
  () => ({
    default: ({
      canManage,
      canLeaveConversation,
      participants,
      userDisplayNames,
    }: {
      canManage: boolean;
      canLeaveConversation: boolean;
      participants?: Array<{
        id: string;
        userId?: string;
        actor?: {
          id?: string;
          userId?: string;
        };
      }>;
      userDisplayNames?: Record<string, string>;
    }) => (
      <div data-testid="participants-panel">
        {canManage && <button data-testid="add-participant-btn">Add</button>}
        {canManage && <button data-testid="promote-btn">Promote</button>}
        {canManage && <button data-testid="demote-btn">Demote</button>}
        {canManage && <button data-testid="remove-btn">Remove</button>}
        {canLeaveConversation && <button data-testid="leave-btn">Leave</button>}
        <ul data-testid="participants-list">
          {participants?.map((p) => {
            const userId = p.userId ?? p.actor?.userId ?? p.actor?.id;
            const displayName = userDisplayNames?.[userId] || "Unknown";
            return (
              <li key={p.id} data-testid={`participant-${p.id}`}>
                {displayName}
              </li>
            );
          })}
        </ul>
      </div>
    ),
  }),
);

vi.mock(
  "@/features/communication/conversations_redesign/components/InvitesPanel",
  () => ({
    default: () => <div data-testid="invites-panel">InvitesPanel</div>,
  }),
);

vi.mock(
  "@/features/communication/conversations_redesign/components/JoinRequestsPanel",
  () => ({
    default: () => (
      <div data-testid="join-requests-panel">JoinRequestsPanel</div>
    ),
  }),
);

vi.mock(
  "@/features/communication/conversations_redesign/components/EditConversationDialog",
  () => ({
    default: () => null,
  }),
);

vi.mock(
  "@/features/communication/components/conversations/AddParticipantDialog",
  () => ({
    default: () => null,
  }),
);

vi.mock(
  "@/features/communication/components/conversations/EditParticipantRoleDialog",
  () => ({
    default: () => null,
  }),
);

vi.mock(
  "@/features/communication/components/conversations/RemoveParticipantDialog",
  () => ({
    default: () => null,
  }),
);

vi.mock(
  "@/features/communication/components/conversations/LeaveConversationDialog",
  () => ({
    default: () => null,
  }),
);

vi.mock(
  "@/features/communication/components/conversations/CreateInviteDialog",
  () => ({
    default: () => null,
  }),
);

vi.mock(
  "@/features/communication/components/conversations/CreateJoinRequestDialog",
  () => ({
    default: () => null,
  }),
);

vi.mock(
  "@/features/communication/components/conversations/RejectInviteDialog",
  () => ({
    default: () => null,
  }),
);

vi.mock(
  "@/features/communication/components/conversations/ReviewJoinRequestDialog",
  () => ({
    default: () => null,
  }),
);

// ─── Import Component Under Test ────────────────────────────────────────────

import ConversationDetail from "@/features/communication/conversations_redesign/components/ConversationDetail";
import { conversationRedesignLabels } from "@/features/communication/conversations_redesign/labels";

// ─── Test Setup ─────────────────────────────────────────────────────────────

const TEST_CONVERSATION_ID = "conv-test-001";
const TEST_USER_ID = "user-test-001";
const labels = conversationRedesignLabels.en;

function setupDefaultMocks() {
  const conversation = createConversation({
    id: TEST_CONVERSATION_ID,
    status: "active",
  });

  useAuthMock.mockReturnValue({
    user: { id: TEST_USER_ID, firstName: "Test", lastName: "User" },
    isAuthenticated: true,
  });

  useConversationMock.mockReturnValue({
    conversation,
    isLoading: false,
    error: null,
    refresh: refreshConversationMock,
  });

  useConversationMessagesMock.mockReturnValue({
    messages: [],
    isLoading: false,
    isLoadingOlder: false,
    isMutating: false,
    hasOlderMessages: false,
    error: null,
    send: vi.fn(),
    sendMedia: vi.fn(),
    edit: vi.fn(),
    remove: vi.fn(),
    loadOlderMessages: vi.fn(),
    refresh: refreshMessagesMock,
    upsertFromRealtime: vi.fn(),
    deleteFromRealtime: vi.fn(),
    patchFromRealtime: vi.fn(),
    patchReadFromRealtime: vi.fn(),
  });

  useConversationParticipantsMock.mockReturnValue({
    participants: [
      createParticipant({
        userId: TEST_USER_ID,
        role: "member",
        status: "active",
        actor: { id: TEST_USER_ID, name: "Test User" },
      }),
    ],
    isLoading: false,
    isMutating: false,
    total: 1,
    error: null,
    refresh: refreshParticipantsMock,
    add: vi.fn(),
    update: vi.fn(),
    promote: vi.fn(),
    demote: vi.fn(),
    remove: vi.fn(),
    leave: vi.fn(),
  });

  useConversationInvitesMock.mockReturnValue({
    invites: [],
    isLoading: false,
    isMutating: false,
    total: 0,
    error: null,
    refresh: vi.fn(),
    create: vi.fn(),
    accept: vi.fn(),
    reject: vi.fn(),
  });

  useConversationJoinRequestsMock.mockReturnValue({
    joinRequests: [],
    isLoading: false,
    isMutating: false,
    total: 0,
    error: null,
    refresh: vi.fn(),
    create: vi.fn(),
    approve: vi.fn(),
    reject: vi.fn(),
  });

  useConversationRealtimeMock.mockImplementation(() => undefined);

  usePresenceMock.mockReturnValue({
    presenceByUserId: {},
    handlePresenceUpdated: vi.fn(),
  });

  useTypingIndicatorMock.mockReturnValue({
    typingUsers: [],
    emitTyping: vi.fn(),
    stopOwnTyping: vi.fn(),
    handleTypingStarted: vi.fn(),
    handleTypingStopped: vi.fn(),
  });

  useMessageReactionsMock.mockReturnValue({
    reactionsByMessageId: {},
    addReaction: vi.fn(),
    removeMyReaction: vi.fn(),
    refreshAll: refreshReactionsMock,
  });

  useMessageAttachmentsMock.mockReturnValue({
    attachmentsByMessageId: {},
    attachFile: vi.fn(),
    removeAttachment: vi.fn(),
    refreshAll: refreshAttachmentsMock,
    uploadingMessageId: null,
  });

  useCommunicationPolicyMock.mockReturnValue({
    policy: {
      isEnabled: true,
      allowReactions: true,
      allowAttachments: true,
      maxMessageLength: 2000,
      maxAttachmentSizeMb: 10,
    },
    isLoading: false,
  });

  markConversationReadMock.mockResolvedValue({});
}

function renderConversationDetail(onToast = vi.fn()) {
  return render(
    <ConversationDetail
      conversationId={TEST_CONVERSATION_ID}
      labels={labels}
      onBack={vi.fn()}
      onToast={onToast}
    />,
  );
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("ConversationDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hasPermissionMock.mockReturnValue(true);
    setupDefaultMocks();
  });

  // ─── Property 1: Error-Free Rendering ───────────────────────────────────

  describe("Property 1: All hooks initialize without throwing", () => {
    /**
     * Validates: Requirements 1.5
     * WHEN the ConversationDetail component mounts with a valid conversation ID,
     * all 8+ hooks SHALL initialize without throwing exceptions.
     */
    it("renders without throwing when all hooks return valid default state", () => {
      expect(() => renderConversationDetail()).not.toThrow();
    });

    it("renders the conversation header and tabs", () => {
      renderConversationDetail();
      expect(screen.getByTestId("conversation-header")).toBeInTheDocument();
      expect(screen.getByTestId("conversation-tabs")).toBeInTheDocument();
    });

    it("renders the messages panel by default", () => {
      renderConversationDetail();
      expect(screen.getByTestId("messages-panel")).toBeInTheDocument();
    });

    it("calls all hooks with the correct conversation ID", () => {
      renderConversationDetail();
      expect(useConversationMock).toHaveBeenCalledWith(TEST_CONVERSATION_ID);
      expect(useConversationMessagesMock).toHaveBeenCalledWith(
        TEST_CONVERSATION_ID,
      );
      expect(useTypingIndicatorMock).toHaveBeenCalledWith(TEST_CONVERSATION_ID);
    });

    it("handles reaction realtime events without refreshing reactions or attachments", () => {
      renderConversationDetail();

      const realtimeOptions =
        useConversationRealtimeMock.mock.calls.at(-1)?.[0];
      expect(realtimeOptions?.onReactionUpserted).toEqual(expect.any(Function));
      expect(realtimeOptions?.onReactionDeleted).toEqual(expect.any(Function));

      realtimeOptions.onReactionUpserted({
        conversationId: TEST_CONVERSATION_ID,
      });
      realtimeOptions.onReactionDeleted({
        conversationId: TEST_CONVERSATION_ID,
      });

      expect(refreshReactionsMock).not.toHaveBeenCalled();
      expect(refreshAttachmentsMock).not.toHaveBeenCalled();
    });

    it("avoids static conversation reloads after an image-send realtime resync", () => {
      // Regression: a socket resync after media upload must not refetch conversation metadata.
      renderConversationDetail();

      const realtimeOptions =
        useConversationRealtimeMock.mock.calls.at(-1)?.[0];
      expect(realtimeOptions?.onReconnect).toEqual(expect.any(Function));

      realtimeOptions.onReconnect();

      expect(refreshMessagesMock).toHaveBeenCalledTimes(1);
      expect(refreshReactionsMock).toHaveBeenCalledTimes(1);
      expect(refreshAttachmentsMock).not.toHaveBeenCalled();
      expect(refreshConversationMock).not.toHaveBeenCalled();
      expect(refreshParticipantsMock).not.toHaveBeenCalled();
    });

    it("does not resync while an image message is being sent", () => {
      const currentMessagesState = useConversationMessagesMock();
      useConversationMessagesMock.mockReturnValue({
        ...currentMessagesState,
        isMutating: true,
      });
      renderConversationDetail();

      const realtimeOptions =
        useConversationRealtimeMock.mock.calls.at(-1)?.[0];
      realtimeOptions.onReconnect();

      expect(refreshMessagesMock).not.toHaveBeenCalled();
      expect(refreshReactionsMock).not.toHaveBeenCalled();
    });

    it("deletes a message through the message endpoint workflow", async () => {
      const removeMessageMock = vi.fn().mockResolvedValue(undefined);
      useConversationMessagesMock.mockReturnValue({
        messages: [
          createMessage({
            id: "message-1",
            conversationId: TEST_CONVERSATION_ID,
            senderId: TEST_USER_ID,
            body: "Message with attachment",
          }),
        ],
        isLoading: false,
        isLoadingOlder: false,
        isMutating: false,
        hasOlderMessages: false,
        error: null,
        send: vi.fn(),
        edit: vi.fn(),
        remove: removeMessageMock,
        loadOlderMessages: vi.fn(),
        refresh: vi.fn(),
        upsertFromRealtime: vi.fn(),
        deleteFromRealtime: vi.fn(),
        patchFromRealtime: vi.fn(),
        patchReadFromRealtime: vi.fn(),
      });

      renderConversationDetail();

      fireEvent.click(screen.getByTestId("delete-message-message-1"));

      await waitFor(() => {
        expect(removeMessageMock).toHaveBeenCalledWith("message-1");
      });
    });

    it("shows the message details and a useful empty-reader state", async () => {
      const message = createMessage({
        id: "message-1",
        conversationId: TEST_CONVERSATION_ID,
        senderId: TEST_USER_ID,
      });
      useConversationMessagesMock.mockReturnValue({
        messages: [message],
        isLoading: false,
        isLoadingOlder: false,
        isMutating: false,
        hasOlderMessages: false,
        error: null,
        send: vi.fn(),
        sendMedia: vi.fn(),
        edit: vi.fn(),
        remove: vi.fn(),
        loadOlderMessages: vi.fn(),
        refresh: vi.fn(),
        upsertFromRealtime: vi.fn(),
        deleteFromRealtime: vi.fn(),
        patchFromRealtime: vi.fn(),
        patchReadFromRealtime: vi.fn(),
      });
      getMessageInfoMock.mockResolvedValue({
        message: {
          messageId: "message-1",
          conversationId: TEST_CONVERSATION_ID,
          sender: {
            userId: TEST_USER_ID,
            displayName: "Demo Admin",
            userType: "school_user",
            isMe: true,
          },
          type: "text",
          status: "sent",
          body: "sgfsgsfg",
          content: "sgfsgsfg",
          createdAt: "2026-07-26T14:54:38.098Z",
          readCount: 0,
        },
        readers: [],
        readCount: 0,
        participantsCount: 2,
        fullyRead: false,
        pagination: {
          page: 1,
          limit: 50,
          total: 0,
        },
      });
      const onToast = vi.fn();

      renderConversationDetail(onToast);
      fireEvent.click(screen.getByTestId("message-info-message-1"));

      const dialog = await screen.findByRole("dialog", {
        name: labels.messageDetails,
      });
      expect(dialog).toHaveTextContent("Demo Admin");
      expect(dialog).toHaveTextContent(labels.you);
      expect(dialog).toHaveTextContent(labels.userType_school_user);
      expect(dialog).toHaveTextContent("sgfsgsfg");
      expect(dialog).toHaveTextContent("0/1");
      expect(dialog).toHaveTextContent(labels.messageInfoNotRead);
      expect(dialog).toHaveTextContent(labels.messageInfoNoReaders);
      expect(onToast).not.toHaveBeenCalled();
    });

    it("sends an attachment in the message creation payload", async () => {
      const sendMedia = vi.fn().mockResolvedValue("message-1");
      useConversationMessagesMock.mockReturnValue({
        messages: [],
        isLoading: false,
        isLoadingOlder: false,
        isMutating: false,
        hasOlderMessages: false,
        error: null,
        send: vi.fn(),
        sendMedia,
        edit: vi.fn(),
        remove: vi.fn(),
        loadOlderMessages: vi.fn(),
        refresh: vi.fn(),
        upsertFromRealtime: vi.fn(),
        deleteFromRealtime: vi.fn(),
        patchFromRealtime: vi.fn(),
        patchReadFromRealtime: vi.fn(),
      });

      renderConversationDetail();
      fireEvent.click(screen.getByTestId("send-image-attachment"));

      await waitFor(() => {
        expect(sendMedia).toHaveBeenCalledWith({
          type: "image",
          files: [expect.any(File)],
          caption: "Photo caption",
        });
      });
    });

    it("renders full-component loading spinner and blocks rendering of other elements when conversation loading is true", () => {
      useConversationMock.mockReturnValue({
        conversation: null,
        isLoading: true,
        error: null,
        refresh: vi.fn(),
      });
      renderConversationDetail();
      expect(
        screen.getByTestId("conversation-loading-spinner"),
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId("conversation-header"),
      ).not.toBeInTheDocument();
      expect(screen.queryByTestId("conversation-tabs")).not.toBeInTheDocument();
      expect(screen.queryByTestId("messages-panel")).not.toBeInTheDocument();
    });

    it("renders full-component loading spinner and blocks rendering of other elements when participants loading is true", () => {
      useConversationParticipantsMock.mockReturnValue({
        participants: [],
        isLoading: true,
        isMutating: false,
        total: 0,
        error: null,
        refresh: vi.fn(),
      });
      renderConversationDetail();
      expect(
        screen.getByTestId("conversation-loading-spinner"),
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId("conversation-header"),
      ).not.toBeInTheDocument();
    });

    it("renders full-component loading spinner and blocks rendering of other elements when messages loading is true", () => {
      useConversationMessagesMock.mockReturnValue({
        messages: [],
        isLoading: true,
        isLoadingOlder: false,
        isMutating: false,
        hasOlderMessages: false,
        error: null,
        send: vi.fn(),
        edit: vi.fn(),
        remove: vi.fn(),
        loadOlderMessages: vi.fn(),
        refresh: vi.fn(),
      });
      renderConversationDetail();
      expect(
        screen.getByTestId("conversation-loading-spinner"),
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId("conversation-header"),
      ).not.toBeInTheDocument();
    });

    it("renders full-component loading spinner and blocks rendering of other elements when policy loading is true", () => {
      useCommunicationPolicyMock.mockReturnValue({
        policy: null,
        isLoading: true,
      });
      renderConversationDetail();
      expect(
        screen.getByTestId("conversation-loading-spinner"),
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId("conversation-header"),
      ).not.toBeInTheDocument();
    });

    it("waits for window focus before marking an incoming message as read", async () => {
      const hasFocus = vi.spyOn(document, "hasFocus").mockReturnValue(false);
      useConversationMessagesMock.mockReturnValue({
        ...useConversationMessagesMock(),
        messages: [
          {
            id: "incoming-message",
            senderId: "another-user",
            body: "Hello",
            createdAt: new Date().toISOString(),
          },
        ],
      });

      renderConversationDetail();
      expect(markConversationReadMock).not.toHaveBeenCalled();

      hasFocus.mockReturnValue(true);
      fireEvent.focus(window);

      await waitFor(() => {
        expect(markConversationReadMock).toHaveBeenCalledWith(
          TEST_CONVERSATION_ID,
        );
      });
      hasFocus.mockRestore();
    });
  });

  // ─── Property 3: Tab Switch Does Not Re-Fetch Loaded Data ──────────────

  describe("Property 3: Tab switch does not re-fetch previously loaded data", () => {
    /**
     * Validates: Requirements 2.5
     * For any sequence of tab switches, switching back to a previously loaded tab
     * SHALL not trigger a new API fetch for that tab's data.
     */
    beforeEach(() => {
      useConversationParticipantsMock.mockReturnValue({
        participants: [
          createParticipant({
            userId: TEST_USER_ID,
            role: "admin",
            status: "active",
            actor: { id: TEST_USER_ID, name: "Test User" },
          }),
        ],
        isLoading: false,
        isMutating: false,
        total: 1,
        error: null,
        refresh: vi.fn(),
        add: vi.fn(),
        update: vi.fn(),
        promote: vi.fn(),
        demote: vi.fn(),
        remove: vi.fn(),
        leave: vi.fn(),
      });
    });

    it("does not re-call useConversationParticipants with enabled:true when switching back to participants", () => {
      renderConversationDetail();

      // Switch to participants tab (first load)
      fireEvent.click(screen.getByTestId("tab-participants"));

      const callsAfterFirstSwitch =
        useConversationParticipantsMock.mock.calls.length;

      // Switch to messages tab
      fireEvent.click(screen.getByTestId("tab-messages"));

      // Switch back to participants tab
      fireEvent.click(screen.getByTestId("tab-participants"));

      // The hook is called on every render (React behavior), but the `enabled` flag
      // should remain true after first load — it should NOT reset to false and back to true
      const allCalls = useConversationParticipantsMock.mock.calls;
      const callsAfterReturn = allCalls.slice(callsAfterFirstSwitch);

      // All subsequent calls should have enabled: true (data stays loaded, no re-fetch trigger)
      for (const call of callsAfterReturn) {
        const options = call[1];
        expect(options?.enabled).toBe(true);
      }
    });

    it("does not re-call useConversationInvites with enabled:true toggling when switching back to invites", () => {
      renderConversationDetail();

      // Switch to invites tab (first load)
      fireEvent.click(screen.getByTestId("tab-invites"));

      // Switch to messages tab
      fireEvent.click(screen.getByTestId("tab-messages"));

      // Switch back to invites tab
      fireEvent.click(screen.getByTestId("tab-invites"));

      // After first load, enabled should stay true (loadedTabs.invites remains true)
      const allCalls = useConversationInvitesMock.mock.calls;
      // Find the first call where enabled is true
      const firstEnabledIndex = allCalls.findIndex(
        (call: unknown[]) =>
          (call[1] as { enabled?: boolean })?.enabled === true,
      );
      // All calls after that should also have enabled: true (no toggling back to false)
      const callsAfterEnabled = allCalls.slice(firstEnabledIndex);
      for (const call of callsAfterEnabled) {
        const options = call[1];
        expect(options?.enabled).toBe(true);
      }
    });

    it("loadedTabs persists across tab switches — joinRequests stays loaded", () => {
      renderConversationDetail();

      // Switch to joinRequests tab
      fireEvent.click(screen.getByTestId("tab-joinRequests"));

      // Switch away
      fireEvent.click(screen.getByTestId("tab-messages"));

      // Switch back
      fireEvent.click(screen.getByTestId("tab-joinRequests"));

      // After first load, enabled should stay true
      const allCalls = useConversationJoinRequestsMock.mock.calls;
      const firstEnabledIndex = allCalls.findIndex(
        (call: unknown[]) =>
          (call[1] as { enabled?: boolean })?.enabled === true,
      );
      const callsAfterEnabled = allCalls.slice(firstEnabledIndex);
      for (const call of callsAfterEnabled) {
        const options = call[1];
        expect(options?.enabled).toBe(true);
      }
    });
  });

  // ─── Property 17: ReadOnlyComposer for Restricted Users ────────────────

  describe("Property 17: ReadOnlyComposer shown when conversation is read-only or user is restricted", () => {
    /**
     * Validates: Requirements 6.5
     * For any conversation state where the conversation is read-only OR the current
     * user's participant status is muted, blocked, or removed, the ReadOnlyComposer
     * SHALL be rendered instead of the MessageComposer.
     */
    it("shows restriction banner when conversation status is closed (read-only)", () => {
      useConversationMock.mockReturnValue({
        conversation: createConversation({
          id: TEST_CONVERSATION_ID,
          status: "closed",
        }),
        isLoading: false,
        error: null,
        refresh: vi.fn(),
      });

      renderConversationDetail();
      expect(screen.getByText(labels.bannerClosed)).toBeInTheDocument();
      expect(
        screen.queryByTestId("read-only-composer"),
      ).not.toBeInTheDocument();
      expect(screen.queryByTestId("message-composer")).not.toBeInTheDocument();
    });

    it("shows restriction banner when conversation has isReadOnly flag", () => {
      const readOnlyConversation = createConversation({
        id: TEST_CONVERSATION_ID,
        status: "active",
      });
      // Add isReadOnly flag (not in base type but checked via record cast)
      (readOnlyConversation as Record<string, unknown>).isReadOnly = true;

      useConversationMock.mockReturnValue({
        conversation: readOnlyConversation,
        isLoading: false,
        error: null,
        refresh: vi.fn(),
      });

      renderConversationDetail();
      expect(screen.getByText(labels.bannerReadOnly)).toBeInTheDocument();
      expect(
        screen.queryByTestId("read-only-composer"),
      ).not.toBeInTheDocument();
      expect(screen.queryByTestId("message-composer")).not.toBeInTheDocument();
    });

    it("shows restriction banner when current user is muted", () => {
      useConversationParticipantsMock.mockReturnValue({
        participants: [
          createParticipant({
            userId: TEST_USER_ID,
            role: "member",
            status: "muted",
            actor: { id: TEST_USER_ID, name: "Test User" },
          }),
        ],
        isLoading: false,
        isMutating: false,
        total: 1,
        error: null,
        refresh: vi.fn(),
        add: vi.fn(),
        update: vi.fn(),
        promote: vi.fn(),
        demote: vi.fn(),
        remove: vi.fn(),
        leave: vi.fn(),
      });

      renderConversationDetail();
      expect(screen.getByText(labels.bannerMuted)).toBeInTheDocument();
      expect(
        screen.queryByTestId("read-only-composer"),
      ).not.toBeInTheDocument();
      expect(screen.queryByTestId("message-composer")).not.toBeInTheDocument();
    });

    it("shows restriction banner when current user is blocked", () => {
      useConversationParticipantsMock.mockReturnValue({
        participants: [
          createParticipant({
            userId: TEST_USER_ID,
            role: "member",
            status: "blocked",
            actor: { id: TEST_USER_ID, name: "Test User" },
          }),
        ],
        isLoading: false,
        isMutating: false,
        total: 1,
        error: null,
        refresh: vi.fn(),
        add: vi.fn(),
        update: vi.fn(),
        promote: vi.fn(),
        demote: vi.fn(),
        remove: vi.fn(),
        leave: vi.fn(),
      });

      renderConversationDetail();
      expect(screen.getByText(labels.errorUserBlocked)).toBeInTheDocument();
      expect(
        screen.queryByTestId("read-only-composer"),
      ).not.toBeInTheDocument();
      expect(screen.queryByTestId("message-composer")).not.toBeInTheDocument();
    });

    it("shows non-participant banner when current user is removed", () => {
      useConversationParticipantsMock.mockReturnValue({
        participants: [
          createParticipant({
            userId: TEST_USER_ID,
            role: "member",
            status: "removed",
            actor: { id: TEST_USER_ID, name: "Test User" },
          }),
        ],
        isLoading: false,
        isMutating: false,
        total: 1,
        error: null,
        refresh: vi.fn(),
        add: vi.fn(),
        update: vi.fn(),
        promote: vi.fn(),
        demote: vi.fn(),
        remove: vi.fn(),
        leave: vi.fn(),
      });

      renderConversationDetail();
      expect(
        screen.getByText(labels.errorConversationNotMember),
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId("read-only-composer"),
      ).not.toBeInTheDocument();
      expect(screen.queryByTestId("message-composer")).not.toBeInTheDocument();
    });

    it("shows MessageComposer when user is active and conversation is not read-only", () => {
      renderConversationDetail();
      expect(screen.getByTestId("message-composer")).toBeInTheDocument();
      expect(
        screen.queryByTestId("read-only-composer"),
      ).not.toBeInTheDocument();
    });

    it("shows the permission composer when the active participant cannot send messages", () => {
      hasPermissionMock.mockImplementation(
        (permission: string) => permission !== "communication.messages.send",
      );

      renderConversationDetail();

      expect(screen.getByText("You cannot send messages")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Your account does not have the permission required to send messages in this conversation.",
        ),
      ).toBeInTheDocument();
      expect(screen.getByText("communication.messages.send")).toBeInTheDocument();
      expect(screen.queryByTestId("read-only-composer")).not.toBeInTheDocument();
      expect(screen.queryByTestId("message-composer")).not.toBeInTheDocument();
    });

    it("shows restriction banner when communication policy is disabled", () => {
      useCommunicationPolicyMock.mockReturnValue({
        policy: {
          isEnabled: false,
          allowReactions: true,
          allowAttachments: true,
          maxMessageLength: 2000,
          maxAttachmentSizeMb: 10,
        },
      });

      renderConversationDetail();
      expect(screen.getByText(labels.errorPolicyDisabled)).toBeInTheDocument();
      expect(
        screen.queryByTestId("read-only-composer"),
      ).not.toBeInTheDocument();
      expect(screen.queryByTestId("message-composer")).not.toBeInTheDocument();
    });

    it("shows restriction banner when user is not a participant", () => {
      useConversationParticipantsMock.mockReturnValue({
        participants: [],
        isLoading: false,
        isMutating: false,
        total: 0,
        error: null,
        refresh: vi.fn(),
        add: vi.fn(),
        update: vi.fn(),
        promote: vi.fn(),
        demote: vi.fn(),
        remove: vi.fn(),
        leave: vi.fn(),
      });

      renderConversationDetail();
      expect(
        screen.getByText(labels.errorConversationNotMember),
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId("read-only-composer"),
      ).not.toBeInTheDocument();
      expect(screen.queryByTestId("message-composer")).not.toBeInTheDocument();
    });
  });

  // ─── Property 21: Permission-Based Action Visibility ───────────────────

  describe("Property 21: Permission-based action visibility in participants panel", () => {
    /**
     * Validates: Requirements 8.2, 8.3
     * For any user with management permissions (canManageParticipants: true),
     * the ParticipantsPanel SHALL render add, promote, demote, and remove actions.
     * For any user without management permissions, those actions SHALL be hidden
     * and only the leave conversation option SHALL be available.
     */
    it("shows management actions when user has admin role", () => {
      useConversationParticipantsMock.mockReturnValue({
        participants: [
          createParticipant({
            userId: TEST_USER_ID,
            role: "admin",
            status: "active",
            actor: { id: TEST_USER_ID, name: "Test User" },
          }),
          createParticipant({
            userId: "other-user-001",
            role: "member",
            status: "active",
            actor: { id: "other-user-001", name: "Other User" },
          }),
        ],
        isLoading: false,
        isMutating: false,
        total: 2,
        error: null,
        refresh: vi.fn(),
        add: vi.fn(),
        update: vi.fn(),
        promote: vi.fn(),
        demote: vi.fn(),
        remove: vi.fn(),
        leave: vi.fn(),
      });

      renderConversationDetail();

      // Switch to participants tab
      fireEvent.click(screen.getByTestId("tab-participants"));

      expect(screen.getByTestId("add-participant-btn")).toBeInTheDocument();
      expect(screen.getByTestId("promote-btn")).toBeInTheDocument();
      expect(screen.getByTestId("demote-btn")).toBeInTheDocument();
      expect(screen.getByTestId("remove-btn")).toBeInTheDocument();
    });

    it("hides management actions when the backend permission is absent", () => {
      hasPermissionMock.mockImplementation(
        (permission: string) =>
          permission !== "communication.participants.manage",
      );
      useConversationParticipantsMock.mockReturnValue({
        participants: [
          createParticipant({
            userId: TEST_USER_ID,
            role: "admin",
            status: "active",
            actor: { id: TEST_USER_ID, name: "Test User" },
          }),
        ],
        isLoading: false,
        isMutating: false,
        total: 1,
        error: null,
        refresh: vi.fn(),
        add: vi.fn(),
        update: vi.fn(),
        promote: vi.fn(),
        demote: vi.fn(),
        remove: vi.fn(),
        leave: vi.fn(),
      });

      renderConversationDetail();
      fireEvent.click(screen.getByTestId("tab-participants"));

      expect(
        screen.queryByTestId("add-participant-btn"),
      ).not.toBeInTheDocument();
      expect(screen.queryByTestId("promote-btn")).not.toBeInTheDocument();
      expect(screen.queryByTestId("demote-btn")).not.toBeInTheDocument();
      expect(screen.queryByTestId("remove-btn")).not.toBeInTheDocument();
    });

    it("shows management actions when user has owner role", () => {
      useConversationParticipantsMock.mockReturnValue({
        participants: [
          createParticipant({
            userId: TEST_USER_ID,
            role: "owner",
            status: "active",
            actor: { id: TEST_USER_ID, name: "Test User" },
          }),
          createParticipant({
            userId: "other-user-001",
            role: "member",
            status: "active",
            actor: { id: "other-user-001", name: "Other User" },
          }),
        ],
        isLoading: false,
        isMutating: false,
        total: 2,
        error: null,
        refresh: vi.fn(),
        add: vi.fn(),
        update: vi.fn(),
        promote: vi.fn(),
        demote: vi.fn(),
        remove: vi.fn(),
        leave: vi.fn(),
      });

      renderConversationDetail();
      fireEvent.click(screen.getByTestId("tab-participants"));

      expect(screen.getByTestId("add-participant-btn")).toBeInTheDocument();
      expect(screen.getByTestId("promote-btn")).toBeInTheDocument();
      expect(screen.getByTestId("demote-btn")).toBeInTheDocument();
      expect(screen.getByTestId("remove-btn")).toBeInTheDocument();
    });

    it("hides management actions when user has member role (no management permissions)", () => {
      useConversationParticipantsMock.mockReturnValue({
        participants: [
          createParticipant({
            userId: TEST_USER_ID,
            role: "member",
            status: "active",
            actor: { id: TEST_USER_ID, name: "Test User" },
          }),
        ],
        isLoading: false,
        isMutating: false,
        total: 1,
        error: null,
        refresh: vi.fn(),
        add: vi.fn(),
        update: vi.fn(),
        promote: vi.fn(),
        demote: vi.fn(),
        remove: vi.fn(),
        leave: vi.fn(),
      });

      renderConversationDetail();
      fireEvent.click(screen.getByTestId("tab-participants"));

      expect(
        screen.queryByTestId("add-participant-btn"),
      ).not.toBeInTheDocument();
      expect(screen.queryByTestId("promote-btn")).not.toBeInTheDocument();
      expect(screen.queryByTestId("demote-btn")).not.toBeInTheDocument();
      expect(screen.queryByTestId("remove-btn")).not.toBeInTheDocument();
    });

    it("shows leave button for active participant in non-system conversation", () => {
      renderConversationDetail();
      fireEvent.click(screen.getByTestId("tab-participants"));

      expect(screen.getByTestId("leave-btn")).toBeInTheDocument();
    });

    it("shows management actions when user has moderator role", () => {
      useConversationParticipantsMock.mockReturnValue({
        participants: [
          createParticipant({
            userId: TEST_USER_ID,
            role: "moderator",
            status: "active",
            actor: { id: TEST_USER_ID, name: "Test User" },
          }),
          createParticipant({
            userId: "other-user-001",
            role: "member",
            status: "active",
            actor: { id: "other-user-001", name: "Other User" },
          }),
        ],
        isLoading: false,
        isMutating: false,
        total: 2,
        error: null,
        refresh: vi.fn(),
        add: vi.fn(),
        update: vi.fn(),
        promote: vi.fn(),
        demote: vi.fn(),
        remove: vi.fn(),
        leave: vi.fn(),
      });

      renderConversationDetail();
      fireEvent.click(screen.getByTestId("tab-participants"));

      expect(screen.getByTestId("add-participant-btn")).toBeInTheDocument();
      expect(screen.getByTestId("promote-btn")).toBeInTheDocument();
      expect(screen.getByTestId("demote-btn")).toBeInTheDocument();
      expect(screen.getByTestId("remove-btn")).toBeInTheDocument();
    });
  });

  // ─── Task 2: Localization and Cache Mapping ──────────────────────────────
  describe("Task 2: Localization and Cache Mapping in ConversationDetail", () => {
    it("prioritizes participant.user.displayName over actorName(participant.actor) in userDisplayNames mapping", async () => {
      const targetUserId = "user-priority-001";
      const targetParticipantId = "part-priority-001";

      useConversationParticipantsMock.mockReturnValue({
        participants: [
          createParticipant({
            id: targetParticipantId,
            userId: targetUserId,
            role: "member",
            status: "active",
            actor: { id: targetUserId, name: "Actor Name" },
            user: {
              id: targetUserId,
              displayName: "User Display Name Priority",
              userType: "student",
            },
          }),
        ],
        isLoading: false,
        isMutating: false,
        total: 1,
        error: null,
        refresh: vi.fn(),
        add: vi.fn(),
        update: vi.fn(),
        promote: vi.fn(),
        demote: vi.fn(),
        remove: vi.fn(),
        leave: vi.fn(),
      });

      renderConversationDetail();

      // Switch to participants tab to render the participants panel
      fireEvent.click(screen.getByTestId("tab-participants"));

      // Verify that the rendered name is "User Display Name Priority" and NOT "Actor Name"
      expect(
        screen.getByTestId(`participant-${targetParticipantId}`),
      ).toHaveTextContent("User Display Name Priority");
    });
  });

  // ─── Task 10: Modal Archive/Close Confirmation ───────────────────────────
  describe("Task 10: Modal Archive/Close Confirmation", () => {
    it("shows confirmation dialog when archive is triggered and calls archiveConversation when confirmed", async () => {
      archiveConversationMock.mockResolvedValue(undefined);
      renderConversationDetail();

      // Trigger archive via the mock header button
      fireEvent.click(screen.getByTestId("header-archive-btn"));

      // Verify the confirmation dialog description is in the document
      expect(
        screen.getByText(
          "Archive this conversation? It can be reopened later.",
        ),
      ).toBeInTheDocument();

      // Click the confirm/Archive button inside the modal
      const confirmButtons = screen.getAllByRole("button", { name: "Archive" });
      const modalConfirmBtn = confirmButtons[confirmButtons.length - 1];
      fireEvent.click(modalConfirmBtn);

      await waitFor(() => {
        expect(archiveConversationMock).toHaveBeenCalledWith(
          TEST_CONVERSATION_ID,
        );
      });
    });

    it("shows confirmation dialog when close is triggered and calls closeConversation when confirmed", async () => {
      closeConversationMock.mockResolvedValue(undefined);
      renderConversationDetail();

      // Trigger close via the mock header button
      fireEvent.click(screen.getByTestId("header-close-btn"));

      // Verify the confirmation dialog description is in the document
      expect(
        screen.getByText("Close this conversation? It can be reopened later."),
      ).toBeInTheDocument();

      // Click the confirm/Close button inside the modal
      const confirmButtons = screen.getAllByRole("button", { name: "Close" });
      const modalConfirmBtn = confirmButtons[confirmButtons.length - 1];
      fireEvent.click(modalConfirmBtn);

      await waitFor(() => {
        expect(closeConversationMock).toHaveBeenCalledWith(
          TEST_CONVERSATION_ID,
        );
      });
    });
  });

  // ─── Error Toast Handling ───────────────────────────────────────────
  describe("Error Toast Handling", () => {
    it("toasts error when messagesState has an error and renders MessagesPanel without inline error", async () => {
      setupDefaultMocks();
      useConversationMessagesMock.mockReturnValue({
        messages: [],
        isLoading: false,
        isLoadingOlder: false,
        isMutating: false,
        hasOlderMessages: false,
        error: "Failed to load messages test error",
        send: vi.fn(),
        edit: vi.fn(),
        remove: vi.fn(),
        loadOlderMessages: vi.fn(),
        refresh: vi.fn(),
        upsertFromRealtime: vi.fn(),
        deleteFromRealtime: vi.fn(),
        patchFromRealtime: vi.fn(),
        patchReadFromRealtime: vi.fn(),
      });

      const mockOnToast = vi.fn();
      render(
        <ConversationDetail
          conversationId={TEST_CONVERSATION_ID}
          labels={labels}
          onBack={vi.fn()}
          onToast={mockOnToast}
        />,
      );

      await waitFor(() => {
        expect(mockOnToast).toHaveBeenCalledWith({
          tone: "error",
          message: "Failed to load messages test error",
        });
      });

      // Verify no inline CenteredState error is displayed
      expect(
        screen.queryByText("Failed to load messages test error"),
      ).not.toBeInTheDocument();
    });

    it("toasts error when participantsState has an error and renders ParticipantsPanel without inline error", async () => {
      setupDefaultMocks();
      useConversationParticipantsMock.mockReturnValue({
        participants: [],
        isLoading: false,
        isMutating: false,
        total: 0,
        error: "Failed to load participants test error",
        refresh: vi.fn(),
        add: vi.fn(),
        update: vi.fn(),
        promote: vi.fn(),
        demote: vi.fn(),
        remove: vi.fn(),
        leave: vi.fn(),
      });

      const mockOnToast = vi.fn();
      render(
        <ConversationDetail
          conversationId={TEST_CONVERSATION_ID}
          labels={labels}
          onBack={vi.fn()}
          onToast={mockOnToast}
        />,
      );

      // Switch to participants tab
      fireEvent.click(screen.getByTestId("tab-participants"));

      await waitFor(() => {
        expect(mockOnToast).toHaveBeenCalledWith({
          tone: "error",
          message: "Failed to load participants test error",
        });
      });

      // Verify no inline error panel state is displayed
      expect(
        screen.queryByText("Failed to load participants test error"),
      ).not.toBeInTheDocument();
    });
  });

  // ─── Task 3: Bottom Banners ──────────────────────────────────────────────
  describe("Task 3: Bottom Banners in ConversationDetail", () => {
    it("renders archived banner and hides composer when conversation status is archived", () => {
      useConversationMock.mockReturnValue({
        conversation: createConversation({
          id: TEST_CONVERSATION_ID,
          status: "archived",
        }),
        isLoading: false,
        error: null,
        refresh: vi.fn(),
      });

      renderConversationDetail();

      expect(screen.queryByTestId("message-composer")).not.toBeInTheDocument();
      expect(screen.getByText(labels.bannerArchived)).toBeInTheDocument();
    });

    it("renders closed banner and hides composer when conversation status is closed", () => {
      useConversationMock.mockReturnValue({
        conversation: createConversation({
          id: TEST_CONVERSATION_ID,
          status: "closed",
        }),
        isLoading: false,
        error: null,
        refresh: vi.fn(),
      });

      renderConversationDetail();

      expect(screen.queryByTestId("message-composer")).not.toBeInTheDocument();
      expect(screen.getByText(labels.bannerClosed)).toBeInTheDocument();
    });

    it("renders policy disabled banner when school policy is disabled", () => {
      useCommunicationPolicyMock.mockReturnValue({
        policy: {
          isEnabled: false,
        },
      });

      renderConversationDetail();

      expect(screen.queryByTestId("message-composer")).not.toBeInTheDocument();
      expect(screen.getByText(labels.errorPolicyDisabled)).toBeInTheDocument();
    });

    it("renders blocked banner when current participant status is blocked", () => {
      useConversationParticipantsMock.mockReturnValue({
        participants: [
          createParticipant({
            userId: TEST_USER_ID,
            role: "member",
            status: "blocked",
            actor: { id: TEST_USER_ID, name: "Test User" },
          }),
        ],
        isLoading: false,
        isMutating: false,
        total: 1,
        error: null,
        refresh: vi.fn(),
      });

      renderConversationDetail();

      expect(screen.queryByTestId("message-composer")).not.toBeInTheDocument();
      expect(screen.getByText(labels.errorUserBlocked)).toBeInTheDocument();
    });

    it("renders blocked banner when current participant has isBlocked flag", () => {
      const participant = createParticipant({
        userId: TEST_USER_ID,
        role: "member",
        status: "active",
        actor: { id: TEST_USER_ID, name: "Test User" },
        isBlocked: true,
      });

      useConversationParticipantsMock.mockReturnValue({
        participants: [participant],
        isLoading: false,
        isMutating: false,
        total: 1,
        error: null,
        refresh: vi.fn(),
      });

      renderConversationDetail();

      expect(screen.queryByTestId("message-composer")).not.toBeInTheDocument();
      expect(screen.getByText(labels.errorUserBlocked)).toBeInTheDocument();
    });

    it("renders restricted banner when current participant has isRestricted flag", () => {
      const participant = createParticipant({
        userId: TEST_USER_ID,
        role: "member",
        status: "active",
        actor: { id: TEST_USER_ID, name: "Test User" },
        isRestricted: true,
      });

      useConversationParticipantsMock.mockReturnValue({
        participants: [participant],
        isLoading: false,
        isMutating: false,
        total: 1,
        error: null,
        refresh: vi.fn(),
      });

      renderConversationDetail();

      expect(screen.queryByTestId("message-composer")).not.toBeInTheDocument();
      expect(screen.getByText(labels.errorUserRestricted)).toBeInTheDocument();
    });

    it("renders read-only banner when conversation is read-only", () => {
      const conv = createConversation({
        id: TEST_CONVERSATION_ID,
        status: "active",
        isReadOnly: true,
      });

      useConversationMock.mockReturnValue({
        conversation: conv,
        isLoading: false,
        error: null,
        refresh: vi.fn(),
      });

      renderConversationDetail();

      expect(screen.queryByTestId("message-composer")).not.toBeInTheDocument();
      expect(screen.getByText(labels.bannerReadOnly)).toBeInTheDocument();
    });

    it("renders muted banner when current participant is muted", () => {
      useConversationParticipantsMock.mockReturnValue({
        participants: [
          createParticipant({
            userId: TEST_USER_ID,
            role: "member",
            status: "muted",
            actor: { id: TEST_USER_ID, name: "Test User" },
          }),
        ],
        isLoading: false,
        isMutating: false,
        total: 1,
        error: null,
        refresh: vi.fn(),
      });

      renderConversationDetail();

      expect(screen.queryByTestId("message-composer")).not.toBeInTheDocument();
      expect(screen.getByText(labels.bannerMuted)).toBeInTheDocument();
    });

    it("renders read-only participant banner when current participant has READ_ONLY role", () => {
      useConversationParticipantsMock.mockReturnValue({
        participants: [
          createParticipant({
            userId: TEST_USER_ID,
            role: "read_only",
            status: "active",
            actor: { id: TEST_USER_ID, name: "Test User" },
          }),
        ],
        isLoading: false,
        isMutating: false,
        total: 1,
        error: null,
        refresh: vi.fn(),
      });

      renderConversationDetail();

      expect(screen.queryByTestId("message-composer")).not.toBeInTheDocument();
      expect(
        screen.getByText(labels.bannerReadOnlyParticipant),
      ).toBeInTheDocument();
    });

    it("respects priority order (Archived > Closed > Policy disabled > Blocked/Restricted > Read-only > Muted > Read-only participant)", () => {
      // 1. Archived takes precedence over Closed & Muted
      useConversationMock.mockReturnValue({
        conversation: createConversation({
          id: TEST_CONVERSATION_ID,
          status: "archived",
        }),
        isLoading: false,
        error: null,
        refresh: vi.fn(),
      });
      useConversationParticipantsMock.mockReturnValue({
        participants: [
          createParticipant({
            userId: TEST_USER_ID,
            role: "read_only",
            status: "muted",
            actor: { id: TEST_USER_ID, name: "Test User" },
          }),
        ],
        isLoading: false,
        isMutating: false,
        total: 1,
        error: null,
        refresh: vi.fn(),
      });

      const { unmount } = renderConversationDetail();
      expect(screen.getByText(labels.bannerArchived)).toBeInTheDocument();
      expect(screen.queryByText(labels.bannerClosed)).not.toBeInTheDocument();
      unmount();

      // 2. Closed takes precedence over Policy disabled & Muted
      useConversationMock.mockReturnValue({
        conversation: createConversation({
          id: TEST_CONVERSATION_ID,
          status: "closed",
        }),
        isLoading: false,
        error: null,
        refresh: vi.fn(),
      });
      useCommunicationPolicyMock.mockReturnValue({
        policy: { isEnabled: false },
      });

      const { unmount: unmount2 } = renderConversationDetail();
      expect(screen.getByText(labels.bannerClosed)).toBeInTheDocument();
      expect(
        screen.queryByText(labels.errorPolicyDisabled),
      ).not.toBeInTheDocument();
      unmount2();

      // Reset policy mock
      useCommunicationPolicyMock.mockReturnValue({
        policy: { isEnabled: true },
      });
    });
  });
});
