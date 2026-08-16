# Implementation Plan: Messages Panel Component Split

## Overview

This plan executes a behavior-preserving structural refactor of `src/features/communication/conversations_redesign/components/MessagesPanel.tsx` into ten focused files under a new `messages/` subfolder, while keeping the original module path as a thin re-export barrel so consumers (notably `ConversationDetail.tsx`) compile unchanged.

The work proceeds in dependency order:

1. Capture the Pre_Refactor_Baseline tooling outputs (tsc, eslint, build) on the current branch before any code is moved.
2. Create the leaf files (`reactionOptions.ts`, `MessageStatusIcon.tsx`, `AttachmentCard.tsx`, `EmojiPickerButton.tsx`, `BubbleContextMenu.tsx`, `FloatingReactionBar.tsx`).
3. Create the composite files (`MessageBubble.tsx`, `ReadOnlyComposer.tsx`, `MessageComposer.tsx`, `MessagesPanel.tsx`).
4. Replace the original `components/MessagesPanel.tsx` with the three-line barrel.
5. Run the verification stack defined in the design's Testing Strategy and compare each output to the baseline.

Per the design's "PBT applicability" decision, no property-based tests are added; verification is type-check + lint + build + static diff audit + (optional) scripted manual smoke pass.

All new files use TypeScript / TSX, matching the existing Source_File and the project's tooling.

## Tasks

- [x] 1. Capture Pre_Refactor_Baseline tooling outputs
  - [x] 1.1 Capture baseline `tsc`, `eslint`, and `next build` outputs before any code is moved
    - On the current branch (still containing the unmodified Source_File), run `npx tsc --noEmit`, `npm run lint`, and `npm run build` and write each command's full stdout+stderr to a fixed location (e.g., `.kiro/specs/messages-panel-component-split/baseline/tsc.txt`, `eslint.txt`, `build.txt`) so post-refactor runs can be diff-compared
    - Also save a verbatim copy of the current `components/MessagesPanel.tsx` (e.g., to `.kiro/specs/messages-panel-component-split/baseline/MessagesPanel.original.tsx`) to enable the static diff audit in task 7.4
    - Do not modify any source file in this task
    - _Requirements: Pre_Refactor_Baseline (Glossary), 6.1, 6.2, 6.3, 6.4_

- [x] 2. Create leaf files under `src/features/communication/conversations_redesign/components/messages/`
  - [x] 2.1 Create `messages/reactionOptions.ts` with the `REACTION_OPTIONS` constant
    - Export named `REACTION_OPTIONS` with the identical TypeScript annotation `{ type: ReactionType; icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>; label: string; color: string; }[]` and the eight entries in the identical order (`thumbs_up, love, laugh, wow, sad, angry, thumbs_down, like`) copied byte-for-byte from the Source_File
    - Imports: `type ComponentType` from `react`; `type ReactionType` from `@/features/communication/types/message.types`; from `lucide-react` only the icons actually referenced in entries (`ThumbsUp`, `Heart`, `Laugh`, `SmilePlus`, `Frown`, `Angry`, `ThumbsDown` — `ThumbsUp` is reused for the `like` entry)
    - No JSX, no React hooks, no other exports
    - _Requirements: 2.7, 2.8, 5.1_

  - [x] 2.2 Create `messages/MessageStatusIcon.tsx`
    - Named export `MessageStatusIcon` with the same prop signature `{ deliveryStatus, isRead, isOwn }` and the same JSX body (clock for `pending`, red `!` for `failed`, blue `CheckCheck` for read, light single check otherwise) as in the Source_File
    - Preserve every inline `style` object verbatim (`opacity: 0.6`, `marginTop: "auto"`, `marginBottom: "4px"`, `color: "#38bdf8"`)
    - Imports: `lucide-react` (`CheckCheck`, `Clock`)
    - _Requirements: 2.5, 4.6, 4.9_

  - [x] 2.3 Create `messages/AttachmentCard.tsx`
    - Named export `AttachmentCard` with the same prop signature `{ attachment, canDelete, isOwn, labels, onDelete }` and the same JSX body as in the Source_File
    - Preserve verbatim: the dynamic `await import("@/lib/api")` inside `handleDownload`, the call to `apiClient.get('/files/{fileId}/download')` with the same options object, the `window.confirm(labels.deleteAttachmentConfirm)` text, the `try/catch` fallback to `window.open(href, "_blank")`, and the inline `<svg>` download icon markup
    - Imports: `react` (`type MouseEvent`, `useState`); `lucide-react` (`FileText`, `Trash2`); `formatFileSize` from `@/features/communication/conversations_redesign/utils/formatters`; `type ConversationRedesignLabels` from `@/features/communication/conversations_redesign/labels`; `type MessageAttachment` from `@/features/communication/types/message.types`
    - _Requirements: 2.4, 4.5, 4.9, 4.10_

  - [x] 2.4 Create `messages/EmojiPickerButton.tsx`
    - Named export `EmojiPickerButton` with the same prop signature `{ labels, onSelect }` and the same JSX body as in the Source_File (smiley trigger button + popover with `EmojiPicker`)
    - Preserve the outside-click `useEffect` with the same `mousedown` listener and the same `[open]` dependency list
    - Imports: `react` (`useEffect`, `useRef`, `useState`); `lucide-react` (`Smile`); `emoji-picker-react` default `EmojiPicker`, `type EmojiClickData`, `EmojiStyle`, `Theme`; `type ConversationRedesignLabels` from `@/features/communication/conversations_redesign/labels`
    - _Requirements: 2.6, 4.3, 4.9, 4.10_

  - [x] 2.5 Create `messages/BubbleContextMenu.tsx`
    - Named export `BubbleContextMenu` with the same prop signature and the same JSX body (chevron trigger + dropdown items: Reply, Copy, React, Edit, Report, Info, Delete) as in the Source_File
    - Preserve the `useFloating` configuration verbatim: `placement: isOwn ? "bottom-start" : "bottom-end"`, `offset(4)`, `flip({ fallbackPlacements: ["top-start", "top-end", "bottom"] })`, `shift({ padding: 8 })`, `whileElementsMounted: autoUpdate`, and the outside-click `useEffect` (`mousedown` listener, `[open]` dependency)
    - Place the `@floating-ui/react` import in the top-level import block as a single statement listing `useFloating, offset, flip, shift, autoUpdate` (correcting the Source_File's mid-file import without changing identifiers)
    - Imports: `react` (`useEffect`, `useRef`, `useState`); `lucide-react` (`ChevronDown`, `CornerUpLeft`, `Copy`, `Smile`, `Edit3`, `Flag`, `Info`, `Trash2`); `@floating-ui/react`; `type ReactionType` from `@/features/communication/types/message.types`; `type ConversationRedesignLabels` from `@/features/communication/conversations_redesign/labels`
    - _Requirements: 2.2, 4.3, 4.9, 5.1, 5.3_

  - [x] 2.6 Create `messages/FloatingReactionBar.tsx`
    - Named export `FloatingReactionBar` with the same prop signature `{ isOwn, isActionPending, onReact }` and the same JSX body as in the Source_File (smiley trigger + popover bar with the six quick reactions + "+" full-picker fallback)
    - Preserve the inline `quickReactions` array (`thumbs_up, love, laugh, wow, sad, like`) verbatim — do NOT consolidate with `REACTION_OPTIONS` (per design decision; would violate Requirement 4.4)
    - Preserve the `useFloating` configuration verbatim: `placement: "top"`, `offset(6)`, `flip({ fallbackPlacements: ["bottom", "top-start", "top-end"] })`, `shift({ padding: 8 })`, `whileElementsMounted: autoUpdate`, and the outside-click `useEffect` (`mousedown` listener, `[showBar, showFullPicker]` dependency)
    - Place the `@floating-ui/react` import in the top-level import block as a single statement
    - Imports: `react` (`useEffect`, `useRef`, `useState`); `lucide-react` (`Smile`); `emoji-picker-react` default `EmojiPicker`, `EmojiStyle`, `Theme`; `@floating-ui/react`; `type ReactionType` from `@/features/communication/types/message.types`
    - _Requirements: 2.3, 4.3, 4.4, 4.9, 5.1, 5.3_

- [x] 3. Checkpoint — leaf files compile cleanly
  - Run `npx tsc --noEmit` and `npm run lint -- src/features/communication/conversations_redesign/components/messages` and ensure zero new errors or warnings on the six new leaf files. The Source_File is still unchanged at this point and continues to host all inline definitions; the new leaves should compile as standalone modules. Ask the user if questions arise.

- [x] 4. Create composite files under `messages/`
  - [x] 4.1 Create `messages/MessageBubble.tsx`
    - Named export `MessageBubble` with the same prop signature and the same JSX body as in the Source_File (avatar, sender name, reply-quote block, body, attachments list, footer with timestamp + status, reaction badges, hover-revealed `BubbleContextMenu` and `FloatingReactionBar`, hidden `<Input ref={fileInputRef}>` for in-bubble attachments)
    - Move every helper computation verbatim: `groupedReactions`, `edited`, `deleted`, `canMutateMessage`, `readByOthersCount`, `apiReadByOthers`, `isRead`, `handleAttach`, `handleDelete`, `handleReaction`, `handleRemoveReaction`
    - Preserve every Tailwind class, every `aria-*` attribute, every inline style, and every `lucide-react` icon exactly (only leading-indentation whitespace may change)
    - Sibling imports (relative): `./reactionOptions` (`REACTION_OPTIONS`), `./BubbleContextMenu`, `./FloatingReactionBar`, `./AttachmentCard`, `./MessageStatusIcon`
    - Other imports: `react` (`type ChangeEvent`, `useRef`, `useState`); `lucide-react` (`ThumbsUp` for the badge fallback); `Input` from `@/components/ui/input/Input`; `Avatar` from `@/features/communication/conversations_redesign/components/Avatar`; `actorName, displayNameForUserId, getAvatarUrl` from `@/features/communication/conversations_redesign/utils/displayNames`; `formatTime, messageSenderUserId` from `@/features/communication/conversations_redesign/utils/formatters`; `type ConversationRedesignLabels` from `@/features/communication/conversations_redesign/labels`; `type UserDisplayNameMap` from `@/features/communication/conversations_redesign/types`; `type ConversationMessage` from `@/features/communication/hooks/useConversationMessages`; `type MessageAttachment, type MessageReaction, type ReactionType` from `@/features/communication/types/message.types`
    - _Requirements: 2.1, 4.1, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 5.1, 5.2_

  - [x] 4.2 Create `messages/ReadOnlyComposer.tsx`
    - Named export `ReadOnlyComposer` with the same prop signature `{ labels }` and the same JSX body (gray bar showing `labels.readOnlyComposer`) as in the Source_File
    - Imports: `type ConversationRedesignLabels` from `@/features/communication/conversations_redesign/labels`
    - _Requirements: 3.3, 4.1, 4.9, 5.1_

  - [x] 4.3 Create `messages/MessageComposer.tsx`
    - Named export `MessageComposer` with the same prop signature and the same JSX body as in the Source_File (text input, attachments list, voice recording bar, emoji picker button, reply preview banner, edit banner)
    - Move verbatim: the inline `formatDuration` helper, all `MediaRecorder` MIME-type negotiation in `startRecording`, the swallowed `try/catch` for permission denial, the autosizing textarea ref callback, the `try/finally` clearing `isSubmitting` in `handleSubmit`, and the Arabic-vs-English helper-text toggle (`labels.send === "إرسال" ? "لسطر جديد" : "for new line"`)
    - Preserve every callback prop in the same order with the same argument shapes (Requirement 4.2)
    - Sibling import (relative): `./EmojiPickerButton` (`EmojiPickerButton`)
    - Other imports: `react` (`type ChangeEvent`, `type FormEvent`, `useEffect`, `useRef`, `useState`); `lucide-react` (`Edit3`, `FileText`, `Mic`, `Paperclip`, `Send`, `Trash2`); `type ConversationRedesignLabels` from `@/features/communication/conversations_redesign/labels`
    - _Requirements: 3.2, 4.2, 4.9, 4.10, 5.1, 5.2_

  - [x] 4.4 Create `messages/MessagesPanel.tsx`
    - Named export `MessagesPanel` with the same prop signature and the same JSX body as in the Source_File (scrollable container, infinite-scroll-up loader, day separators, sender grouping, typing indicator, mapping each message to a `MessageBubble`)
    - Preserve all three `useEffect` hooks in the same order with their exact dependency arrays: `[messages.length]` for initial scroll/auto-scroll, `[hasOlderMessages, isLoadingOlder, onLoadOlder]` for the scroll-to-top loader, and `[messages]` for the prepend-preservation effect
    - Preserve the `useRef` initial values: `prevMessageCountRef.current = messages.length`, `isInitialLoadRef.current = true`, `isScrollReady` initial `false`
    - Sibling import (relative): `./MessageBubble` (`MessageBubble`)
    - Other imports: `react` (`Fragment`, `useEffect`, `useRef`, `useState`); `CenteredState` from `@/features/communication/conversations_redesign/components/PanelLayout`; `displayNameForUserId` from `@/features/communication/conversations_redesign/utils/displayNames`; `formatMessageDateSeparator, isOwnMessage, localDateKey, messageSenderUserId` from `@/features/communication/conversations_redesign/utils/formatters`; `type ConversationRedesignLabels` from `@/features/communication/conversations_redesign/labels`; `type UserDisplayNameMap` from `@/features/communication/conversations_redesign/types`; `type ConversationMessage` from `@/features/communication/hooks/useConversationMessages`; `type MessageAttachment, type MessageReaction, type ReactionType` from `@/features/communication/types/message.types`
    - _Requirements: 3.1, 4.1, 4.7, 4.8, 4.9, 5.1, 5.2_

- [x] 5. Convert `components/MessagesPanel.tsx` to the thin re-export barrel
  - [x] 5.1 Replace the entire content of `src/features/communication/conversations_redesign/components/MessagesPanel.tsx` with three named re-exports
    - The file MUST contain only a leading file comment and the three `export ... from "./messages/<filename>"` lines:
      - `export { MessagesPanel } from "./messages/MessagesPanel";`
      - `export { MessageComposer } from "./messages/MessageComposer";`
      - `export { ReadOnlyComposer } from "./messages/ReadOnlyComposer";`
    - The file MUST NOT contain any JSX, React hooks, component definitions, runtime constants, helper functions, or any executable logic; do NOT use `export *`; do NOT add a default export
    - The file MUST NOT export any of `MessageBubble`, `BubbleContextMenu`, `FloatingReactionBar`, `AttachmentCard`, `MessageStatusIcon`, `EmojiPickerButton`, or `REACTION_OPTIONS` (Requirement 1.4)
    - Do NOT modify `ConversationDetail.tsx` or any other consumer
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6, 2.10, 3.4, 3.5_

- [x] 6. Audit import cohesion across the new files
  - [x] 6.1 Verify each new file's imports match its usages and detect any cycle
    - For each file under `messages/` and the new barrel: confirm every imported identifier appears in the file body, and every external identifier referenced in the file body is imported (Requirement 5.1)
    - Confirm sibling imports inside `messages/` use relative paths (e.g., `./BubbleContextMenu`) and cross-feature imports use the existing `@/...` alias style (Requirement 5.2)
    - Confirm `@floating-ui/react` is imported once per file in a single top-level import statement (Requirement 5.3) — `BubbleContextMenu.tsx` and `FloatingReactionBar.tsx` are the two consumers
    - Confirm there is no import cycle inside `messages/` or between `messages/` and the barrel (Requirement 5.4); `npm run lint` will surface `import/no-cycle` violations in task 7.2
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 7. Run the verification stack defined in the design's Testing Strategy
  - [x] 7.1 Run `npx tsc --noEmit` and compare to the baseline captured in 1.1
    - Exit code MUST be 0
    - Output MUST report zero new errors and zero new warnings relative to the baseline `tsc.txt`, with special attention to `ConversationDetail.tsx`'s import of `MessageComposer, MessagesPanel, ReadOnlyComposer` from the Public_Module
    - _Requirements: 1.5, 6.1_

  - [x] 7.2 Run ESLint on the Public_Module file and every file under `messages/` and compare to the baseline captured in 1.1
    - Run `npm run lint -- src/features/communication/conversations_redesign/components/MessagesPanel.tsx src/features/communication/conversations_redesign/components/messages` (or `npm run lint`)
    - Exit code MUST be 0; zero new violations relative to baseline `eslint.txt` for `unused-imports/no-unused-imports`, `@typescript-eslint/no-unused-vars`, and `import/no-cycle`
    - _Requirements: 5.5, 6.2_

  - [x] 7.3 Run `npm run build` and confirm it exits cleanly
    - Exit code MUST be 0; zero new errors and zero new warnings relative to baseline `build.txt`
    - This catches any module-resolution edge case the type-checker missed (e.g., the new sibling-relative imports under `messages/`)
    - _Requirements: 6.3_

  - [x] 7.4 Run a static diff audit comparing each new file to the baseline source extract
    - For each of the ten new files, use `git diff --no-index <baseline-extract> <new-file>` (or equivalent) against the corresponding block extracted from `baseline/MessagesPanel.original.tsx`
    - Expected diff: ONLY leading-indentation whitespace and the file-level imports/exports — no JSX node changes, no class-name changes, no `aria-*` changes, no inline-style changes, no `lucide-react` icon changes, no `@floating-ui/react` configuration changes
    - If any out-of-scope diff is found, revert the offending file from the baseline and re-relocate (per Requirement 4.11 and design Testing Strategy §6)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.11, 6.4, 6.5_

  - [x] 7.5 Execute the scripted manual smoke pass per the design's Testing Strategy §4b
    - In `next dev` against a real conversation, with the browser DevTools console open, perform in this order: (1) send a text message, (2) reply, (3) edit a message, (4) delete a message, (5) add and remove a reaction, (6) attach files, (7) record and send a voice note, (8) view a read-only conversation, (9) repeat steps 1–8 with locale switched to Arabic to verify RTL classes (`start-*`, `end-*`, `border-s-*`, `rounded-es-*`, `rounded-ee-*`, `me-*`, `ms-*`)
    - The DevTools console MUST emit zero new errors or warnings relative to the Pre_Refactor_Baseline
    - This sub-task is optional for the coding agent because it requires a running dev server and human observation; complete it manually before merge to fully satisfy Requirement 6.4
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 6.4_

- [x] 8. Final checkpoint — refactor merge-ready
  - Confirm tasks 7.1, 7.2, 7.3, and 7.4 all passed against the baseline captured in 1.1. If any of them fail, follow Requirement 6.5: correct or revert the offending change and re-run all four checks until each passes. Ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and require manual execution outside the coding agent (the manual smoke pass needs `next dev` and a human observer).
- Each task references the granular acceptance criteria it satisfies, not just user stories.
- The refactor is purely structural: no prop, type, Tailwind class, `aria-*` attribute, inline style, `lucide-react` icon, or `@floating-ui/react` configuration may change. The static diff audit (task 7.4) is the mechanical guard for this constraint.
- Per the design's "PBT applicability" decision and the absence of a Correctness Properties section, no property-based tests are added. Verification is type-check + lint + build + static diff + (optional) scripted manual smoke pass, exactly as the design's Testing Strategy specifies.
- The Pre_Refactor_Baseline captured in task 1.1 is the reference point for tasks 7.1, 7.2, 7.3, and 7.4 — do not skip 1.1 even if the diffs feel obvious.
- `ConversationDetail.tsx` MUST NOT be modified by this refactor; the barrel preserves the existing import path and specifier names.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3", "2.4", "2.5", "2.6"] },
    { "id": 2, "tasks": ["4.1", "4.2", "4.3"] },
    { "id": 3, "tasks": ["4.4"] },
    { "id": 4, "tasks": ["5.1"] },
    { "id": 5, "tasks": ["6.1"] },
    { "id": 6, "tasks": ["7.1", "7.2", "7.3", "7.4"] },
    { "id": 7, "tasks": ["7.5"] }
  ]
}
```
