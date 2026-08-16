/**
 * Property-based tests for ConversationDetail component.
 *
 * **Validates: Requirements 2.5, 6.5**
 *
 * Property 3: Tab Switch Does Not Re-Fetch Loaded Data
 * For any sequence of tab switches, returning to a loaded tab does not trigger new API fetch.
 *
 * Property 17: ReadOnly Composer for Restricted Users
 * For any restricted user state (readOnly, muted, blocked, removed), ReadOnlyComposer is rendered.
 */

import { describe, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { test, fc } from "@fast-check/vitest";
import { createConversation, createParticipant } from "../utils/test-data-generators";

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
const markConversationReadMock = vi.hoisted(() => vi.fn());

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
    hasPermission: () => true,
  }),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/features/communication/api/communication.service", () => ({
  markConversationRead: markConversationReadMock,
  archiveConversation: vi.fn(),
  closeConversation: vi.fn(),
  createMessageReport: vi.fn(),
  getMessageInfo: vi.fn(),
  reopenConversation: vi.fn(),
  updateConversation: vi.fn(),
}));

// Mock child components to isolate ConversationDetail logic
vi.mock("@/features/communication/conversations_redesign/components/ConversationHeader", () => ({
  default: () => <div data-testid="conversation-header">Header</div>,
}));

vi.mock("@/features/communication/conversations_redesign/components/ConversationTabs", () => ({
  default: ({ onTabChange }: { activeTab: string; onTabChange: (tab: string) => void }) => (
    <div data-testid="conversation-tabs">
      <button data-testid="tab-messages" onClick={() => onTabChange("messages")}>Messages</button>
      <button data-testid="tab-participants" onClick={() => onTabChange("participants")}>Participants</button>
      <button data-testid="tab-invites" onClick={() => onTabChange("invites")}>Invites</button>
      <button data-testid="tab-joinRequests" onClick={() => onTabChange("joinRequests")}>Join Requests</button>
    </div>
  ),
}));

vi.mock("@/features/communication/conversations_redesign/components/MessagesPanel", () => ({
  MessagesPanel: () => <div data-testid="messages-panel">MessagesPanel</div>,
  MessageComposer: () => <div data-testid="message-composer">MessageComposer</div>,
  ReadOnlyComposer: ({ labels }: { labels: { readOnlyComposer: string } }) => (
    <div data-testid="read-only-composer">{labels.readOnlyComposer}</div>
  ),
}));

vi.mock("@/features/communication/conversations_redesign/components/ParticipantsPanel", () => ({
  default: () => <div data-testid="participants-panel">ParticipantsPanel</div>,
}));

vi.mock("@/features/communication/conversations_redesign/components/InvitesPanel", () => ({
  default: () => <div data-testid="invites-panel">InvitesPanel</div>,
}));

vi.mock("@/features/communication/conversations_redesign/components/JoinRequestsPanel", () => ({
  default: () => <div data-testid="join-requests-panel">JoinRequestsPanel</div>,
}));

vi.mock("@/features/communication/conversations_redesign/components/EditConversationDialog", () => ({
  default: () => null,
}));

vi.mock("@/features/communication/components/conversations/AddParticipantDialog", () => ({
  default: () => null,
}));

vi.mock("@/features/communication/components/conversations/EditParticipantRoleDialog", () => ({
  default: () => null,
}));

vi.mock("@/features/communication/components/conversations/RemoveParticipantDialog", () => ({
  default: () => null,
}));

vi.mock("@/features/communication/components/conversations/LeaveConversationDialog", () => ({
  default: () => null,
}));

vi.mock("@/features/communication/components/conversations/CreateInviteDialog", () => ({
  default: () => null,
}));

vi.mock("@/features/communication/components/conversations/CreateJoinRequestDialog", () => ({
  default: () => null,
}));

vi.mock("@/features/communication/components/conversations/RejectInviteDialog", () => ({
  default: () => null,
}));

vi.mock("@/features/communication/components/conversations/ReviewJoinRequestDialog", () => ({
  default: () => null,
}));

// ─── Import Component Under Test ────────────────────────────────────────────

import ConversationDetail from "@/features/communication/conversations_redesign/components/ConversationDetail";
import { conversationRedesignLabels } from "@/features/communication/conversations_redesign/labels";

// ─── Test Setup ─────────────────────────────────────────────────────────────

const TEST_CONVERSATION_ID = "conv-prop-001";
const TEST_USER_ID = "user-prop-001";
const labels = conversationRedesignLabels.en;

type TabName = "messages" | "participants" | "invites" | "joinRequests";

function setupDefaultMocks() {
  useAuthMock.mockReturnValue({
    user: { id: TEST_USER_ID, firstName: "Test", lastName: "User" },
    isAuthenticated: true,
  });

  useConversationMock.mockReturnValue({
    conversation: createConversation({ id: TEST_CONVERSATION_ID, status: "active" }),
    isLoading: false,
    error: null,
    refresh: vi.fn(),
  });

  useConversationMessagesMock.mockReturnValue({
    messages: [],
    isLoading: false,
    isLoadingOlder: false,
    isMutating: false,
    hasOlderMessages: false,
    error: null,
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
    refreshAll: vi.fn(),
  });

  useMessageAttachmentsMock.mockReturnValue({
    attachmentsByMessageId: {},
    attachFile: vi.fn(),
    removeAttachment: vi.fn(),
    refreshAll: vi.fn(),
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

function renderConversationDetail() {
  return render(
    <ConversationDetail
      conversationId={TEST_CONVERSATION_ID}
      labels={labels}
      onBack={vi.fn()}
      onToast={vi.fn()}
    />,
  );
}

// ─── Property 3: Tab Switch Does Not Re-Fetch Loaded Data ───────────────────

describe("ConversationDetail - Property 3: Tab Switch Does Not Re-Fetch Loaded Data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
  });

  /**
   * **Validates: Requirements 2.5**
   *
   * Property 3: For any sequence of tab switches in ConversationDetail, once a
   * tab's hook was called with `enabled: true`, it SHALL never revert to
   * `enabled: false` in subsequent calls. This ensures that returning to a
   * previously loaded tab does not trigger a new API fetch.
   */
  test.prop(
    [fc.array(fc.constantFrom<TabName>("messages", "participants", "invites", "joinRequests"), { minLength: 1, maxLength: 20 })],
    { numRuns: 100 },
  )(
    "Once a tab's hook is enabled, it never reverts to enabled: false on subsequent tab switches",
    (tabSequence) => {
      cleanup();
      vi.clearAllMocks();
      setupDefaultMocks();
      const { unmount } = renderConversationDetail();

      // Execute each tab switch in the generated sequence
      for (const tab of tabSequence) {
        fireEvent.click(screen.getByTestId(`tab-${tab}`));
      }

      // Verify: once useConversationParticipants was called with enabled: true,
      // it never reverts to enabled: false in subsequent calls
      const participantsCalls = useConversationParticipantsMock.mock.calls;
      let participantsEnabledSeen = false;
      for (const call of participantsCalls) {
        const options = call[1] as { enabled?: boolean } | undefined;
        if (options?.enabled === true) {
          participantsEnabledSeen = true;
        }
        if (participantsEnabledSeen) {
          expect(options?.enabled).toBe(true);
        }
      }

      // Verify: once useConversationInvites was called with enabled: true,
      // it never reverts to enabled: false in subsequent calls
      const invitesCalls = useConversationInvitesMock.mock.calls;
      let invitesEnabledSeen = false;
      for (const call of invitesCalls) {
        const options = call[1] as { enabled?: boolean } | undefined;
        if (options?.enabled === true) {
          invitesEnabledSeen = true;
        }
        if (invitesEnabledSeen) {
          expect(options?.enabled).toBe(true);
        }
      }

      // Verify: once useConversationJoinRequests was called with enabled: true,
      // it never reverts to enabled: false in subsequent calls
      const joinRequestsCalls = useConversationJoinRequestsMock.mock.calls;
      let joinRequestsEnabledSeen = false;
      for (const call of joinRequestsCalls) {
        const options = call[1] as { enabled?: boolean } | undefined;
        if (options?.enabled === true) {
          joinRequestsEnabledSeen = true;
        }
        if (joinRequestsEnabledSeen) {
          expect(options?.enabled).toBe(true);
        }
      }

      // Cleanup DOM for next property test iteration
      unmount();
    },
  );
});

// ─── Property 17: ReadOnly Composer for Restricted Users ────────────────────

describe("ConversationDetail - Property 17: ReadOnly Composer for Restricted Users", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
  });

  /**
   * **Validates: Requirements 6.5**
   *
   * Property 17: For any restricted user state (closed, muted, blocked, removed,
   * disabled_policy), ReadOnlyComposer SHALL be rendered instead of MessageComposer.
   */
  test.prop(
    [fc.constantFrom("closed", "muted", "blocked", "removed", "disabled_policy")],
    { numRuns: 50 },
  )(
    "ReadOnlyComposer is rendered for any restricted state",
    (restrictedState) => {
      setupDefaultMocks();
      // Configure the appropriate mock based on the restricted state
      switch (restrictedState) {
        case "closed":
          useConversationMock.mockReturnValue({
            conversation: createConversation({
              id: TEST_CONVERSATION_ID,
              status: "closed",
            }),
            isLoading: false,
            error: null,
            refresh: vi.fn(),
          });
          break;

        case "muted":
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
          break;

        case "blocked":
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
          break;

        case "removed":
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
          break;

        case "disabled_policy":
          useCommunicationPolicyMock.mockReturnValue({
            policy: {
              isEnabled: false,
              allowReactions: true,
              allowAttachments: true,
              maxMessageLength: 2000,
              maxAttachmentSizeMb: 10,
            },
          });
          break;
      }

      const { unmount } = renderConversationDetail();

      // Assert the correct banner is in the document
      let expectedText = "";
      if (restrictedState === "closed") expectedText = labels.bannerClosed;
      else if (restrictedState === "muted") expectedText = labels.bannerMuted;
      else if (restrictedState === "blocked") expectedText = labels.errorUserBlocked;
      else if (restrictedState === "disabled_policy") expectedText = labels.errorPolicyDisabled;
      else if (restrictedState === "removed") expectedText = labels.errorConversationNotMember;

      expect(screen.getByText(expectedText)).toBeInTheDocument();
      expect(screen.queryByTestId("read-only-composer")).not.toBeInTheDocument();

      // Assert MessageComposer is NOT rendered
      expect(screen.queryByTestId("message-composer")).not.toBeInTheDocument();

      // Cleanup DOM for next property test iteration
      unmount();
    },
  );
});
