# Online Session Meeting Lobby Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a meeting-specific online-session detail lobby that consumes the complete existing academic-content, readiness, publication, revision, resource, and lifecycle contracts without backend changes.

**Architecture:** Add a specialized `OnlineSessionEditorView` to the existing type dispatch in `AcademicContentEditorPage`. Lobby mode composes small read-oriented meeting components; `mode=edit` reuses an extracted generic editor workspace and all existing save operations. Pure model functions own only temporal and URL derivations, while readiness and publication eligibility remain backend-authoritative.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, next-intl, Tailwind CSS, Lucide React, Vitest, Testing Library, existing MOAZEZ UI components.

**Spec:** `docs/superpowers/specs/2026-10-06-online-session-meeting-lobby-design.md`

## Global Constraints

- Do not change the backend or frontend API contracts.
- Use components from `src/components/ui/` for controls and shared interaction patterns.
- Reuse `MeetingPlatformIcon`, `AcademicContentPublicationPanel`, `ReadinessPanel`, `RevisionHistoryPanel`, `LifecycleActions`, and `downloadAcademicContentAsset`.
- A valid HTTPS `joinUrl` enables Join session in upcoming, live, and ended states.
- Do not display invented participant counts, attendance, host controls, recording state, chat, or analytics.
- Academic-content readiness and publication readiness must come from their existing backend responses.
- Use the clean-code-guard skill after every production-code task and the test-guard skill after every test task.
- Run focused tests during implementation. Ask the owner before running the full test suite.
- Preserve unrelated dirty-worktree changes and stage only task files in each commit.

---

## File structure

### New production files

- `src/features/academic-content/model/onlineSessionDetail.ts` — pure temporal, duration, countdown, and join-URL derivations.
- `src/features/academic-content/components/online-session-detail/OnlineSessionEditorView.tsx` — lobby/edit mode orchestration.
- `src/features/academic-content/components/online-session-detail/OnlineSessionHeader.tsx` — breadcrumbs, edit/back actions, and lifecycle slot.
- `src/features/academic-content/components/online-session-detail/OnlineSessionLobbyHero.tsx` — platform identity, timing, access code, Join session, and incomplete state.
- `src/features/academic-content/components/online-session-detail/OnlineSessionInformation.tsx` — instructions, targets, schedule, and timetable presentation.
- `src/features/academic-content/components/online-session-detail/OnlineSessionResources.tsx` — assets, links, tags, downloads, and errors.
- `src/features/academic-content/components/online-session-detail/OnlineSessionContextRail.tsx` — status, publication summary, readiness, and audit metadata.
- `src/features/academic-content/components/online-session-detail/OnlineSessionManagementHistory.tsx` — compact navigation between backend readiness, publication, and revisions.
- `src/features/academic-content/components/editor/GenericAcademicContentEditorView.tsx` — extracted existing generic editor workspace used by online-session edit mode and remaining generic types.
- `src/components/ui/button/ButtonLink.tsx` — anchor-based companion to the existing button for safe external primary actions.

### New test files

- `src/features/academic-content/model/__tests__/onlineSessionDetail.test.ts`
- `src/features/academic-content/components/online-session-detail/__tests__/OnlineSessionLobbyHero.test.tsx`
- `src/features/academic-content/components/online-session-detail/__tests__/OnlineSessionInformation.test.tsx`
- `src/features/academic-content/components/online-session-detail/__tests__/OnlineSessionResources.test.tsx`
- `src/features/academic-content/components/online-session-detail/__tests__/OnlineSessionManagementHistory.test.tsx`
- `src/features/academic-content/components/online-session-detail/__tests__/OnlineSessionEditorView.test.tsx`

### Modified files

- `src/components/ui/button/Button.tsx` — export the existing button style resolver so `ButtonLink` does not duplicate style strings.
- `src/features/academic-content/pages/AcademicContentEditorPage.tsx` — dispatch `ONLINE_SESSION` to the specialized view and delegate the fallback editor body.
- `src/messages/en.json` — English lobby, management, error, and accessibility strings.
- `src/messages/ar.json` — Arabic equivalents.
- `src/messages/__tests__/academicContentWorkflowTranslations.test.ts` — parity remains the verification surface; modify only if the test requires namespace registration.

---

### Task 1: Extract the reusable generic editor workspace

**Files:**
- Create: `src/features/academic-content/components/editor/GenericAcademicContentEditorView.tsx`
- Modify: `src/features/academic-content/pages/AcademicContentEditorPage.tsx`
- Test: `src/features/academic-content/pages/__tests__/AcademicContentEditorPage.test.tsx`

**Interfaces:**
- Consumes: `ReturnType<typeof useAcademicContentEditor>`, `AcademicContentBase`, academic year/term labels, permissions, term bounds, lifecycle callbacks.
- Produces: `GenericAcademicContentEditorView(props)` containing the current non-specialized editor UI without changing save behavior.

- [ ] **Step 1: Add a failing regression test for generic fallback rendering**

Extend the existing editor-page test with a `GENERAL_RESOURCE` editor state and assert that the metadata, targets, links, files, readiness, and revision navigation remain available after extraction.

```tsx
it("keeps the generic editor workspace for general resources", () => {
  render(
    <AcademicContentEditorView
      editor={generalResourceEditorState()}
      canManage
      canPublish={false}
      academicYearName="2026/2027"
      termName="Term 1"
    />,
  );

  expect(screen.getByRole("heading", { name: "General resource" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Basic information" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Revision history" })).toBeVisible();
});
```

- [ ] **Step 2: Run the characterization test before extraction**

Run:

```powershell
& { npm run test:run -- src/features/academic-content/pages/__tests__/AcademicContentEditorPage.test.tsx }
```

Expected: PASS against the current inline generic editor. This records behavior that the mechanical extraction must preserve.

- [ ] **Step 3: Extract the current fallback editor body**

Move the code beginning with `const editingDisabled = ...` through the generic editor return into `GenericAcademicContentEditorView`. Preserve the existing section identifiers and callback wiring exactly.

```tsx
export interface GenericAcademicContentEditorViewProps {
  editor: ReturnType<typeof useAcademicContentEditor> & {
    content: AcademicContentDetail;
  };
  canManage: boolean;
  canPublish: boolean;
  academicYearName: string;
  termName: string;
  termBounds?: { startDate: string; endDate: string };
  onLifecycleChanged: (content: AcademicContentBase) => Promise<unknown>;
  onDeleted: () => void;
}
```

Export a component with this props interface, then mechanically move the current `activeSection`, `editingDisabled`, `publicationAvailable`, `editorSections`, `resolvedActiveSection`, `indicators`, and fallback JSX into it. Replace local names only with their `props` equivalents; do not change conditions or callbacks during extraction.

In `AcademicContentEditorView`, replace the fallback body with:

```tsx
return (
  <GenericAcademicContentEditorView
    editor={{ ...editor, content }}
    canManage={canManage}
    canPublish={canPublish}
    academicYearName={academicYearName}
    termName={termName}
    termBounds={termBounds}
    onLifecycleChanged={onLifecycleChanged}
    onDeleted={onDeleted}
  />
);
```

- [ ] **Step 4: Run focused editor workflow tests**

Run:

```powershell
& {
  npm run test:run -- src/features/academic-content/pages/__tests__/AcademicContentEditorPage.test.tsx src/features/academic-content/pages/__tests__/AcademicContentWorkflow.test.tsx
}
```

Expected: PASS with unchanged generic-editor behavior.

- [ ] **Step 5: Run clean-code-guard and test-guard, then commit**

Review only the extraction diff for duplication, changed behavior, broad types, and brittle tests.

```powershell
& {
  git add -- src/features/academic-content/components/editor/GenericAcademicContentEditorView.tsx src/features/academic-content/pages/AcademicContentEditorPage.tsx src/features/academic-content/pages/__tests__/AcademicContentEditorPage.test.tsx
  git commit -m "refactor(academic-content): extract generic editor workspace"
}
```

---

### Task 2: Add contract-safe meeting derivations

**Files:**
- Create: `src/features/academic-content/model/onlineSessionDetail.ts`
- Test: `src/features/academic-content/model/__tests__/onlineSessionDetail.test.ts`

**Interfaces:**
- Consumes: `AcademicContentOnlineSessionDetail`, `Date`.
- Produces:
  - `onlineSessionDetailState(detail, now): "upcoming" | "live" | "ended"`
  - `onlineSessionDetailDurationMinutes(detail): number`
  - `onlineSessionCountdownMinutes(detail, now): number | null`
  - `onlineSessionJoinHref(detail): string | null`

- [ ] **Step 1: Write boundary and URL tests**

```ts
describe("online session detail derivations", () => {
  const detail = sessionDetail({
    startAt: "2026-10-06T10:00:00.000Z",
    endAt: "2026-10-06T10:45:00.000Z",
    joinUrl: "https://meet.google.com/abc-defg-hij",
  });

  it.each([
    ["2026-10-06T09:59:59.999Z", "upcoming"],
    ["2026-10-06T10:00:00.000Z", "live"],
    ["2026-10-06T10:44:59.999Z", "live"],
    ["2026-10-06T10:45:00.000Z", "ended"],
  ])("maps %s to %s", (now, expected) => {
    expect(onlineSessionDetailState(detail, new Date(now))).toBe(expected);
  });

  it("accepts only HTTPS join links", () => {
    expect(onlineSessionJoinHref(detail)).toBe(detail.joinUrl);
    expect(onlineSessionJoinHref({ ...detail, joinUrl: "http://example.com" })).toBeNull();
    expect(onlineSessionJoinHref({ ...detail, joinUrl: "javascript:alert(1)" })).toBeNull();
  });
});
```

- [ ] **Step 2: Run the model test and verify failure**

```powershell
& { npm run test:run -- src/features/academic-content/model/__tests__/onlineSessionDetail.test.ts }
```

Expected: FAIL because `onlineSessionDetail.ts` does not exist.

- [ ] **Step 3: Implement the pure functions**

```ts
export function onlineSessionDetailState(detail: AcademicContentOnlineSessionDetail, now = new Date()) {
  const current = now.getTime();
  if (current < new Date(detail.startAt).getTime()) return "upcoming" as const;
  if (current < new Date(detail.endAt).getTime()) return "live" as const;
  return "ended" as const;
}

export function onlineSessionJoinHref(detail: AcademicContentOnlineSessionDetail) {
  return isValidHttpsUrl(detail.joinUrl) ? detail.joinUrl : null;
}
```

Implement duration as the ceiling of positive elapsed minutes and countdown only for upcoming sessions, returning `null` otherwise.

- [ ] **Step 4: Run the focused model test**

```powershell
& { npm run test:run -- src/features/academic-content/model/__tests__/onlineSessionDetail.test.ts }
```

Expected: PASS.

- [ ] **Step 5: Run guards and commit**

```powershell
& {
  git add -- src/features/academic-content/model/onlineSessionDetail.ts src/features/academic-content/model/__tests__/onlineSessionDetail.test.ts
  git commit -m "feat(academic-content): derive online session lobby state"
}
```

---

### Task 3: Build the header and meeting lobby hero

**Files:**
- Create: `src/components/ui/button/ButtonLink.tsx`
- Modify: `src/components/ui/button/Button.tsx`
- Create: `src/features/academic-content/components/online-session-detail/OnlineSessionHeader.tsx`
- Create: `src/features/academic-content/components/online-session-detail/OnlineSessionLobbyHero.tsx`
- Test: `src/features/academic-content/components/online-session-detail/__tests__/OnlineSessionLobbyHero.test.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`

**Interfaces:**
- Consumes: `Extract<AcademicContentDetail, { type: "ONLINE_SESSION" }>`, `MeetingPlatformIcon`, Task 2 derivations, `LifecycleActions` passed as a slot.
- Produces: meeting-branded read presentation plus `onEdit`, `onBack`, and access-code copy behavior.

- [ ] **Step 1: Write lobby behavior tests**

Render real UI components and a real `ONLINE_SESSION` detail object. Stub only the browser clipboard boundary.

```tsx
it.each([
  ["2026-10-06T09:00:00.000Z", "Upcoming"],
  ["2026-10-06T10:15:00.000Z", "Live now"],
  ["2026-10-06T11:00:00.000Z", "Ended"],
])("keeps Join session enabled in %s state", (now, state) => {
  render(<OnlineSessionLobbyHero content={sessionContent()} now={new Date(now)} />);
  expect(screen.getByText(state)).toBeVisible();
  expect(screen.getByRole("link", { name: /join session/i })).toHaveAttribute(
    "href",
    "https://meet.google.com/abc-defg-hij",
  );
});

it("disables join and explains an invalid meeting link", () => {
  render(<OnlineSessionLobbyHero content={sessionContent({ joinUrl: "http://example.com" })} />);
  expect(screen.getByRole("button", { name: /meeting link unavailable/i })).toBeDisabled();
});
```

Also assert the platform image, title, rich-text description, duration, timezone, provider fallback, access code, copy confirmation, `target="_blank"`, and `rel="noopener noreferrer"`.

- [ ] **Step 2: Run the hero test and verify failure**

```powershell
& { npm run test:run -- src/features/academic-content/components/online-session-detail/__tests__/OnlineSessionLobbyHero.test.tsx }
```

Expected: FAIL because the components and translations do not exist.

- [ ] **Step 3: Implement the header and hero with shared UI**

Extract the existing class composition in `Button.tsx` into an exported `buttonClassName({ variant, size, fullWidth, className })` function, leaving the rendered button unchanged. Create `ButtonLink` as an anchor component that calls that resolver; its props extend `React.AnchorHTMLAttributes<HTMLAnchorElement>` and add `variant?: ButtonVariant`, `size?: ButtonSize`, `fullWidth?: boolean`, `leftIcon?: ReactNode`, and `rightIcon?: ReactNode`. Use it with `RichTextContent`, `MeetingPlatformIcon`, Lucide icons, and semantic `time` elements. Copy access codes through `navigator.clipboard.writeText` and expose confirmation through a `role="status"` live region.

```tsx
const joinHref = details ? onlineSessionJoinHref(details) : null;

return joinHref ? (
  <ButtonLink
    href={joinHref}
    target="_blank"
    rel="noopener noreferrer"
    size="lg"
  >
    {t("join_session")}
  </ButtonLink>
) : (
  <Button size="lg" disabled aria-label={t("meeting_link_unavailable")}>
    {t("join_session")}
  </Button>
);
```

When `content.details` is null, show the explicit incomplete-setup state and retain the Edit action slot for authorized users.

- [ ] **Step 4: Add exact English and Arabic keys**

Add the same keys under `academic_content.online_session_detail` in both message files: workspace label, breadcrumb labels, back, edit, join, unavailable link, copied access code, platform/provider, state labels, countdown units, start/end/duration/timezone/access-code labels, and incomplete-state copy.

- [ ] **Step 5: Run hero and translation parity tests**

```powershell
& {
  npm run test:run -- src/features/academic-content/components/online-session-detail/__tests__/OnlineSessionLobbyHero.test.tsx src/messages/__tests__/academicContentWorkflowTranslations.test.ts
}
```

Expected: PASS.

- [ ] **Step 6: Run guards and commit**

```powershell
& {
  git add -- src/components/ui/button/Button.tsx src/components/ui/button/ButtonLink.tsx src/features/academic-content/components/online-session-detail/OnlineSessionHeader.tsx src/features/academic-content/components/online-session-detail/OnlineSessionLobbyHero.tsx src/features/academic-content/components/online-session-detail/__tests__/OnlineSessionLobbyHero.test.tsx src/messages/en.json src/messages/ar.json
  git commit -m "feat(academic-content): add online session meeting lobby"
}
```

---

### Task 4: Present schedule, audience, resources, and context

**Files:**
- Create: `src/features/academic-content/components/online-session-detail/OnlineSessionInformation.tsx`
- Create: `src/features/academic-content/components/online-session-detail/OnlineSessionResources.tsx`
- Create: `src/features/academic-content/components/online-session-detail/OnlineSessionContextRail.tsx`
- Test: `src/features/academic-content/components/online-session-detail/__tests__/OnlineSessionInformation.test.tsx`
- Test: `src/features/academic-content/components/online-session-detail/__tests__/OnlineSessionResources.test.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`

**Interfaces:**
- Consumes: online-session detail aggregate, `AcademicContentDetailOptions`, `TeacherPreparationTargetDisplay[]`, readiness response, `downloadAcademicContentAsset` callback.
- Produces: read-only contract presentation with independently reported target and download errors.

- [ ] **Step 1: Write information-card tests**

```tsx
it("renders instructions, resolved targets, schedule, and timetable", () => {
  render(
    <OnlineSessionInformation
      content={sessionContent()}
      targets={[{ subject: "Mathematics", scope: "Grade 4 · A" }]}
      targetError={null}
      timetableLabel="Grade 4 · A · Mathematics · Period 2"
    />,
  );

  expect(screen.getByRole("heading", { name: "Meeting instructions" })).toBeVisible();
  expect(screen.getByText("Mathematics · Grade 4 · A")).toBeVisible();
  expect(screen.getByText("Grade 4 · A · Mathematics · Period 2")).toBeVisible();
});

it("omits optional instructions and timetable cards when absent", () => {
  render(<OnlineSessionInformation content={sessionContent({ instructions: null, timetableEntryId: null })} targets={[]} targetError={null} timetableLabel={null} />);
  expect(screen.queryByRole("heading", { name: "Meeting instructions" })).toBeNull();
  expect(screen.queryByRole("heading", { name: "Timetable reference" })).toBeNull();
});
```

- [ ] **Step 2: Write resource tests**

Use real assets, links, and tags. Pass a `vi.fn()` download callback, click the named file action, and assert the exact asset object is passed. Assert empty groups are omitted and a download error remains isolated.

```tsx
fireEvent.click(screen.getByRole("button", { name: "Download worksheet.pdf" }));
expect(onDownload).toHaveBeenCalledWith(content.assets[0]);
expect(screen.getByRole("link", { name: "Pre-reading" })).toHaveAttribute(
  "rel",
  "noopener noreferrer",
);
```

- [ ] **Step 3: Run both focused tests and verify failure**

```powershell
& {
  npm run test:run -- src/features/academic-content/components/online-session-detail/__tests__/OnlineSessionInformation.test.tsx src/features/academic-content/components/online-session-detail/__tests__/OnlineSessionResources.test.tsx
}
```

Expected: FAIL because the components do not exist.

- [ ] **Step 4: Implement focused read-only cards**

Use `EditorSummaryCard`, `RichTextContent`, semantic lists, safe external links, and localized `Intl.DateTimeFormat`. Resolve the timetable label from `options.timetableEntries` by `content.details?.timetableEntryId`; keep unresolved saved references visible as unavailable rather than silently dropping them.

```ts
const timetable = options.timetableEntries.find(
  ({ id }) => id === content.details?.timetableEntryId,
);
```

The context rail renders content status, `PublicationStatusBadge`, backend `readiness.canAdvance` plus blocking messages, `publishAt`, `visibleFrom`, `visibleUntil`, `createdAt`, and `updatedAt`.

- [ ] **Step 5: Add matching English and Arabic strings**

Add labels for instructions, audience, schedule, timetable, materials, links, tags, publication information, readiness, not-set values, target errors, download errors, and timestamp labels.

- [ ] **Step 6: Run focused component and translation tests**

```powershell
& {
  npm run test:run -- src/features/academic-content/components/online-session-detail/__tests__/OnlineSessionInformation.test.tsx src/features/academic-content/components/online-session-detail/__tests__/OnlineSessionResources.test.tsx src/messages/__tests__/academicContentWorkflowTranslations.test.ts
}
```

Expected: PASS.

- [ ] **Step 7: Run guards and commit**

```powershell
& {
  git add -- src/features/academic-content/components/online-session-detail/OnlineSessionInformation.tsx src/features/academic-content/components/online-session-detail/OnlineSessionResources.tsx src/features/academic-content/components/online-session-detail/OnlineSessionContextRail.tsx src/features/academic-content/components/online-session-detail/__tests__/OnlineSessionInformation.test.tsx src/features/academic-content/components/online-session-detail/__tests__/OnlineSessionResources.test.tsx src/messages/en.json src/messages/ar.json
  git commit -m "feat(academic-content): show online session context and resources"
}
```

---

### Task 5: Add authoritative management and history surfaces

**Files:**
- Create: `src/features/academic-content/components/online-session-detail/OnlineSessionManagementHistory.tsx`
- Test: `src/features/academic-content/components/online-session-detail/__tests__/OnlineSessionManagementHistory.test.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`

**Interfaces:**
- Consumes: `readinessPanel`, `publicationPanel`, and `revisionPanel` as `ReactNode` slots plus `showPublication: boolean`.
- Produces: accessible compact navigation that does not reimplement child API behavior.

- [ ] **Step 1: Write real navigation tests with slot content**

```tsx
it("switches between readiness, publication, and revision history", () => {
  render(
    <OnlineSessionManagementHistory
      showPublication
      readinessPanel={<section>Backend readiness</section>}
      publicationPanel={<section>Publication history</section>}
      revisionPanel={<section>Revision history</section>}
    />,
  );

  expect(screen.getByText("Backend readiness")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Publication" }));
  expect(screen.getByText("Publication history")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Revision history" }));
  expect(screen.getByText("Revision history")).toBeVisible();
});

it("omits publication navigation when the surface is unavailable", () => {
  render(<OnlineSessionManagementHistory showPublication={false} readinessPanel={<span>Ready</span>} publicationPanel={<span>Hidden</span>} revisionPanel={<span>History</span>} />);
  expect(screen.queryByRole("button", { name: "Publication" })).toBeNull();
});
```

- [ ] **Step 2: Run the focused test and verify failure**

```powershell
& { npm run test:run -- src/features/academic-content/components/online-session-detail/__tests__/OnlineSessionManagementHistory.test.tsx }
```

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement accessible controlled navigation**

Use shared `Button` components and a local union state:

```ts
type ManagementPanel = "readiness" | "publication" | "revisions";
```

Each control must expose `aria-pressed`; only the selected panel is mounted. If publication becomes unavailable while selected, resolve the active panel to readiness.

- [ ] **Step 4: Add matching translations and run tests**

```powershell
& {
  npm run test:run -- src/features/academic-content/components/online-session-detail/__tests__/OnlineSessionManagementHistory.test.tsx src/messages/__tests__/academicContentWorkflowTranslations.test.ts
}
```

Expected: PASS.

- [ ] **Step 5: Run guards and commit**

```powershell
& {
  git add -- src/features/academic-content/components/online-session-detail/OnlineSessionManagementHistory.tsx src/features/academic-content/components/online-session-detail/__tests__/OnlineSessionManagementHistory.test.tsx src/messages/en.json src/messages/ar.json
  git commit -m "feat(academic-content): add meeting management history"
}
```

---

### Task 6: Orchestrate the complete specialized online-session detail view

**Files:**
- Create: `src/features/academic-content/components/online-session-detail/OnlineSessionEditorView.tsx`
- Test: `src/features/academic-content/components/online-session-detail/__tests__/OnlineSessionEditorView.test.tsx`
- Modify: `src/features/academic-content/pages/AcademicContentEditorPage.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`

**Interfaces:**
- Consumes: all Task 1–5 components, `useAcademicContentTargetDisplay`, `loadAcademicContentDetailOptions`, `downloadAcademicContentAsset`, `ReadinessPanel`, `AcademicContentPublicationPanel`, `RevisionHistoryPanel`, and lifecycle callbacks.
- Produces: the specialized `ONLINE_SESSION` branch in `AcademicContentEditorView`.

- [ ] **Step 1: Write orchestration tests**

Cover lobby default mode, edit-mode transition, complete contract surfaces, permissions, incomplete details, independent option/download failures, and URL preservation.

```tsx
it("opens in lobby mode and enters the existing editor with mode=edit", () => {
  render(<OnlineSessionEditorView {...props()} />);
  expect(screen.getByRole("link", { name: "Join session" })).toBeVisible();

  fireEvent.click(screen.getByRole("button", { name: "Edit session" }));
  expect(replace).toHaveBeenCalledWith(expect.stringContaining("mode=edit"), { scroll: false });
});

it("renders backend readiness, publication, revisions, resources, targets, and lifecycle actions", () => {
  render(<OnlineSessionEditorView {...props()} />);
  expect(screen.getByText("Ready to advance")).toBeVisible();
  expect(screen.getByRole("heading", { name: "Meeting materials" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Publication" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Revision history" })).toBeVisible();
});
```

Use realistic editor state. Mock only network/browser boundaries already isolated by hooks or services; do not mock the lobby’s internal components.

- [ ] **Step 2: Run the orchestration test and verify failure**

```powershell
& { npm run test:run -- src/features/academic-content/components/online-session-detail/__tests__/OnlineSessionEditorView.test.tsx }
```

Expected: FAIL because the view does not exist and dispatch still uses the generic fallback.

- [ ] **Step 3: Implement lobby/edit orchestration**

Read `mode` with `useSearchParams`. Preserve `year`, `term`, and unrelated query keys when adding or removing `mode`. In edit mode render Task 1’s `GenericAcademicContentEditorView` with a Back to meeting lobby action. In lobby mode:

1. Load detail options with independent retry state.
2. Resolve targets through `useAcademicContentTargetDisplay`.
3. Handle asset downloads through `downloadAcademicContentAsset` and a local error message.
4. Render header, hero, information, resources, context rail, and management history.
5. Pass real `ReadinessPanel`, `AcademicContentPublicationPanel`, and `RevisionHistoryPanel` nodes into management history.
6. Refresh aggregate and readiness together after publication or file changes.

```tsx
<OnlineSessionManagementHistory
  showPublication={publicationAvailable}
  readinessPanel={
    <ReadinessPanel readiness={editor.readiness} onRefresh={editor.refreshReadiness} />
  }
  publicationPanel={
    <AcademicContentPublicationPanel
      content={editor.content}
      canMutate={canPublish}
      onContentChanged={refreshAggregateAndReadiness}
    />
  }
  revisionPanel={
    <RevisionHistoryPanel
      key={`${editor.content.id}:${editor.content.updatedAt}`}
      contentId={editor.content.id}
    />
  }
/>
```

- [ ] **Step 4: Add the specialized dispatch and correct deletion route**

Before the generic fallback in `AcademicContentEditorView`:

```tsx
if (content.type === "ONLINE_SESSION") {
  return (
    <OnlineSessionEditorView
      editor={{ ...editor, content }}
      canManage={canManage}
      canPublish={canPublish}
      academicYearName={academicYearName}
      termName={termName}
      termBounds={termBounds}
      onLifecycleChanged={onLifecycleChanged}
      onDeleted={onDeleted}
    />
  );
}
```

Update `onDeleted` route selection so `ONLINE_SESSION` returns to `/online-sessions` rather than the generic hub root.

- [ ] **Step 5: Run focused workflow tests**

```powershell
& {
  npm run test:run -- src/features/academic-content/components/online-session-detail/__tests__/OnlineSessionEditorView.test.tsx src/features/academic-content/pages/__tests__/AcademicContentEditorPage.test.tsx src/features/academic-content/pages/__tests__/AcademicContentWorkflow.test.tsx src/messages/__tests__/academicContentWorkflowTranslations.test.ts
}
```

Expected: PASS.

- [ ] **Step 6: Run typecheck and targeted lint**

```powershell
& {
  npm run typecheck
  npx eslint "src/features/academic-content/model/onlineSessionDetail.ts" "src/features/academic-content/components/online-session-detail/**/*.tsx" "src/features/academic-content/components/editor/GenericAcademicContentEditorView.tsx" "src/features/academic-content/pages/AcademicContentEditorPage.tsx"
}
```

Expected: both commands exit successfully with no new warning caused by this task.

- [ ] **Step 7: Run clean-code-guard and test-guard over the complete task diff**

Confirm:

- No per-card or fabricated-data requests were introduced.
- Readiness/publication eligibility remains backend-authoritative.
- Join links accept HTTPS only and use safe external-link attributes.
- Components have focused responsibilities and no copied API orchestration.
- Tests assert user-visible behavior and do not mock internal lobby components.
- No lint/type suppressions, temporary copy, or unrelated refactors exist.

- [ ] **Step 8: Commit the integrated detail page**

```powershell
& {
  git add -- src/features/academic-content/components/online-session-detail src/features/academic-content/pages/AcademicContentEditorPage.tsx src/messages/en.json src/messages/ar.json
  git commit -m "feat(academic-content): integrate online session meeting details"
}
```

---

### Task 7: Final focused verification and owner handoff

**Files:**
- Verify: all files listed in this plan.
- Do not modify unrelated dirty-worktree files.

**Interfaces:**
- Consumes: completed implementation from Tasks 1–6.
- Produces: evidence-backed handoff; no merge or deployment.

- [ ] **Step 1: Run all online-session and shared affected tests**

```powershell
& {
  npm run test:run -- src/features/academic-content/model/__tests__/onlineSessionDetail.test.ts src/features/academic-content/model/__tests__/onlineSessions.test.ts src/features/academic-content/components/online-session-detail src/features/academic-content/components/overview/__tests__/MeetingPlatformIcon.test.tsx src/features/academic-content/pages/__tests__/AcademicContentEditorPage.test.tsx src/features/academic-content/pages/__tests__/AcademicContentWorkflow.test.tsx src/messages/__tests__/academicContentWorkflowTranslations.test.ts
}
```

Expected: all selected test files pass.

- [ ] **Step 2: Run typecheck and task-scoped lint again**

```powershell
& {
  npm run typecheck
  npx eslint "src/features/academic-content/model/onlineSessionDetail.ts" "src/features/academic-content/components/online-session-detail/**/*.tsx" "src/features/academic-content/components/editor/GenericAcademicContentEditorView.tsx" "src/features/academic-content/pages/AcademicContentEditorPage.tsx"
}
```

Expected: PASS with no new warnings.

- [ ] **Step 3: Ask before broad verification**

Ask the owner before running `npm run test:run`, `npm run lint`, or the production build across the whole project. Record any commands not run as `NOT_RUN` rather than `PASS`.

- [ ] **Step 4: Inspect the task diff and working tree**

```powershell
& {
  git diff --check
  git status --short
  git log --oneline -8
}
```

Expected: no whitespace errors; task files are committed; unrelated pre-existing changes remain preserved.

- [ ] **Step 5: Prepare the repository handoff**

Report focused test, typecheck, lint, full-suite, and build status separately. Do not push, create a PR, merge, or deploy unless the owner explicitly requests the corresponding action.
