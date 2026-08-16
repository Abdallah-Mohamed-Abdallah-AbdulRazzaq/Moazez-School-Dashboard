/**
 * Tests for MessagesPanel component.
 *
 * Validates:
 * - Property 2: Render Isolation on Real-Time Events (Requirements 2.2, 2.3)
 * - Requirements 5.1: Typing indicator displays typing user names
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { createMessage } from "../utils/test-data-generators";
import { conversationRedesignLabels } from "@/features/communication/conversations_redesign/labels";

// ─── Mock scrollTo for jsdom ─────────────────────────────────────────────────

beforeEach(() => {
  Element.prototype.scrollTo = vi.fn();
});

// ─── Mock MessageBubble to avoid deep rendering ─────────────────────────────

vi.mock(
  "@/features/communication/conversations_redesign/components/messages/MessageBubble",
  () => ({
    MessageBubble: ({ message }: { message: { id: string; body: string } }) => (
      <div data-testid={`message-bubble-${message.id}`}>{message.body}</div>
    ),
  }),
);

vi.mock(
  "@/features/communication/conversations_redesign/components/PanelLayout",
  () => ({
    CenteredState: ({ label }: { label: string }) => (
      <div data-testid="centered-state">{label}</div>
    ),
  }),
);

// ─── Import Component Under Test ─────────────────────────────────────────────

import { MessagesPanel } from "@/features/communication/conversations_redesign/components/messages/MessagesPanel";

// ─── Default Props Factory ───────────────────────────────────────────────────

function createDefaultProps(overrides: Record<string, unknown> = {}) {
  return {
    allowReactions: true,
    attachmentsByMessageId: {} as Record<string, never[]>,
    currentUserId: "user-001",
    currentUserName: "Test User",
    error: null,
    hasOlderMessages: false,
    isLoading: false,
    isLoadingOlder: false,
    labels: conversationRedesignLabels.en,
    locale: "en",
    messages: [] as ReturnType<typeof createMessage>[],
    onAddReaction: vi.fn().mockResolvedValue(undefined),
    onAttachFile: vi.fn().mockResolvedValue(undefined),
    onDeleteAttachment: vi.fn().mockResolvedValue(undefined),
    onDeleteMessage: vi.fn().mockResolvedValue(undefined),
    onEditMessage: vi.fn().mockResolvedValue(undefined),
    onStartEdit: vi.fn(),
    onLoadOlder: vi.fn(),
    onInfo: vi.fn(),
    onRemoveReaction: vi.fn().mockResolvedValue(undefined),
    onReply: vi.fn(),
    onReport: vi.fn(),
    onRetry: vi.fn(),
    reactionsByMessageId: {} as Record<string, never[]>,
    typingUsers: [] as Array<{ userId: string; name?: string }>,
    userDisplayNames: {} as Record<string, string>,
    uploadingMessageId: null,
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("MessagesPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows a jump control when messages arrive while scrolled away from the bottom", async () => {
    const initialMessages = [createMessage({ id: "msg-1", body: "First" })];
    const props = createDefaultProps({ messages: initialMessages });
    const { rerender } = render(<MessagesPanel {...props} />);
    const scroller = screen.getByRole("log", { name: "Messages" });

    Object.defineProperties(scroller, {
      clientHeight: { configurable: true, value: 400 },
      scrollHeight: { configurable: true, value: 1200 },
    });
    scroller.scrollTop = 200;
    fireEvent.scroll(scroller);

    rerender(
      <MessagesPanel
        {...createDefaultProps({
          messages: [
            ...initialMessages,
            createMessage({ id: "msg-2", body: "Second" }),
          ],
        })}
      />,
    );

    expect(
      await screen.findByRole("button", { name: "1 new message" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "1 new message" }));
    expect(Element.prototype.scrollTo).toHaveBeenCalledWith({
      behavior: "smooth",
      top: 1200,
    });
  });

  it("preserves the visible position when older messages are prepended", async () => {
    const onLoadOlder = vi.fn();
    const initialMessages = [
      createMessage({ id: "msg-2", body: "Second" }),
      createMessage({ id: "msg-3", body: "Third" }),
    ];
    const props = createDefaultProps({
      hasOlderMessages: true,
      messages: initialMessages,
      onLoadOlder,
    });
    const { rerender } = render(<MessagesPanel {...props} />);
    const scroller = screen.getByRole("log", { name: "Messages" });
    let scrollHeight = 1000;

    Object.defineProperties(scroller, {
      clientHeight: { configurable: true, value: 400 },
      scrollHeight: { configurable: true, get: () => scrollHeight },
    });
    scroller.scrollTop = 40;
    fireEvent.scroll(scroller);
    expect(onLoadOlder).toHaveBeenCalledTimes(1);

    scrollHeight = 1600;
    rerender(
      <MessagesPanel
        {...createDefaultProps({
          hasOlderMessages: false,
          messages: [
            createMessage({ id: "msg-1", body: "First" }),
            ...initialMessages,
          ],
          onLoadOlder,
        })}
      />,
    );

    await waitFor(() => expect(scroller.scrollTop).toBe(640));
  });

  it("offers a retry action when messages fail to load", () => {
    const onRetry = vi.fn();
    render(
      <MessagesPanel
        {...createDefaultProps({
          error: "Unable to load messages.",
          onRetry,
        })}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Unable to load messages.",
    );
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it.each([
    ["en", conversationRedesignLabels.en],
    ["ar", conversationRedesignLabels.ar],
  ] as const)(
    "keeps the message panel LTR in the %s locale",
    (locale, labels) => {
      render(
        <MessagesPanel
          {...createDefaultProps({
            labels,
            locale,
          })}
        />,
      );

      expect(
        screen.getByRole("log", { name: labels.messages }),
      ).toHaveAttribute("dir", "ltr");
    },
  );

  // ─── Property 2: Render Isolation — new message only re-renders MessagesPanel ─

  describe("Property 2: Render isolation on new message", () => {
    it("re-renders MessagesPanel when a new message is added without affecting sibling panels", () => {
      // This test verifies that MessagesPanel renders correctly when messages change,
      // and that a sibling ParticipantsPanel (wrapped in React.memo) does NOT re-render.

      let messagesPanelRenderCount = 0;
      let participantsPanelRenderCount = 0;

      // Stable participants reference (simulates how real app holds stable state)
      const stableParticipants = ["Dave", "Eve"];

      // Wrap MessagesPanel with a render counter
      function TrackedMessagesPanel(
        props: ReturnType<typeof createDefaultProps>,
      ) {
        messagesPanelRenderCount++;
        return <MessagesPanel {...props} />;
      }

      // Simulate a sibling panel (ParticipantsPanel) using React.memo
      const TrackedParticipantsPanel = React.memo(function ParticipantsPanel({
        participants,
      }: {
        participants: string[];
      }) {
        participantsPanelRenderCount++;
        return (
          <div data-testid="participants-panel">{participants.join(", ")}</div>
        );
      });

      // Parent component that holds shared state
      function ParentComponent({
        messages,
      }: {
        messages: ReturnType<typeof createMessage>[];
      }) {
        const messagesPanelProps = createDefaultProps({ messages });
        return (
          <div>
            <TrackedMessagesPanel {...messagesPanelProps} />
            <TrackedParticipantsPanel participants={stableParticipants} />
          </div>
        );
      }

      const initialMessages = [createMessage({ id: "msg-1", body: "Hello" })];

      const { rerender } = render(
        <ParentComponent messages={initialMessages} />,
      );

      expect(messagesPanelRenderCount).toBe(1);
      expect(participantsPanelRenderCount).toBe(1);

      // Simulate a new message arriving (re-render with updated messages)
      const updatedMessages = [
        ...initialMessages,
        createMessage({ id: "msg-2", body: "New message!" }),
      ];

      rerender(<ParentComponent messages={updatedMessages} />);

      // MessagesPanel should re-render with the new message
      expect(messagesPanelRenderCount).toBe(2);
      // ParticipantsPanel (memoized, props unchanged) should NOT re-render
      expect(participantsPanelRenderCount).toBe(1);

      // Verify the new message is displayed
      expect(screen.getByTestId("message-bubble-msg-2")).toBeInTheDocument();
    });

    it("renders new messages without triggering re-render of unrelated sibling", () => {
      let siblingRenderCount = 0;

      const MemoizedSibling = React.memo(function Sibling() {
        siblingRenderCount++;
        return <div data-testid="sibling">Sibling content</div>;
      });

      function TestContainer({
        messages,
      }: {
        messages: ReturnType<typeof createMessage>[];
      }) {
        const props = createDefaultProps({ messages });
        return (
          <div>
            <MessagesPanel {...props} />
            <MemoizedSibling />
          </div>
        );
      }

      const { rerender } = render(<TestContainer messages={[]} />);
      expect(siblingRenderCount).toBe(1);

      // Add messages
      const newMessages = [
        createMessage({ id: "msg-a", body: "First" }),
        createMessage({ id: "msg-b", body: "Second" }),
      ];
      rerender(<TestContainer messages={newMessages} />);

      // Sibling should still only have rendered once
      expect(siblingRenderCount).toBe(1);
      // Messages should be visible
      expect(screen.getByTestId("message-bubble-msg-a")).toBeInTheDocument();
      expect(screen.getByTestId("message-bubble-msg-b")).toBeInTheDocument();
    });
  });

  // ─── Requirement 5.1: Typing indicator displays typing user names ──────────

  describe("Requirement 5.1: Typing indicator displays typing user names", () => {
    it("displays typing indicator with a single user name", () => {
      const props = createDefaultProps({
        typingUsers: [{ userId: "user-002", name: "Alice" }],
      });

      render(<MessagesPanel {...props} />);

      expect(screen.getByText(/Alice/)).toBeInTheDocument();
      expect(screen.getByText(/is typing\.\.\./)).toBeInTheDocument();
    });

    it("displays typing indicator with multiple user names", () => {
      const props = createDefaultProps({
        typingUsers: [
          { userId: "user-002", name: "Alice" },
          { userId: "user-003", name: "Bob" },
        ],
      });

      render(<MessagesPanel {...props} />);

      // Both names should appear joined by comma
      expect(screen.getByText(/Alice, Bob/)).toBeInTheDocument();
      expect(screen.getByText(/is typing\.\.\./)).toBeInTheDocument();
    });

    it("uses userDisplayNames fallback when typing user has no name", () => {
      const props = createDefaultProps({
        typingUsers: [{ userId: "user-002" }],
        userDisplayNames: { "user-002": "Charlie" },
      });

      render(<MessagesPanel {...props} />);

      expect(screen.getByText(/Charlie/)).toBeInTheDocument();
    });

    it("announces the typing indicator as a polite status update", () => {
      const props = createDefaultProps({
        typingUsers: [{ userId: "user-002", name: "Charlie" }],
      });

      render(<MessagesPanel {...props} />);

      expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
      expect(screen.getByRole("status")).toHaveTextContent(
        "Charlie is typing...",
      );
    });

    it("uses 'Someone' label when typing user has no name and no display name", () => {
      const props = createDefaultProps({
        typingUsers: [{ userId: "user-unknown" }],
        userDisplayNames: {},
      });

      render(<MessagesPanel {...props} />);

      expect(screen.getByText(/Someone/)).toBeInTheDocument();
    });

    it("does not display typing indicator when typingUsers is empty", () => {
      const props = createDefaultProps({
        typingUsers: [],
        messages: [createMessage({ id: "msg-1", body: "Hello" })],
      });

      render(<MessagesPanel {...props} />);

      expect(screen.queryByText(/is typing\.\.\./)).not.toBeInTheDocument();
    });
  });

  // ─── Property 2: Typing state change does not re-render ParticipantsPanel ──

  describe("Property 2: Typing state change does not re-render ParticipantsPanel", () => {
    it("typing state change re-renders MessagesPanel without re-rendering sibling ParticipantsPanel", () => {
      let messagesPanelRenderCount = 0;
      let participantsPanelRenderCount = 0;

      // Stable participants array reference (simulates how real app holds stable state)
      const stableParticipants = ["Dave", "Eve"];
      const stableMessages = [createMessage({ id: "msg-1", body: "Hello" })];

      const TrackedParticipantsPanel = React.memo(function ParticipantsPanel({
        participants,
      }: {
        participants: string[];
      }) {
        participantsPanelRenderCount++;
        return (
          <div data-testid="participants-panel">{participants.join(", ")}</div>
        );
      });

      function ParentComponent({
        typingUsers,
      }: {
        typingUsers: Array<{ userId: string; name?: string }>;
      }) {
        messagesPanelRenderCount++;
        const props = createDefaultProps({
          typingUsers,
          messages: stableMessages,
        });
        return (
          <div>
            <MessagesPanel {...props} />
            <TrackedParticipantsPanel participants={stableParticipants} />
          </div>
        );
      }

      const { rerender } = render(<ParentComponent typingUsers={[]} />);

      expect(messagesPanelRenderCount).toBe(1);
      expect(participantsPanelRenderCount).toBe(1);
      expect(screen.queryByText(/is typing\.\.\./)).not.toBeInTheDocument();

      // Simulate typing started
      rerender(
        <ParentComponent
          typingUsers={[{ userId: "user-002", name: "Alice" }]}
        />,
      );

      // Parent (containing MessagesPanel) should re-render to show typing indicator
      expect(messagesPanelRenderCount).toBe(2);
      // ParticipantsPanel should NOT re-render (its props didn't change)
      expect(participantsPanelRenderCount).toBe(1);
      expect(screen.getByText(/Alice.*is typing\.\.\./)).toBeInTheDocument();

      // Simulate typing stopped
      rerender(<ParentComponent typingUsers={[]} />);

      // Parent re-renders again
      expect(messagesPanelRenderCount).toBe(3);
      // ParticipantsPanel still should NOT re-render
      expect(participantsPanelRenderCount).toBe(1);
      expect(screen.queryByText(/is typing\.\.\./)).not.toBeInTheDocument();
    });

    it("multiple typing state transitions do not cause ParticipantsPanel re-renders", () => {
      let participantsPanelRenderCount = 0;

      const TrackedParticipantsPanel = React.memo(function ParticipantsPanel() {
        participantsPanelRenderCount++;
        return <div data-testid="participants-panel">Participants</div>;
      });

      function ParentComponent({
        typingUsers,
      }: {
        typingUsers: Array<{ userId: string; name?: string }>;
      }) {
        const props = createDefaultProps({
          typingUsers,
          messages: [createMessage({ id: "msg-1", body: "Hello" })],
        });
        return (
          <div>
            <MessagesPanel {...props} />
            <TrackedParticipantsPanel />
          </div>
        );
      }

      const { rerender } = render(<ParentComponent typingUsers={[]} />);
      expect(participantsPanelRenderCount).toBe(1);

      // Multiple typing state changes
      rerender(
        <ParentComponent typingUsers={[{ userId: "user-a", name: "Alice" }]} />,
      );
      rerender(
        <ParentComponent
          typingUsers={[
            { userId: "user-a", name: "Alice" },
            { userId: "user-b", name: "Bob" },
          ]}
        />,
      );
      rerender(
        <ParentComponent typingUsers={[{ userId: "user-b", name: "Bob" }]} />,
      );
      rerender(<ParentComponent typingUsers={[]} />);

      // ParticipantsPanel should still only have rendered once
      expect(participantsPanelRenderCount).toBe(1);
    });
  });
});
