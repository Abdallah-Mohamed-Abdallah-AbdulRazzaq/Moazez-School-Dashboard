/**
 * Property-based tests for BubbleContextMenu component.
 *
 * **Validates: Requirements 1.1, 1.5**
 *
 * Property 1: Error-Free Rendering
 * For any valid props combination, BubbleContextMenu renders without console errors or exceptions.
 */

import { describe, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { test as fcTest, fc } from "@fast-check/vitest";

import { conversationRedesignLabels } from "../../conversations_redesign/labels";

// Mock @floating-ui/react to avoid the "Cannot access refs during render" error in tests
// and to isolate component logic from floating-ui internals.
vi.mock("@floating-ui/react", () => ({
  useFloating: () => ({
    refs: {
      setReference: vi.fn(),
      setFloating: vi.fn(),
    },
    floatingStyles: { position: "absolute" as const, top: 0, left: 0 },
  }),
  offset: () => ({}),
  flip: () => ({}),
  shift: () => ({}),
  autoUpdate: vi.fn(),
}));

import { BubbleContextMenu } from "../../conversations_redesign/components/messages/BubbleContextMenu";

// ─── Constants ───────────────────────────────────────────────────────────────

const labels = conversationRedesignLabels.en;

// ─── Arbitraries ─────────────────────────────────────────────────────────────

/**
 * Generate random valid prop combinations for BubbleContextMenu.
 * Covers all boolean flags and optional messageBody.
 */
const bubbleContextMenuPropsArb = fc.record({
  allowReactions: fc.boolean(),
  canEdit: fc.boolean(),
  canDelete: fc.boolean(),
  isOwn: fc.boolean(),
  messageBody: fc.option(fc.string({ minLength: 0, maxLength: 500 }), { nil: undefined }),
});

// ─── Property Tests ──────────────────────────────────────────────────────────

describe("Property 1: Error-Free Rendering", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    consoleErrorSpy.mockRestore();
  });

  fcTest.prop(
    [bubbleContextMenuPropsArb],
    { numRuns: 50, timeout: 30_000 },
  )(
    "renders without console errors or exceptions for any valid props combination",
    (props) => {
      // Assert no exception is thrown during render
      expect(() => {
        render(
          <BubbleContextMenu
            allowReactions={props.allowReactions}
            canEdit={props.canEdit}
            canDelete={props.canDelete}
            isOwn={props.isOwn}
            labels={labels}
            messageBody={props.messageBody}
            onAddReaction={vi.fn().mockResolvedValue(undefined)}
            onCopy={vi.fn()}
            onDelete={vi.fn()}
            onEdit={vi.fn()}
            onInfo={vi.fn()}
            onReply={vi.fn()}
            onReport={vi.fn()}
          />,
        );
      }).not.toThrow();

      // Assert no console.error was called during render
      expect(consoleErrorSpy).not.toHaveBeenCalled();

      // Cleanup between iterations
      cleanup();
    },
  );
});
