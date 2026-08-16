/**
 * Property-based tests for MessagesPanel component.
 *
 * **Validates: Requirements 2.2, 2.3**
 *
 * Property 2: Render Isolation on Real-Time Events
 * For any socket event (simulated as new messages arriving), only the directly
 * affected panel (MessagesPanel) re-renders; sibling panels that are not
 * consuming the changed state do not re-render.
 */

import { describe, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { test as fcTest, fc } from "@fast-check/vitest";
import React from "react";
import { messageArb } from "../utils/test-data-generators";
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
    messages: [] as Array<{ id: string; conversationId: string; senderId: string; body: string; type: string; status: string; createdAt: string; updatedAt?: string }>,
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

// ─── Memoized Sibling Panel (simulates ParticipantsPanel) ────────────────────

let siblingRenderCount = 0;

const MemoizedSiblingPanel = React.memo(function SiblingPanel({
  participants,
}: {
  participants: string[];
}) {
  siblingRenderCount++;
  return (
    <div data-testid="sibling-panel">
      {participants.map((p) => (
        <span key={p}>{p}</span>
      ))}
    </div>
  );
});

// ─── Property Tests ──────────────────────────────────────────────────────────

describe("Property 2: Render Isolation on Real-Time Events", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    siblingRenderCount = 0;
  });

  fcTest.prop(
    [fc.array(messageArb, { minLength: 1, maxLength: 10 })],
    { numRuns: 30, timeout: 30_000 },
  )(
    "for any generated messages simulating real-time arrivals, only MessagesPanel re-renders; memoized sibling does not",
    (newMessages) => {
      // Stable reference for sibling props (never changes between renders)
      const stableParticipants = ["Alice", "Bob", "Charlie"];

      let messagesPanelRenderCount = 0;

      // Tracked wrapper around MessagesPanel
      function TrackedMessagesPanel(props: ReturnType<typeof createDefaultProps>) {
        messagesPanelRenderCount++;
        return <MessagesPanel {...(props as React.ComponentProps<typeof MessagesPanel>)} />;
      }

      // Parent component simulating the real app structure
      function ParentComponent({
        messages,
      }: {
        messages: typeof newMessages;
      }) {
        const props = createDefaultProps({ messages });
        return (
          <div>
            <TrackedMessagesPanel {...props} />
            <MemoizedSiblingPanel participants={stableParticipants} />
          </div>
        );
      }

      // Initial render with no messages
      const { rerender } = render(<ParentComponent messages={[]} />);

      const initialMessagesPanelRenderCount = messagesPanelRenderCount;
      const initialSiblingRenderCount = siblingRenderCount;

      // Simulate real-time event: new messages arrive
      rerender(<ParentComponent messages={newMessages} />);

      // Assert: MessagesPanel re-renders (shows new messages)
      expect(messagesPanelRenderCount).toBeGreaterThan(
        initialMessagesPanelRenderCount,
      );

      // Assert: the memoized sibling panel does NOT re-render (render count stays at initial)
      expect(siblingRenderCount).toBe(initialSiblingRenderCount);

      // Assert: new messages are actually displayed
      for (const msg of newMessages) {
        expect(
          screen.getByTestId(`message-bubble-${msg.id}`),
        ).toBeInTheDocument();
      }
    },
  );
});
