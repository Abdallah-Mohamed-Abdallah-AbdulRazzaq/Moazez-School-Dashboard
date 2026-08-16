# Requirements Document

## Introduction

The file `src/features/communication/conversations_redesign/components/MessagesPanel.tsx` has grown to roughly 1,500 lines and co-locates ten distinct concerns (a scrollable message list, a message bubble, a context menu, a floating reaction bar, an attachment card, a status icon, a composer, a read-only composer, an emoji picker button, and a shared reaction-options constant). This spec defines a behavior-preserving refactor that splits the file into smaller, focused component files under a new `components/messages/` subfolder while keeping the existing public API (`MessagesPanel`, `MessageComposer`, `ReadOnlyComposer`) importable from the original module path.

The refactor is purely structural. No component logic, props, styling, accessibility behavior, RTL handling, or runtime behavior is modified. Consumer modules (notably `ConversationDetail.tsx`) MUST continue to compile and run without any code change.

## Glossary

- **Source_File**: The current file at `src/features/communication/conversations_redesign/components/MessagesPanel.tsx` containing all components in scope.
- **Public_Module**: The import path `@/features/communication/conversations_redesign/components/MessagesPanel` from which `MessagesPanel`, `MessageComposer`, and `ReadOnlyComposer` are currently re-exportable.
- **Messages_Folder**: The target folder `src/features/communication/conversations_redesign/components/messages/` which will hold the split component files.
- **Public_Components**: The three named exports `MessagesPanel`, `MessageComposer`, and `ReadOnlyComposer`.
- **Internal_Components**: The components currently defined in the Source_File but not exported: `MessageBubble`, `BubbleContextMenu`, `FloatingReactionBar`, `AttachmentCard`, `MessageStatusIcon`, `EmojiPickerButton`.
- **Shared_Constants**: Module-level constants currently defined in the Source_File, specifically `REACTION_OPTIONS`.
- **Consumer**: Any module that imports from the Public_Module. The known Consumer is `src/features/communication/conversations_redesign/components/ConversationDetail.tsx`.
- **Behavior_Parity**: A state in which rendered output, prop types, event handling, side effects, and DOM structure are identical to those produced by the Source_File before the refactor for the same inputs.
- **Pre_Refactor_Baseline**: The state of the Source_File and the project tooling output (TypeScript, ESLint, Next.js build, runtime DOM, runtime console) captured on the same branch in the commit immediately preceding the refactor commit.
- **Refactor_Author**: The developer (or agent) executing the split.

## Requirements

### Requirement 1: Preserve Public API

**User Story:** As a Consumer of the Public_Module, I want `MessagesPanel`, `MessageComposer`, and `ReadOnlyComposer` to remain importable from the original path with unchanged signatures, so that no consumer code has to be modified.

#### Acceptance Criteria

1. THE Public_Module SHALL continue to export `MessagesPanel` as a named export whose prop type has the same property names, the same TypeScript types per property, and the same optionality flags as the prop type defined for `MessagesPanel` in the Pre_Refactor_Baseline of the Source_File.
2. THE Public_Module SHALL continue to export `MessageComposer` as a named export whose prop type has the same property names, the same TypeScript types per property, and the same optionality flags as the prop type defined for `MessageComposer` in the Pre_Refactor_Baseline of the Source_File.
3. THE Public_Module SHALL continue to export `ReadOnlyComposer` as a named export whose prop type has the same property names, the same TypeScript types per property, and the same optionality flags as the prop type defined for `ReadOnlyComposer` in the Pre_Refactor_Baseline of the Source_File.
4. THE Public_Module SHALL NOT expose any of the Internal_Components (`MessageBubble`, `BubbleContextMenu`, `FloatingReactionBar`, `AttachmentCard`, `MessageStatusIcon`, `EmojiPickerButton`) or the Shared_Constants entry `REACTION_OPTIONS` via any named export, default export, or re-export after the refactor.
5. WHEN the project's standard TypeScript type-check command is executed after the refactor, THE TypeScript_Compiler SHALL report zero new errors and zero new warnings in `ConversationDetail.tsx` related to the Public_Module relative to the Pre_Refactor_Baseline.
6. IF a Consumer imports any of the three Public_Components from the Public_Module, THEN THE bundler SHALL resolve the import without any change to the Consumer's import path, import specifier names, or surrounding source code.

### Requirement 2: Split Internal Components Into Dedicated Files

**User Story:** As a Refactor_Author, I want each internal component to live in its own file under the Messages_Folder, so that each file has a single responsibility and is easier to read and test.

#### Acceptance Criteria

1. THE Refactor_Author SHALL place `MessageBubble` in `messages/MessageBubble.tsx` as a named export named `MessageBubble`, with the same component signature, prop type definition, and JSX body as the `MessageBubble` defined in the Source_File.
2. THE Refactor_Author SHALL place `BubbleContextMenu` in `messages/BubbleContextMenu.tsx` as a named export named `BubbleContextMenu`, with the same component signature, prop type definition, and JSX body as the `BubbleContextMenu` defined in the Source_File.
3. THE Refactor_Author SHALL place `FloatingReactionBar` in `messages/FloatingReactionBar.tsx` as a named export named `FloatingReactionBar`, with the same component signature, prop type definition, and JSX body as the `FloatingReactionBar` defined in the Source_File.
4. THE Refactor_Author SHALL place `AttachmentCard` in `messages/AttachmentCard.tsx` as a named export named `AttachmentCard`, with the same component signature, prop type definition, and JSX body as the `AttachmentCard` defined in the Source_File.
5. THE Refactor_Author SHALL place `MessageStatusIcon` in `messages/MessageStatusIcon.tsx` as a named export named `MessageStatusIcon`, with the same component signature, prop type definition, and JSX body as the `MessageStatusIcon` defined in the Source_File.
6. THE Refactor_Author SHALL place `EmojiPickerButton` in `messages/EmojiPickerButton.tsx` as a named export named `EmojiPickerButton`, with the same component signature, prop type definition, and JSX body as the `EmojiPickerButton` defined in the Source_File.
7. THE Refactor_Author SHALL place `REACTION_OPTIONS` in `messages/reactionOptions.ts` as a named export named `REACTION_OPTIONS`, with the identical TypeScript type annotation and identical array entries in the identical order as defined in the Source_File.
8. WHERE a component depends on `REACTION_OPTIONS`, THE component file SHALL import the constant from `messages/reactionOptions.ts` and SHALL NOT redeclare, duplicate, or shadow it.
9. THE Refactor_Author SHALL NOT introduce any new export beyond those required by actual imports from sibling files within the Messages_Folder or by the Public_Module.
10. AFTER the refactor, THE Source_File SHALL NOT retain any inline definition of the Internal_Components, the Public_Components, or `REACTION_OPTIONS`.

### Requirement 3: Place Public Components In Dedicated Files

**User Story:** As a Refactor_Author, I want the public-facing components also separated into their own files, so that the Public_Module becomes a thin barrel that re-exports them.

#### Acceptance Criteria

1. THE Refactor_Author SHALL place `MessagesPanel` in `messages/MessagesPanel.tsx` and export it from that file as a named export named `MessagesPanel` with the same prop type as in the Source_File.
2. THE Refactor_Author SHALL place `MessageComposer` in `messages/MessageComposer.tsx` and export it from that file as a named export named `MessageComposer` with the same prop type as in the Source_File.
3. THE Refactor_Author SHALL place `ReadOnlyComposer` in `messages/ReadOnlyComposer.tsx` and export it from that file as a named export named `ReadOnlyComposer` with the same prop type as in the Source_File.
4. THE Public_Module file (`components/MessagesPanel.tsx`) SHALL contain only `export ... from "./messages/<filename>"` re-export statements for `MessagesPanel`, `MessageComposer`, and `ReadOnlyComposer`, preserving each identifier exactly as listed in the Glossary.
5. THE Public_Module file SHALL NOT contain JSX, React hooks, component definitions, runtime constants, helper functions, or any executable logic after the refactor; only the re-export statements required by Criterion 4 and file-level comments are permitted.

### Requirement 4: Preserve Behavior Parity

**User Story:** As a user of the Communication feature, I want the messages list, composer, reactions, attachments, voice recording, emoji picker, and read-only state to behave exactly as before, so that no regression is introduced by the refactor.

#### Acceptance Criteria

1. WHEN a user loads a conversation after the refactor, THE MessagesPanel SHALL emit the same rendered HTML (element tags, attribute names, attribute values, class lists, text content, and child order) as the Pre_Refactor_Baseline for identical input props.
2. WHEN a user sends a text message, attaches files, records voice, replies, edits, or cancels in the composer, THE MessageComposer SHALL invoke the same callback props in the same order with arguments that are `Object.is`-equal to the arguments produced by the Pre_Refactor_Baseline, and SHALL transition through the same internal state values.
3. WHEN a user opens the bubble context menu, the reaction bar, or the emoji picker, THE corresponding popover SHALL be configured with the same `@floating-ui/react` `placement`, `offset` value, `flip.fallbackPlacements` array, `shift.padding` value, and the same outside-click handler logic as the Pre_Refactor_Baseline.
4. WHEN a user adds, removes, or views message reactions, THE reaction badges and quick-reaction picker SHALL display the same `lucide-react` icons, the same numeric counts, and the same own-reaction CSS classes as the Pre_Refactor_Baseline for identical input data.
5. WHEN a user downloads or deletes an attachment, THE AttachmentCard SHALL invoke `apiClient.get('/files/{fileId}/download')` with the same `fileId` value, the same options object, and the same `window.confirm` text as the Pre_Refactor_Baseline.
6. WHEN a message has `deliveryStatus` `pending`, `failed`, sent, or read, THE MessageStatusIcon SHALL render the same `lucide-react` icon, the same inline style object, and the same parent positioning as the Pre_Refactor_Baseline.
7. WHILE the locale direction is `rtl`, THE refactored components SHALL render every logical-property Tailwind class (`start-*`, `end-*`, `border-s-*`, `rounded-es-*`, `rounded-ee-*`, `me-*`, `ms-*`) at the same JSX location with the same suffix value as the Pre_Refactor_Baseline.
8. THE Refactor_Author SHALL NOT add, remove, rename, or reorder any prop on `MessagesPanel`, `MessageComposer`, `ReadOnlyComposer`, `MessageBubble`, `BubbleContextMenu`, `FloatingReactionBar`, `AttachmentCard`, `MessageStatusIcon`, `EmojiPickerButton`, or `REACTION_OPTIONS`.
9. THE Refactor_Author SHALL NOT modify any Tailwind class string, inline style object, `aria-*` attribute, or `lucide-react` icon used in JSX, except for leading-indentation whitespace changes produced solely by relocating the JSX block into a new file.
10. THE Refactor_Author SHALL NOT change any imported runtime dependency, including `@floating-ui/react`, `emoji-picker-react`, `lucide-react`, `@/components/ui/*`, `@/lib/api`, and the existing `utils/formatters` and `utils/displayNames` helpers.
11. IF any rendered HTML, callback argument, popover configuration, reaction display, attachment call, status icon, or RTL class diverges from the Pre_Refactor_Baseline, THEN THE Refactor_Author SHALL revert the divergence before declaring the refactor complete.

### Requirement 5: Update Imports Cohesively Across Split Files

**User Story:** As a Refactor_Author, I want each new file to import only what it actually uses, so that the split files stay focused and tree-shaking is preserved.

#### Acceptance Criteria

1. THE Refactor_Author SHALL ensure that every imported identifier in each new file (React APIs, `lucide-react` icons, `@floating-ui/react` hooks, TypeScript types, sibling components, `utils/formatters` helpers, `utils/displayNames` helpers, and any other identifier) appears in the file body, AND that every external identifier referenced in the file body is imported.
2. WHEN a child component is referenced by a parent component in a different file, THE parent file SHALL import that child via a named import from the child's dedicated path under the Messages_Folder, using the same path style (relative or `@/` alias) used elsewhere in the Messages_Folder.
3. THE Refactor_Author SHALL place every `@floating-ui/react` import statement in the top-level import block of each file that uses it, defined as the contiguous block of `import` statements that appears before the first non-import, non-comment statement in the file, AND SHALL ensure each `@floating-ui/react` symbol is imported at most once per file.
4. THE Refactor_Author SHALL NOT introduce any import cycle in which a file under the Messages_Folder or the Public_Module transitively imports itself, whether directly or via other files in the Messages_Folder or the Public_Module.
5. WHEN ESLint runs on the Public_Module file and every file under the Messages_Folder, THE linter SHALL report zero new violations of `unused-imports/no-unused-imports`, `@typescript-eslint/no-unused-vars` (for imported identifiers), or `import/no-cycle` relative to the Pre_Refactor_Baseline.

### Requirement 6: Verification After Refactor

**User Story:** As a Refactor_Author, I want automated checks to confirm the refactor preserves correctness, so that regressions are caught before merge.

#### Acceptance Criteria

1. WHEN the project's standard TypeScript type-check command is executed after the refactor, THE TypeScript_Compiler SHALL exit with code 0 AND SHALL report zero new errors and zero new warnings relative to the Pre_Refactor_Baseline.
2. WHEN ESLint is executed against the Public_Module file and every file under the Messages_Folder, THE linter SHALL exit with code 0 AND SHALL report zero new errors and zero new warnings relative to the Pre_Refactor_Baseline.
3. WHEN `npm run build` is executed after the refactor, THE Next.js build SHALL exit with code 0 AND SHALL report zero new errors and zero new warnings relative to the Pre_Refactor_Baseline.
4. WHEN the Refactor_Author opens the conversations page in development mode and exercises, in this order, sending a text message, replying, editing a message, deleting a message, adding and removing a reaction, attaching files, recording and sending a voice note, and viewing a read-only conversation, THE observed behavior SHALL match Behavior_Parity AND THE browser DevTools console SHALL emit zero new error or warning messages relative to the Pre_Refactor_Baseline.
5. IF any of the verification checks in Criteria 1 through 4 fail, THEN THE Refactor_Author SHALL correct or revert the offending change AND SHALL re-run all four checks until each passes before treating the refactor as merge-ready.
