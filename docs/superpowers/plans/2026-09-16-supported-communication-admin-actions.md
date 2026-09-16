# Supported Communication Admin Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expose the Communication administration actions that backend `origin/main` at `8d30148527808dc24ede7a26f9a189a41eeb5d73` currently enforces, while keeping unsupported restriction and block enforcement out of the frontend capability model.

**Architecture:** A pure authorization module combines session permissions with conversation, participant, message, and attachment state. Conversation and Safety screens consume those capabilities, while a shared moderation command path handles cross-user deletion and hide/unhide operations through the existing moderation endpoint. Existing UI primitives under `src/components/ui` remain the source for buttons, dialogs, inputs, and feedback.

**Tech Stack:** Next.js 16, React 19, TypeScript, next-intl, Vitest, Testing Library, existing Communication REST/socket hooks.

**Spec:** `docs/superpowers/specs/2026-09-16-communication-admin-authorization-design.md`

## Global Constraints

- Implement only behavior verified against backend commit `8d30148527808dc24ede7a26f9a189a41eeb5d73`.
- Do not expose `restrict_sender`, school-wide block management, or restriction/block-based send eligibility until `docs/communication-admin-authorization-backend-requirements.md` is completed by the backend.
- Do not treat `allowMessageEdit` or `allowMessageDelete` as security gates because the reviewed backend does not enforce them.
- Sending always requires an active participant and `communication.messages.send`; read-only bypass additionally accepts `communication.messages.moderate`, `communication.admin.manage`, or participant role `owner`, `admin`, or `moderator`.
- Cross-user message editing and attachment linking require an active participant; cross-user moderation deletion does not.
- Reuse components from `src/components/ui` for changed UI.
- Run Clean Code Guard after every production-code task and Test Guard after every test-code task.
- Run focused tests only unless the repository owner separately approves the full suite.

---

### Task 1: Centralize supported Communication capabilities

**Files:**
- Create: `src/features/communication/authorization/communication-capabilities.ts`
- Create: `src/features/communication/authorization/communication-capabilities.test.ts`
- Modify: `src/features/communication/utils/conversation-permissions.ts`
- Modify: `src/features/communication/utils/conversation-permissions.test.ts`

**Interfaces:**
- Consumes: `PermissionKey`, `Conversation`, `ConversationParticipant`, `Message`, and `MessageAttachment`.
- Produces: `getCommunicationModuleCapabilities`, `getCommunicationConversationCapabilities`, and `getCommunicationMessageCapabilities` pure functions.

- [ ] **Step 1: Write failing table-driven capability tests**

Cover global conversation/participant management without a participant role; active-participant requirements for sending, editing another user's message, and attachment linking; read-only bypass roles/permissions; moderation deletion for a non-participant; hidden/deleted state transitions; and exclusion of block/restriction flags.

```ts
expect(getCommunicationConversationCapabilities({
  permissions: ["communication.conversations.manage"],
  currentUserId: "admin-1",
  participants: [],
  conversation,
}).canManageConversation).toBe(true);

expect(getCommunicationMessageCapabilities({
  permissions: ["communication.messages.moderate"],
  currentUserId: "admin-1",
  isActiveParticipant: false,
  conversation,
  message: otherUsersMessage,
}).deleteMode).toBe("moderation");
```

- [ ] **Step 2: Run the focused tests and verify failure**

Run: `npm run test:run -- src/features/communication/authorization/communication-capabilities.test.ts src/features/communication/utils/conversation-permissions.test.ts`

Expected: FAIL because the new module and permission-aware behavior do not exist.

- [ ] **Step 3: Implement the pure capability model**

Define explicit results and keep endpoint selection in the model:

```ts
export type MessageDeleteMode = "self" | "moderation" | null;

export interface CommunicationMessageCapabilities {
  canEditMessage: boolean;
  canAddAttachment: boolean;
  canRemoveAttachment: boolean;
  canHideMessage: boolean;
  canUnhideMessage: boolean;
  canViewModerationHistory: boolean;
  deleteMode: MessageDeleteMode;
}
```

Make `getConversationPermissionFlags` an adapter over the centralized conversation result so legacy consumers cannot retain conflicting participant-role rules.

- [ ] **Step 4: Run focused tests**

Run the Task 1 command and expect PASS.

- [ ] **Step 5: Run Clean Code Guard and Test Guard, then commit**

Commit: `feat(communication): centralize supported admin capabilities`

### Task 2: Apply global conversation and participant management rules

**Files:**
- Modify: `src/features/communication/conversations_redesign/components/ConversationDetail.tsx`
- Modify: `src/features/communication/__tests__/components/ConversationDetail.test.tsx`
- Modify: `src/features/communication/__tests__/components/ParticipantsPanel.test.tsx`
- Modify: `src/features/communication/__tests__/components/InvitesPanel.test.tsx`
- Modify: `src/features/communication/__tests__/components/JoinRequestsPanel.test.tsx`

**Interfaces:**
- Consumes: Task 1 conversation/module capability functions and existing `hasPermission` values.
- Produces: permission-correct props for `ConversationHeader`, participant panels, invite panels, join-request panels, realtime joining, and composer selection.

- [ ] **Step 1: Add failing component tests**

Verify a user with `communication.conversations.manage` or `communication.participants.manage` sees the corresponding controls without a manager participant role. Verify sending remains unavailable to non-participants, and an active `owner`, `admin`, or `moderator` can send in read-only mode.

- [ ] **Step 2: Run focused component tests and verify failure**

Run: `npm run test:run -- src/features/communication/__tests__/components/ConversationDetail.test.tsx src/features/communication/__tests__/components/ParticipantsPanel.test.tsx src/features/communication/__tests__/components/InvitesPanel.test.tsx src/features/communication/__tests__/components/JoinRequestsPanel.test.tsx`

- [ ] **Step 3: Replace local permission conjunctions**

Use the centralized result instead of requiring both a manager participant role and a global permission. Remove checks of unsupported `participant.isBlocked` and `participant.isRestricted`. Keep mute, participant lifecycle, policy-enabled, closed, and archived guards.

```ts
const capabilities = getCommunicationConversationCapabilities({
  permissions: grantedPermissions,
  currentUserId: user?.id,
  participants: participantsState.participants,
  conversation,
});
```

- [ ] **Step 4: Run focused tests**

Run the Task 2 command and expect PASS.

- [ ] **Step 5: Run Clean Code Guard and Test Guard, then commit**

Commit: `feat(communication): expose supported conversation administration`

### Task 3: Add a shared supported moderation command path

**Files:**
- Create: `src/features/communication/hooks/useMessageModeration.ts`
- Create: `src/features/communication/__tests__/hooks/useMessageModeration.test.ts`
- Modify: `src/features/communication/types/safety.types.ts`
- Modify: `src/features/communication/hooks/useModerationActions.ts`
- Modify: `src/features/communication/hooks/useMessageReport.ts`
- Modify: `src/features/communication/__tests__/communicationService.test.ts`

**Interfaces:**
- Consumes: existing `createModerationAction`, `getModerationActions`, and message refresh functions.
- Produces: `runMessageModeration({ messageId, action, reason })` accepting only `hide | unhide | delete`, plus state-preserving realtime reconciliation.

- [ ] **Step 1: Write failing hook and service tests**

Verify the dispatcher requires a trimmed reason, sends canonical actions only, refreshes after failure, and preserves `hidden` when a `messageDeleted` socket payload carries `status: "hidden"`.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `npm run test:run -- src/features/communication/__tests__/hooks/useMessageModeration.test.ts src/features/communication/__tests__/communicationService.test.ts`

- [ ] **Step 3: Implement canonical moderation types and dispatcher**

```ts
export type SupportedModerationAction = "hide" | "unhide" | "delete";

await createModerationAction(messageId, {
  action,
  reason: reason.trim(),
});
```

Remove `restrict_sender`, `user_restricted`, and message-state aliases from submit-capable frontend types. Keep historical action presentation tolerant of aliases returned by older records.

- [ ] **Step 4: Fix socket reconciliation**

Use the payload's normalized status rather than forcing every `messageDeleted` event to `deleted`; clear the body for both hidden and deleted payloads without inventing `deletedAt` for hidden messages.

- [ ] **Step 5: Run focused tests**

Run the Task 3 command and expect PASS.

- [ ] **Step 6: Run Clean Code Guard and Test Guard, then commit**

Commit: `fix(communication): reconcile supported moderation actions`

### Task 4: Expose cross-user message and attachment actions

**Files:**
- Create: `src/features/communication/components/safety/MessageModerationDialog.tsx`
- Modify: `src/features/communication/conversations_redesign/components/messages/BubbleContextMenu.tsx`
- Modify: `src/features/communication/conversations_redesign/components/messages/MessageBubble.tsx`
- Modify: `src/features/communication/conversations_redesign/components/messages/MessagesPanel.tsx`
- Modify: `src/features/communication/conversations_redesign/components/ConversationDetail.tsx`
- Modify: `src/features/communication/conversations_redesign/labels.ts`
- Modify: `src/features/communication/__tests__/components/BubbleContextMenu.test.tsx`
- Modify: `src/features/communication/__tests__/components/MessageBubble.test.tsx`
- Modify: `src/features/communication/__tests__/components/MessagesPanel.test.tsx`

**Interfaces:**
- Consumes: Task 1 message capabilities and Task 3 moderation dispatcher.
- Produces: desktop/mobile controls for cross-user edit, moderation delete, add/remove attachment, hide, unhide, and moderation-history navigation.

- [ ] **Step 1: Add failing action-visibility tests**

Cover own ordinary delete versus cross-user moderation delete, the cross-user edit confirmation, active-participant attachment linking, manager attachment removal, hidden-message unhide/delete controls, and no controls for deleted messages.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `npm run test:run -- src/features/communication/__tests__/components/BubbleContextMenu.test.tsx src/features/communication/__tests__/components/MessageBubble.test.tsx src/features/communication/__tests__/components/MessagesPanel.test.tsx`

- [ ] **Step 3: Pass per-message capabilities through the message tree**

Replace global booleans that are combined with `isOwn` inside `MessageBubble` with one capability result per message. Preserve ordinary own-message deletion and route cross-user deletion through moderation.

- [ ] **Step 4: Add shared confirmations with existing UI primitives**

Use `ConfirmDialog`, `Button`, and existing input components. Cross-user edit must warn that the original author's text changes. Hide, unhide, and moderation delete require a non-empty reason.

- [ ] **Step 5: Wire supported mutations and targeted refresh**

After success, refresh only the affected message/history/attachments. On failure, discard optimistic state, refresh the affected resource, and display `communicationErrorMessage` output.

- [ ] **Step 6: Run focused tests**

Run the Task 4 command and expect PASS.

- [ ] **Step 7: Run Clean Code Guard and Test Guard, then commit**

Commit: `feat(communication): expose supported cross-user message actions`

### Task 5: Make Reports and Moderation discoverable without unsupported Safety controls

**Files:**
- Create: `src/features/communication/components/safety/SafetyNavigation.tsx`
- Create: `src/features/communication/components/safety/SafetyNavigation.test.tsx`
- Modify: `src/features/communication/components/layout/CommunicationTabs.tsx`
- Modify: `src/features/communication/components/safety/ModerationActionForm.tsx`
- Modify: `src/features/communication/pages/ModerationPage.tsx`
- Modify: `src/features/communication/pages/MessageReportsPage.tsx`
- Modify: `src/features/communication/pages/MessageReportDetailsPage.tsx`
- Create: `src/features/communication/__tests__/pages/MessageReportDetailsPage.test.tsx`
- Modify: `src/app/[lang]/(dashboard)/communication/moderation/page.tsx`
- Modify: `src/app/[lang]/(dashboard)/communication/moderation/[reportId]/page.tsx`

**Interfaces:**
- Consumes: `communication.messages.moderate`, Task 3 dispatcher, and existing report status workflow.
- Produces: canonical Safety navigation for Reports and Moderation only, compatibility redirects from legacy report routes, and direct hide/unhide/delete controls on report details.

- [ ] **Step 1: Write failing navigation and report-action tests**

Verify the Safety tab points to `/communication/safety/reports`, navigation exposes Reports and Moderation, restrictions/blocks are not advertised, report details can hide/unhide/delete without resolving the report, and deleted messages have no mutation action.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `npm run test:run -- src/features/communication/components/safety/SafetyNavigation.test.tsx src/features/communication/__tests__/pages/MessageReportDetailsPage.test.tsx`

- [ ] **Step 3: Implement Safety navigation and redirects**

Use the existing UI-link styling and localized labels. Keep old `/communication/moderation` routes as redirects to `/communication/safety/reports`; do not expose the existing restrictions/blocks pages until backend enforcement lands.

- [ ] **Step 4: Reduce moderation actions to canonical supported operations**

`ModerationActionForm` renders only state-valid `hide`, `unhide`, and `delete`. It does not render aliases or `restrict_sender`.

- [ ] **Step 5: Add direct report moderation**

Reuse `MessageModerationDialog`; keep report status and resolution as a separate explicit action.

- [ ] **Step 6: Run focused tests**

Run the Task 5 command and expect PASS.

- [ ] **Step 7: Run Clean Code Guard and Test Guard, then commit**

Commit: `feat(communication): expose supported safety workflows`

### Task 6: Final focused verification and handoff

**Files:**
- Modify if implementation decisions changed: `docs/superpowers/specs/2026-09-16-communication-admin-authorization-design.md`
- Modify if backend prerequisites changed: `docs/communication-admin-authorization-backend-requirements.md`

**Interfaces:**
- Consumes: all prior tasks.
- Produces: a reviewable branch with evidence for the supported subset and explicit deferred limitations.

- [ ] **Step 1: Run all changed Communication test files**

Run only the focused test paths listed in Tasks 1–5. Do not run `npm run test:run` without file arguments unless the owner explicitly approves the full suite.

- [ ] **Step 2: Run static verification**

Run: `npx eslint src/features/communication`

Run: `npm run typecheck`

- [ ] **Step 3: Run production build**

Run: `npm run build`

- [ ] **Step 4: Run final guards**

Run Clean Code Guard over all changed production files, Test Guard over all changed tests, and Documentation Guard over changed docs.

- [ ] **Step 5: Confirm deferred behavior**

Search the changed UI for `restrict_sender`, `isBlocked`, and `isRestricted`. No new capability or visible action may depend on them. Existing backend-management pages may remain in source but must not be newly advertised.

- [ ] **Step 6: Commit final documentation/verification adjustments**

Commit: `docs(communication): record supported admin delivery scope`
