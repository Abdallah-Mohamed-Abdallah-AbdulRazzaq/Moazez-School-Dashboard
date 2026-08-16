# Manual Smoke Pass — `messages-panel-component-split`

This checklist is the reviewer-executed counterpart to **Task 7.5** of `tasks.md`
and the **Testing Strategy §4b** procedure of `design.md`. The coding agent
cannot run a browser and observe the DevTools console, so this step is left
for a human to perform before the refactor is merged.

It must be run against the refactor branch in `next dev`, with the browser
DevTools **Console** tab open the entire time. The console MUST emit
**zero new errors and zero new warnings** relative to the
`Pre_Refactor_Baseline` (Requirement 6.4).

> Tick each box below as you verify it. Do not check a box unless the
> visible/console behavior matches the baseline exactly.

---

## Why this is "extra" rather than load-bearing

The mechanical guarantees provided by the prior tasks already pin the
refactor's behavior to the baseline:

- **Task 7.4 — Static diff audit.** Each of the ten new files under
  `src/features/communication/conversations_redesign/components/messages/`
  was diffed against the corresponding block extracted from
  `baseline/MessagesPanel.original.tsx`. The diffs contain only
  leading-indentation whitespace and the per-file imports/exports — no JSX
  node changes, no Tailwind class changes, no `aria-*` changes, no inline
  style changes, no `lucide-react` icon swaps, and no `@floating-ui/react`
  configuration changes (Requirements 4.1–4.9, 4.11).
- **Task 7.1 — `npx tsc --noEmit`.** Exit code `0`; output matches
  `baseline/tsc.txt` with zero new errors or warnings (Requirements 1.5,
  6.1).
- **Task 7.2 — ESLint.** Exit code `0`; output matches
  `baseline/eslint.txt` with zero new violations for
  `unused-imports/no-unused-imports`,
  `@typescript-eslint/no-unused-vars`, and `import/no-cycle`
  (Requirements 5.5, 6.2).
- **Task 7.3 — `npm run build`.** Exit code `0`; output matches
  `baseline/build.txt` (Requirement 6.3).

Because the rendered tree, props, classes, and configuration objects are
byte-identical to the baseline, behavior parity is **structurally
guaranteed**. The smoke pass below is therefore a confidence check, not the
primary verification — but it is the only step that observes runtime
console output against a real backend, which Requirement 6.4 calls out
explicitly.

---

## Pre-flight

- [ ] On the refactor branch, with no unstaged changes, run `npm run dev`
      (or `npx next dev`) and wait for "Ready" before opening the browser.
- [ ] Open the app and sign in to an account that can read a conversation
      with at least one prior message.
- [ ] Open browser DevTools and switch to the **Console** tab. Enable
      "Preserve log" and clear the panel before starting Step 1.
- [ ] Have `baseline/build.txt` open in another window to cross-reference
      any console message that looks like it might be new.

---

## Steps (run in this exact order)

### 1. Send a text message
- [ ] Type a short message and submit it.
- [ ] The bubble appears at the bottom of the panel.
- [ ] The list scroll-snaps to the bottom on send.
- [ ] The status icon transitions `pending → sent`.
- [ ] **No new console output.**

### 2. Reply to a message
- [ ] Open the message context menu (chevron) on a peer message and choose
      **Reply**.
- [ ] The reply preview bar above the composer renders the correct sender
      name and body.
- [ ] Send a reply. The outgoing bubble contains the reply-quote block
      with the correct logical-property classes:
      - `border-s-4`
      - `border-s-white/60` on **own** quotes
      - `border-s-primary` on **others'** quotes
- [ ] After send, the reply preview clears (`replyTo` resets).
- [ ] **No new console output.**

### 3. Edit a message
- [ ] Open the context menu on one of your own messages and choose
      **Edit**.
- [ ] The amber edit banner appears above the composer with the `Edit3`
      icon.
- [ ] The textarea is pre-populated with the existing body.
- [ ] Modify the text and save.
- [ ] The bubble body updates and the **edited** label renders next to the
      timestamp.
- [ ] **No new console output.**

### 4. Delete a message
- [ ] Open the context menu on one of your own messages and choose
      **Delete**.
- [ ] A `window.confirm` dialog appears with the **exact** baseline text
      (`labels.deleteMessageConfirm`).
- [ ] Confirm. The bubble body is replaced with `labels.messageDeleted`.
- [ ] **No new console output.**

### 5. Add and remove a reaction
- [ ] Hover a peer message; the smiley trigger appears at logical offset
      `end-[-36px]`.
- [ ] Hover one of your own messages; the smiley trigger appears at
      logical offset `start-[-36px]`.
- [ ] Click the smiley. The floating reaction bar shows the six quick
      reactions in the order **👍 ❤️ 😂 😮 😢 🙏**.
- [ ] Pick one. The reaction badge appears with the correct `lucide-react`
      icon.
- [ ] Click your own reaction badge. The reaction is removed.
- [ ] **No new console output.**

### 6. Attach files
- [ ] Click the `Paperclip` button. The native file picker opens.
- [ ] Select two or more files of mixed sizes (one < 1 MB and one ≥ 1 MB).
- [ ] The preview list under the composer renders one row per file.
- [ ] Each row shows the correct human-readable size: `KB` for files
      below ≈ 1 MB and `MB` above (per `formatFileSize`).
- [ ] Send. The message and attachments commit together.
- [ ] Each resulting `AttachmentCard` shows the inline download SVG and,
      for **own** messages, the `Trash2` icon.
- [ ] Click the download SVG; the file downloads (or opens in a new tab
      as the documented fallback).
- [ ] **No new console output.**

### 7. Record and send a voice note
- [ ] Click the `Mic` button.
- [ ] The browser prompts for microphone permission; grant it.
- [ ] The red recording bar appears with a timer in `m:ss` format.
- [ ] Stop the recording.
- [ ] A voice attachment is sent with caption `🎤`.
- [ ] The resulting attachment plays in the bubble.
- [ ] **No new console output.**

### 8. View a read-only conversation
- [ ] Open a conversation the current user cannot post to.
- [ ] The composer area renders the `ReadOnlyComposer` gray bar with
      `labels.readOnlyComposer`.
- [ ] No textarea, attachments button, mic button, or send button is
      visible.
- [ ] **No new console output.**

### 9. Repeat steps 1–8 with the locale switched to Arabic
- [ ] Switch locale to Arabic (`/ar/...` route).
- [ ] Re-run steps 1 through 8 in order.
- [ ] During each step, confirm that the following logical-property
      classes flip exactly as in the baseline (verify via DevTools
      "Elements" panel as needed):
      - `start-*`
      - `end-*`
      - `border-s-*`
      - `rounded-es-*`
      - `rounded-ee-*`
      - `me-*`
      - `ms-*`
- [ ] Helper text under the composer reads the Arabic variant
      (`لسطر جديد`) per the locale toggle in `MessageComposer`.
- [ ] **No new console output across all nine RTL repetitions.**

---

## Acceptance gate

- [ ] Across **all** steps above, the DevTools Console emitted zero new
      errors and zero new warnings relative to `baseline/build.txt` /
      `baseline/eslint.txt` / `baseline/tsc.txt`.
- [ ] No bubble, composer, attachment card, reaction bar, or context menu
      rendered differently from the baseline branch in either LTR or RTL.
- [ ] Recorder, file picker, download fallback, and reply/edit/delete
      flows all behaved identically to the baseline.

If every box above is ticked, the refactor satisfies Requirement 6.4 in
addition to the structural guarantees from tasks 7.1–7.4, and the branch
is merge-ready (Requirement 6.5).

If **any** box fails, do not merge. Per design Testing Strategy §6 and
Requirement 4.11: revert the offending file from
`baseline/MessagesPanel.original.tsx` and re-relocate, rather than
"fixing forward."
