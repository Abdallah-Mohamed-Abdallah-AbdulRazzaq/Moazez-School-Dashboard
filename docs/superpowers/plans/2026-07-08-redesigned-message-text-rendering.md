# Redesigned Message Text Rendering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add WhatsApp-like safe rendering to `conversations_redesign` message bubbles.

**Architecture:** Keep message storage and sending as plain text. Render display text through a small React parser that recognizes lightweight formatting, auto-links URLs, preserves line breaks, and lets the bubble collapse very long messages.

**Tech Stack:** React 19, TypeScript, Vitest, Testing Library, Tailwind CSS.

## Global Constraints

- Do not render user-provided HTML.
- Do not add a markdown dependency for this narrow subset.
- Keep behavior scoped to `src/features/communication/conversations_redesign`.
- Preserve existing message actions, reply, attachment, reaction, and status behavior.

---

### Task 1: Failing Coverage

**Files:**
- Modify: `src/features/communication/__tests__/components/MessageBubble.test.tsx`

**Interfaces:**
- Consumes: `MessageBubble` props already used by existing tests.
- Produces: coverage for URL links, inline formatting, and long message expansion.

- [ ] Add tests that render a redesigned `MessageBubble` and expect formatted text, a safe URL anchor, collapsed long text, and expand/collapse buttons.
- [ ] Run `npm run test:run -- src/features/communication/__tests__/components/MessageBubble.test.tsx` and confirm the new tests fail because the feature is missing.

### Task 2: Renderer Implementation

**Files:**
- Create: `src/features/communication/conversations_redesign/components/messages/MessageText.tsx`
- Modify: `src/features/communication/conversations_redesign/components/messages/MessageBubble.tsx`
- Modify: `src/features/communication/conversations_redesign/labels.ts`

**Interfaces:**
- Produces: `MessageText({ text, isOwn, readMoreLabel, showLessLabel })`.
- Consumes: `labels.readMore` and `labels.showLess`.

- [ ] Implement a safe text renderer that tokenizes URLs and `*bold*`, `_italic_`, `~strikethrough~`, and triple-backtick monospace spans.
- [ ] Collapse messages longer than 700 characters or 8 lines and show `readMoreLabel`; expanded messages show `showLessLabel`.
- [ ] Replace raw `<p>{message.body}</p>` rendering in the redesigned bubble with `MessageText`.
- [ ] Add `readMore` and `showLess` keys to English and Arabic label objects.
- [ ] Run the focused test file and fix failures.

### Task 3: Verification

**Files:**
- No additional files.

- [ ] Run `npm run typecheck`.
- [ ] Run `npm run test:run -- src/features/communication/__tests__/components/MessageBubble.test.tsx`.
- [ ] Run `npm run lint -- src/features/communication/conversations_redesign/components/messages/MessageText.tsx src/features/communication/conversations_redesign/components/messages/MessageBubble.tsx src/features/communication/conversations_redesign/labels.ts src/features/communication/__tests__/components/MessageBubble.test.tsx`.
