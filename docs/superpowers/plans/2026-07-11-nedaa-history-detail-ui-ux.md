# Nedaa History Detail UI/UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the Nedaa history response into a professional, responsive operational detail modal.

**Architecture:** Keep the existing history-detail fetch and modal state in `NedaaOperationsPage`. Replace the history branch’s plain text output with focused presentational helpers for status, identity, operational metrics, escalation, and a vertical timeline. Use existing Nedaa types, shared `Modal`, Lucide icons, translations, and current date formatting conventions.

**Tech Stack:** Next.js/React, TypeScript, Tailwind CSS, Lucide, Vitest, Testing Library.

## Global Constraints

- The modal is read-only with one `Close` footer action.
- Request-detail, recipient, and mutation modals remain unchanged.
- Status and operational flags use text plus visual styling; color is never the only signal.
- The layout must remain usable at 375px without horizontal overflow.
- Timeline events are translated and rendered chronologically with local date/time formatting.

---

### Task 1: Add failing history-detail UI tests

**Files:**
- Modify: `src/features/nedaa/pages/__tests__/NedaaOperationsPage.test.tsx`

**Interfaces:**
- Consumes: existing `fetchDismissalRequestHistoryItem` mock and `historyItem` fixture.
- Produces: regression coverage for the history modal’s visible contract.

- [x] **Step 1: Write the failing tests**

Add assertions for the history modal to verify:

```tsx
expect(screen.getByText("Laila Mostafa")).toBeInTheDocument();
expect(screen.getByText("operations_status.handed_over")).toBeInTheDocument();
expect(screen.getByText("operations_history.wait_duration")).toBeInTheDocument();
expect(screen.getByText("History loaded")).toBeInTheDocument();
```

Also add an empty-timeline fixture assertion for the translated no-events message.

- [x] **Step 2: Run the focused tests and verify failure**

Run:

```powershell
npm exec -- vitest run src/features/nedaa/pages/__tests__/NedaaOperationsPage.test.tsx -t "history" --reporter=dot
```

Expected: the existing history modal renders only plain text/loading output, so the new status, summary, and empty-timeline assertions fail.

### Task 2: Add translations for the operational detail presentation

**Files:**
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`

**Interfaces:**
- Consumes: existing `nedaa.operations`, `nedaa.operations_fields`, and `nedaa.operations_status` namespaces.
- Produces: matching `operations_history` and `operations_timeline` keys in both locales.

- [x] **Step 1: Add matching English and Arabic keys**

Add labels for child context, request ID, wait duration, requested/updated times, escalation state, no escalation, timeline title, no timeline, and event labels for `request_created` and `request_status_changed`.

- [x] **Step 2: Run the translation parity test**

Run:

```powershell
npm exec -- vitest run src/messages/__tests__/nedaaTranslations.test.ts --reporter=dot
```

Expected: locale key sets remain identical and the required Nedaa translations pass.

### Task 3: Implement the history-detail presentation

**Files:**
- Modify: `src/features/nedaa/pages/NedaaOperationsPage.tsx`

**Interfaces:**
- Consumes: `historyDetail: DismissalRequestHistoryDetail | null`, `ReadOnlyModalState`, the existing `useTranslations("nedaa")`, and shared `Modal`.
- Produces: a responsive history detail modal with status, context, summary, escalation, and timeline sections.

- [x] **Step 1: Add focused helpers and imports**

Use Lucide icons already present in the project plus `CheckCircle2`, `Clock3`, `MapPin`, `UserRound`, and `AlertTriangle` as needed. Add a formatter that uses the current locale and returns `-` for null timestamps.

- [x] **Step 2: Replace the history branch content**

Render the history response in this order:

```tsx
<section aria-labelledby="history-summary-heading">
  <status badge />
  <identity card />
  <operational metrics />
  <escalation state />
</section>
<section aria-labelledby="history-timeline-heading">
  <vertical timeline />
</section>
```

Render each timeline event with its translated event label, destination status, local timestamp, and optional note. Highlight the final event note with a bordered note block. Render the translated empty state when `timeline.length === 0`.

- [x] **Step 3: Keep loading/error and footer behavior intact**

Pass the existing loading label/error to `ReadOnlyModalState`. Return a footer containing only the existing Close behavior; do not add unsupported navigation or clipboard actions.

- [x] **Step 4: Run the focused tests and verify success**

Run:

```powershell
npm exec -- vitest run src/features/nedaa/pages/__tests__/NedaaOperationsPage.test.tsx -t "history" --reporter=dot
```

Expected: all history-detail presentation tests pass.

### Task 4: Review and verify the complete change

**Files:**
- No additional files.

- [x] **Step 1: Run all relevant tests**

```powershell
npm exec -- vitest run src/features/nedaa/pages/__tests__/NedaaOperationsPage.test.tsx src/features/nedaa/components/__tests__/NedaaGateFormModal.test.tsx src/messages/__tests__/nedaaTranslations.test.ts --reporter=dot
```

Expected: all relevant tests pass.

- [x] **Step 2: Run static checks**

```powershell
npm run typecheck
npm exec -- eslint src/features/nedaa/pages/NedaaOperationsPage.tsx src/features/nedaa/pages/__tests__/NedaaOperationsPage.test.tsx
```

Expected: typecheck exits 0 and ESLint reports no new errors.

- [x] **Step 3: Inspect the diff**

```powershell
git diff --check
git diff --stat
```

Confirm only the approved history modal UI, translations, tests, and plan/spec documentation changed.
