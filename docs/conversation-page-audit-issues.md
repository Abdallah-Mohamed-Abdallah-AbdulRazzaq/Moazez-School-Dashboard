# Conversation Page Audit — Issue Documentation Report

## Summary

This document catalogs all issues discovered during the comprehensive audit of the Conversation Page in the SIS Dashboard communication module. Each issue is categorized by type, assigned a severity level, and includes reproduction steps and a proposed fix.

**Total Issues Found:** 6
- Critical: 1
- Major: 3
- Minor: 2

---

## Runtime Errors

### Issue 1: "Cannot access refs during render" in BubbleContextMenu

**Severity:** Critical
**Category:** Runtime Error
**Component:** `BubbleContextMenu` (`src/features/communication/conversations_redesign/components/messages/BubbleContextMenu.tsx`)

**Reproduction Steps:**
1. Open the Conversation Page and select a conversation with messages
2. Hover over any message bubble to reveal the context menu trigger button
3. Click the chevron button to open the BubbleContextMenu
4. Observe the browser console — a React error is logged:
   ```
   Error: Cannot access refs during render
   ```

**Actual Behavior:**
React 19 strict mode detects that `refs.setFloating` (a callback ref from `@floating-ui/react`) is accessed during render when passed directly as a ref prop on line 90:
```tsx
<div
  ref={refs.setFloating}  // ← triggers the error
  style={floatingStyles}
  ...
>
```
The error appears each time the menu opens. While the menu still functions visually, this violates React's ref access rules and may cause missed updates or stale positioning in edge cases.

**Expected Behavior:**
The floating menu should open and position itself without triggering any React errors or warnings.

**Proposed Fix:**

Option A — Use `useRef` + `useEffect` to defer ref assignment:
```tsx
import { useEffect, useRef, useState } from "react";
import { useFloating, offset, flip, shift, autoUpdate } from "@floating-ui/react";

export function BubbleContextMenu({ /* props */ }) {
  const [open, setOpen] = useState(false);
  const floatingRef = useRef<HTMLDivElement | null>(null);

  const { refs, floatingStyles } = useFloating({
    open,
    placement: isOwn ? "bottom-start" : "bottom-end",
    middleware: [offset(4), flip({ fallbackPlacements: ["top-start", "top-end", "bottom"] }), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  // Defer setting the floating element to an effect (avoids ref access during render)
  useEffect(() => {
    if (floatingRef.current) {
      refs.setFloating(floatingRef.current);
    }
  }, [open, refs]);

  return (
    // ...
    {open ? (
      <div
        ref={floatingRef}  // ← local ref, no render-time access
        style={floatingStyles}
        // ...
      >
        {/* menu items */}
      </div>
    ) : null}
    // ...
  );
}
```

Option B — Upgrade `@floating-ui/react` to v0.27+ and use the `elements` option:
```tsx
import { useRef, useState } from "react";
import { useFloating, offset, flip, shift, autoUpdate } from "@floating-ui/react";

export function BubbleContextMenu({ /* props */ }) {
  const [open, setOpen] = useState(false);
  const [referenceEl, setReferenceEl] = useState<HTMLButtonElement | null>(null);
  const [floatingEl, setFloatingEl] = useState<HTMLDivElement | null>(null);

  const { floatingStyles } = useFloating({
    open,
    elements: { reference: referenceEl, floating: floatingEl },
    placement: isOwn ? "bottom-start" : "bottom-end",
    middleware: [offset(4), flip({ fallbackPlacements: ["top-start", "top-end", "bottom"] }), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  return (
    // ...
    <button ref={setReferenceEl} /* ... */ />
    {open ? (
      <div ref={setFloatingEl} style={floatingStyles} /* ... */>
        {/* menu items */}
      </div>
    ) : null}
    // ...
  );
}
```

**Related Requirements:** 1.2, 1.3, 12.1

---

## Performance Issues

### Issue 2: ConversationDetail Excessive State Complexity

**Severity:** Major
**Category:** Performance
**Component:** `ConversationDetail` (`src/features/communication/conversations_redesign/components/ConversationDetail.tsx`)

**Reproduction Steps:**
1. Open the Conversation Page and select any conversation
2. Profile the component using React DevTools Profiler
3. Observe that `ConversationDetail` manages 14 `useState` calls and 13 custom hooks
4. Perform any action (open a dialog, switch tabs, receive a message) and observe cascading re-renders across the entire component tree

**Actual Behavior:**
The component has grown to ~900 lines with:
- **14 `useState` declarations:** `activeTab`, `loadedTabs`, `isAddParticipantOpen`, `participantEditState`, `participantToRemove`, `isLeaveConversationOpen`, `isInviteOpen`, `isJoinRequestOpen`, `rejectInvite`, `reviewRequest`, `isEditConversationOpen`, `isMutatingConversation`, `replyTo`, `editingMessage`
- **13 custom hooks:** `useConversation`, `useConversationMessages`, `useConversationParticipants`, `useConversationInvites`, `useConversationJoinRequests`, `usePresence`, `useTypingIndicator`, `useCommunicationPolicy`, `useMessageReactions`, `useMessageAttachments`, `useConversationRealtime`, `useLocale`, `useAuth`
- **Multiple `useMemo` and `useCallback`** computations for derived state

Any state change (e.g., opening a dialog) triggers a re-render of the entire component, including all child panels and their props recalculation.

**Expected Behavior:**
State should be colocated with the components that use it. Dialog state changes should not cause re-renders in the messages panel or other unrelated sections.

**Proposed Fix:**

Strategy 1 — Extract dialog state into a `useDialogManager` hook:
```tsx
// useDialogManager.ts
import { useState, useCallback } from "react";

interface DialogState {
  isAddParticipantOpen: boolean;
  participantEditState: { mode: ParticipantDialogMode; participant: ConversationParticipant } | null;
  participantToRemove: ConversationParticipant | null;
  isLeaveConversationOpen: boolean;
  isInviteOpen: boolean;
  isJoinRequestOpen: boolean;
  rejectInvite: ConversationInvite | null;
  reviewRequest: { mode: ReviewJoinRequestMode; request: ConversationJoinRequest } | null;
  isEditConversationOpen: boolean;
}

export function useDialogManager() {
  const [state, setState] = useState<DialogState>({
    isAddParticipantOpen: false,
    participantEditState: null,
    participantToRemove: null,
    isLeaveConversationOpen: false,
    isInviteOpen: false,
    isJoinRequestOpen: false,
    rejectInvite: null,
    reviewRequest: null,
    isEditConversationOpen: false,
  });

  const open = useCallback((key: keyof DialogState, value?: unknown) => {
    setState(prev => ({ ...prev, [key]: value ?? true }));
  }, []);

  const close = useCallback((key: keyof DialogState) => {
    setState(prev => ({ ...prev, [key]: key.startsWith("is") ? false : null }));
  }, []);

  return { dialogState: state, openDialog: open, closeDialog: close };
}
```

Strategy 2 — Use `useReducer` for related state groups:
```tsx
type DetailAction =
  | { type: "SET_TAB"; tab: DetailTab }
  | { type: "SET_REPLY"; payload: { id: string; senderName: string; body: string } | null }
  | { type: "SET_EDITING"; payload: { id: string; body: string } | null }
  | { type: "OPEN_DIALOG"; dialog: string; payload?: unknown }
  | { type: "CLOSE_DIALOG"; dialog: string };

function detailReducer(state: DetailState, action: DetailAction): DetailState {
  switch (action.type) {
    case "SET_TAB":
      return { ...state, activeTab: action.tab, loadedTabs: { ...state.loadedTabs, [action.tab]: true } };
    case "SET_REPLY":
      return { ...state, replyTo: action.payload, editingMessage: null };
    case "SET_EDITING":
      return { ...state, editingMessage: action.payload, replyTo: null };
    // ... other cases
  }
}
```

Strategy 3 — Extract a `ConversationDetailContext` to prevent prop drilling and isolate re-renders:
```tsx
const ConversationDetailContext = createContext<ConversationDetailContextValue | null>(null);

function ConversationDetailProvider({ conversationId, children }) {
  // Move all hooks and state here
  // Children only re-render when their specific consumed context slice changes
}
```

**Related Requirements:** 2.1, 2.2, 2.3, 12.2

---

### Issue 3: MessagesPanel Hardcoded `dir="ltr"` Breaks RTL Layout

**Severity:** Major
**Category:** UX Inconsistency
**Component:** `MessagesPanel` (`src/features/communication/conversations_redesign/components/messages/MessagesPanel.tsx`)

**Reproduction Steps:**
1. Set the application locale to Arabic (`ar`)
2. Navigate to the Conversation Page and select a conversation
3. Observe the messages panel scroll container

**Actual Behavior:**
The `MessagesPanel` root `<div>` has a hardcoded `dir="ltr"` attribute (line 130):
```tsx
<div ref={scrollRef} dir="ltr" className={`h-full overflow-y-auto px-4 py-8 ...`}>
```
This forces left-to-right direction regardless of the active locale, which means:
- Scrollbar appears on the right side even in RTL mode
- Text alignment within the container may conflict with child elements using logical properties (`start`/`end`)
- The overall layout direction is inconsistent with the rest of the page in Arabic locale

**Expected Behavior:**
The messages panel should respect the document's direction or use the locale-appropriate direction. If `dir="ltr"` was intentional for message ordering (newest at bottom), it should be applied only to the scroll behavior, not the entire container's text direction.

**Proposed Fix:**
```tsx
// Remove hardcoded dir="ltr" and let the container inherit direction from the page
<div ref={scrollRef} className={`h-full overflow-y-auto px-4 py-8 ${isScrollReady ? "opacity-100" : "opacity-0"}`}>

// If LTR scroll behavior is needed for a specific reason, use CSS instead:
// .messages-scroll { direction: ltr; }
// .messages-scroll > * { direction: inherit; } /* children follow page direction */
```

Alternatively, if the intent is to keep messages visually ordered left-to-right while respecting text direction within bubbles:
```tsx
<div ref={scrollRef} className="h-full overflow-y-auto px-4 py-8">
  <div dir={locale === "ar" ? "rtl" : "ltr"} className="mx-auto flex min-h-full max-w-[1500px] flex-col gap-0.5">
    {/* message content */}
  </div>
</div>
```

**Related Requirements:** 13.3, 12.3

---

### Issue 4: MessagesPanel Scroll-to-Bottom Uses `messages.length` Dependency

**Severity:** Major
**Category:** Performance
**Component:** `MessagesPanel` (`src/features/communication/conversations_redesign/components/messages/MessagesPanel.tsx`)

**Reproduction Steps:**
1. Open a conversation with many messages
2. Scroll up to read older messages (more than 150px from bottom)
3. Receive a new message from another user via real-time socket event
4. Observe that the scroll position is preserved (correct)
5. Now scroll to near the bottom (within 150px) and receive another message
6. Observe the smooth scroll to bottom

**Actual Behavior:**
The scroll effect depends on `messages.length` as its only dependency:
```tsx
useEffect(() => {
  // ...
  if (messages.length > prevMessageCountRef.current) {
    const wasNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
    if (wasNearBottom) {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    }
  }
  prevMessageCountRef.current = messages.length;
}, [messages.length]);
```

This has two issues:
1. **Message edits/deletes that don't change array length** won't trigger the effect, which is fine, but...
2. **Loading older messages** (prepending) also increases `messages.length`, which triggers the "near bottom" check. If the user happens to be near the bottom when older messages load, the panel will incorrectly scroll to the absolute bottom, losing their reading position.

**Expected Behavior:**
The scroll-to-bottom logic should only activate for new messages appended at the end, not for older messages prepended at the top.

**Proposed Fix:**
```tsx
useEffect(() => {
  if (!scrollRef.current) return;
  const container = scrollRef.current;

  if (isInitialLoadRef.current) {
    container.scrollTop = container.scrollHeight;
    isInitialLoadRef.current = false;
    prevMessageCountRef.current = messages.length;
    setIsScrollReady(true);
    return;
  }

  // Only scroll to bottom if messages were APPENDED (new messages), not prepended (older messages)
  const newCount = messages.length;
  const prevCount = prevMessageCountRef.current;
  if (newCount > prevCount && !isLoadingOlder) {
    const wasNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 150;
    if (wasNearBottom) {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    }
  }
  prevMessageCountRef.current = newCount;
}, [messages.length, isLoadingOlder]);
```

**Related Requirements:** 2.2, 12.3

---

## Accessibility Gaps

### Issue 5: BubbleContextMenu Lacks Keyboard Navigation and ARIA Attributes

**Severity:** Minor
**Category:** Accessibility
**Component:** `BubbleContextMenu` (`src/features/communication/conversations_redesign/components/messages/BubbleContextMenu.tsx`)

**Reproduction Steps:**
1. Navigate to a conversation with messages
2. Attempt to open the context menu using keyboard only (Tab to the trigger, Enter/Space to open)
3. Attempt to navigate menu items with arrow keys
4. Check for screen reader announcements

**Actual Behavior:**
- The trigger button has no `aria-expanded`, `aria-haspopup`, or `aria-label` attributes
- The floating menu has no `role="menu"` attribute
- Menu items have no `role="menuitem"` attributes
- No keyboard navigation (Arrow Up/Down) is implemented for menu items
- No focus trap within the open menu
- The menu only closes via mouse click outside (no Escape key handler)

**Expected Behavior:**
The context menu should follow WAI-ARIA Menu Button pattern:
- Trigger has `aria-expanded`, `aria-haspopup="menu"`, and a descriptive `aria-label`
- Menu container has `role="menu"`
- Menu items have `role="menuitem"`
- Arrow keys navigate between items
- Escape closes the menu and returns focus to the trigger
- Focus is trapped within the menu when open

**Proposed Fix:**
```tsx
<button
  ref={refs.setReference}
  type="button"
  aria-expanded={open}
  aria-haspopup="menu"
  aria-label={labels.messageActions ?? "Message actions"}
  onClick={() => setOpen((prev) => !prev)}
  onKeyDown={(e) => {
    if (e.key === "Escape") setOpen(false);
    if (e.key === "ArrowDown" && !open) setOpen(true);
  }}
  className={/* ... */}
>
  <ChevronDown className="h-3.5 w-3.5" />
</button>

{open ? (
  <div
    ref={refs.setFloating}
    style={floatingStyles}
    role="menu"
    aria-label={labels.messageActions ?? "Message actions"}
    onKeyDown={(e) => {
      if (e.key === "Escape") {
        setOpen(false);
        // Return focus to trigger
      }
      // Arrow key navigation between menuitem elements
    }}
  >
    <button role="menuitem" /* ... */>{labels.reply}</button>
    {/* ... other items */}
  </div>
) : null}
```

Consider using `@floating-ui/react`'s `useInteractions`, `useRole`, `useDismiss`, and `useListNavigation` hooks for a complete accessible implementation.

**Related Requirements:** 12.3, 12.4

---

### Issue 6: MessagesPanel Typing Indicator Lacks Accessible Announcement

**Severity:** Minor
**Category:** Accessibility
**Component:** `MessagesPanel` (`src/features/communication/conversations_redesign/components/messages/MessagesPanel.tsx`)

**Reproduction Steps:**
1. Open a conversation where another user starts typing
2. Use a screen reader to listen for announcements
3. Observe that the typing indicator appears visually but is not announced

**Actual Behavior:**
The typing indicator is rendered as a plain `<div>` with visual dots and text:
```tsx
{typingUsers.length > 0 ? (
  <div className="flex items-center gap-2 text-xs italic text-slate-500">
    <span className="flex gap-1">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
      {/* dots */}
    </span>
    {typingUsers.map(u => u.name).join(", ")} {labels.typing}
  </div>
) : null}
```
Screen readers will not announce when this element appears or disappears because there is no ARIA live region.

**Expected Behavior:**
The typing indicator should be announced to screen reader users when it appears and when it disappears.

**Proposed Fix:**
```tsx
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  className="flex items-center gap-2 text-xs italic text-slate-500"
>
  {typingUsers.length > 0 ? (
    <>
      <span className="flex gap-1" aria-hidden="true">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
      </span>
      <span>
        {typingUsers.map(u => u.name || displayNameForUserId(u.userId, userDisplayNames, labels.someone)).join(", ")}{" "}
        {labels.typing}
      </span>
    </>
  ) : null}
</div>
```

The key change is wrapping the typing indicator in a persistent `aria-live="polite"` region so screen readers announce content changes. The dots are marked `aria-hidden="true"` since they are decorative.

**Related Requirements:** 12.3, 12.4

---

## Issue Summary Table

| # | Title | Severity | Category | Component | Requirements |
|---|-------|----------|----------|-----------|--------------|
| 1 | Cannot access refs during render | Critical | Runtime Error | BubbleContextMenu | 1.2, 1.3, 12.1 |
| 2 | Excessive state complexity (14 useState, 13 hooks) | Major | Performance | ConversationDetail | 2.1, 2.2, 2.3, 12.2 |
| 3 | Hardcoded `dir="ltr"` breaks RTL layout | Major | UX Inconsistency | MessagesPanel | 13.3, 12.3 |
| 4 | Scroll-to-bottom triggers on older message load | Major | Performance | MessagesPanel | 2.2, 12.3 |
| 5 | Missing keyboard navigation and ARIA attributes | Minor | Accessibility | BubbleContextMenu | 12.3, 12.4 |
| 6 | Typing indicator lacks accessible announcement | Minor | Accessibility | MessagesPanel | 12.3, 12.4 |
