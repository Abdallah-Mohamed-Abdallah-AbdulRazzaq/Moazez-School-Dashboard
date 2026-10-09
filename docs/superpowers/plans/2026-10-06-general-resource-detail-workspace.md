# General Resource Detail Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dedicated, responsive General Resource detail workspace that consumes every applicable backend contract field and action without changing the backend.

**Architecture:** Keep `AcademicContentEditorPage` and `useAcademicContentEditor` as the single aggregate and mutation boundary, then add a `GENERAL_RESOURCE` presentation branch composed from focused header, navigation, overview, resources, and context-rail components. Reuse the existing metadata, targets, links, tags, files, readiness, publication, revision, and lifecycle components; extract shared file-policy loading only where needed to prevent duplicate policy requests, and extend the shared publication audit modal for already-parsed contract fields that are not yet rendered.

**Tech Stack:** Next.js App Router, React 19, TypeScript, next-intl, Tailwind CSS, Lucide icons, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-06-general-resource-detail-design.md`

## Global Constraints

- Backend source of truth: `Moazez-Backend` `origin/main` at `d84945e09c90de8723f4859b7eb69285ffd0468d`; do not change backend code or payloads.
- `GENERAL_RESOURCE.details` remains `null`; do not create or call a General Resource type-detail endpoint.
- Use existing components from `src/components/ui`; add a UI primitive there only when no current primitive fits a reusable need.
- Keep `useAcademicContentEditor` as the single aggregate/mutation source and preserve dirty-navigation guards.
- Preserve all existing specialized content-type branches and the generic fallback.
- Approval workflow is intentionally absent for General Resources because the backend policy limits it to `TEACHER_PREPARATION`.
- Keep content status separate from publication status and preserve permission/read-only gating.
- Do not expose raw identifiers in normal UI; publication audit identifiers must be explicitly labelled as identifiers.
- English and Arabic keys must remain in parity, and navigation/layout must be RTL-safe.
- Run Clean Code Guard after every production-code change and Test Guard after every test-code change.
- Do not run the full test suite without explicit user approval. Focused tests, scoped ESLint, typecheck, and production build are allowed.
- Wrap every PowerShell command group in one `& {` / `}` execution gate.

## File Structure

### New files

- `src/features/academic-content/hooks/useAcademicContentFilePolicy.ts` — shared, retryable school file-policy loader used by the General Resource view and existing file manager.
- `src/features/academic-content/components/general-resource-detail/GeneralResourceEditorView.tsx` — dedicated page composition and active-panel selection.
- `src/features/academic-content/components/general-resource-detail/GeneralResourceHeader.tsx` — back navigation, identity, statuses, description, and aggregate summary.
- `src/features/academic-content/components/general-resource-detail/GeneralResourceSectionNav.tsx` — typed responsive section navigation and indicators.
- `src/features/academic-content/components/general-resource-detail/GeneralResourceOverview.tsx` — academic context, metadata editor, and tag editor composition.
- `src/features/academic-content/components/general-resource-detail/GeneralResourceResources.tsx` — links/files composition with the shared policy state.
- `src/features/academic-content/components/general-resource-detail/GeneralResourceContextRail.tsx` — readiness, target, tag, publication, audit, counts, and recipient-access summaries.
- `src/features/academic-content/components/general-resource-detail/__tests__/GeneralResourceChrome.test.tsx` — header, navigation, context, RTL-safe semantics, and unsupported-field assertions.
- `src/features/academic-content/components/general-resource-detail/__tests__/GeneralResourcePanels.test.tsx` — metadata/tag composition and resource manager behavior.
- `src/features/academic-content/components/general-resource-detail/__tests__/GeneralResourceEditorView.test.tsx` — panel composition, saving, permissions, read-only behavior, and publication availability.
- `src/features/academic-content/hooks/__tests__/useAcademicContentFilePolicy.test.tsx` — policy loading, retry, disabled loading, and failure isolation.

### Modified files

- `src/features/academic-content/components/editor/FilesSection.tsx` — consume injectable shared file-policy state, display asset creation time, and show recipient-access policy when requested.
- `src/features/academic-content/components/editor/AcademicContentResources.tsx` — forward optional file-policy state and recipient-policy presentation.
- `src/features/academic-content/components/editor/__tests__/FilesSection.test.tsx` — verify the complete applicable policy and asset field presentation.
- `src/features/academic-content/components/publication/PublicationDetailModal.tsx` — render cancellation, supersession, change-significance, and minor-update fields already present in the contract.
- `src/features/academic-content/components/publication/__tests__/PublicationDetailModal.test.tsx` — cover every publication-detail field and null fallback.
- `src/features/academic-content/pages/AcademicContentEditorPage.tsx` — route `GENERAL_RESOURCE` to the new dedicated workspace.
- `src/features/academic-content/pages/__tests__/AcademicContentEditorPage.test.tsx` — verify the dedicated branch and preserve all other branches.
- `src/messages/en.json` — English General Resource detail and publication audit labels.
- `src/messages/ar.json` — Arabic General Resource detail and publication audit labels.
- `src/messages/__tests__/academicContentWorkflowTranslations.test.ts` — enforce new namespace parity and required keys.

---

### Task 1: Share the complete file-policy state

**Files:**
- Create: `src/features/academic-content/hooks/useAcademicContentFilePolicy.ts`
- Create: `src/features/academic-content/hooks/__tests__/useAcademicContentFilePolicy.test.tsx`
- Modify: `src/features/academic-content/components/editor/FilesSection.tsx`
- Modify: `src/features/academic-content/components/editor/AcademicContentResources.tsx`
- Modify: `src/features/academic-content/components/editor/__tests__/FilesSection.test.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`

**Interfaces:**
- Consumes: `getAcademicContentFilePolicy(): Promise<AcademicContentFilePolicy>` and `AcademicContentUiError` from existing services.
- Produces:

```ts
export interface AcademicContentFilePolicyState {
  policy: AcademicContentFilePolicy | null;
  isLoading: boolean;
  error: AcademicContentUiError | null;
  reload: () => Promise<void>;
}

export function useAcademicContentFilePolicy(
  enabled?: boolean,
): AcademicContentFilePolicyState;
```

- Extends `FilesSectionProps` with `policyState?: AcademicContentFilePolicyState` and `showRecipientAccessPolicy?: boolean`.
- Extends `AcademicContentResourcesProps` with `filePolicyState?: AcademicContentFilePolicyState` and `showRecipientAccessPolicy?: boolean`, forwarding them as `policyState` and `showRecipientAccessPolicy` to `FilesSection`; existing callers remain source-compatible.

- [ ] **Step 1: Write failing hook tests**

```tsx
const api = vi.hoisted(() => ({
  getAcademicContentFilePolicy: vi.fn(),
}));
vi.mock("../../services/academicContentApi", () => ({
  getAcademicContentFilePolicy: api.getAcademicContentFilePolicy,
}));
const filePolicy: AcademicContentFilePolicy = {
  attachmentsEnabled: true,
  maximumFileSizeBytes: "10485760",
  documentsEnabled: true,
  imagesEnabled: true,
  videosEnabled: false,
  audioEnabled: false,
  archivesEnabled: false,
  otherFilesEnabled: false,
  allowStudentDownload: true,
  allowGuardianDownload: false,
  allowInlinePreview: true,
};

it("loads every school file-policy flag and supports retry", async () => {
  api.getAcademicContentFilePolicy
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValueOnce(filePolicy);
  const { result } = renderHook(() => useAcademicContentFilePolicy());
  await waitFor(() => expect(result.current.error).not.toBeNull());
  await act(async () => {
    await result.current.reload();
  });
  expect(result.current.policy).toEqual(filePolicy);
  expect(result.current.error).toBeNull();
});

it("does not request policy when an injected owner disables loading", () => {
  renderHook(() => useAcademicContentFilePolicy(false));
  expect(api.getAcademicContentFilePolicy).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run the hook test and verify RED**

```powershell
& {
  npm run test:run -- src/features/academic-content/hooks/__tests__/useAcademicContentFilePolicy.test.tsx
}
```

Expected: FAIL because `useAcademicContentFilePolicy` does not exist.

- [ ] **Step 3: Implement the shared hook**

```ts
export function useAcademicContentFilePolicy(
  enabled = true,
): AcademicContentFilePolicyState {
  const requestIdRef = useRef(0);
  const [policy, setPolicy] = useState<AcademicContentFilePolicy | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<AcademicContentUiError | null>(null);

  const reload = useCallback(async () => {
    if (!enabled) return;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setIsLoading(true);
    setError(null);
    try {
      const loadedPolicy = await getAcademicContentFilePolicy();
      if (requestIdRef.current === requestId) setPolicy(loadedPolicy);
    } catch (loadError) {
      if (requestIdRef.current === requestId) {
        setPolicy(null);
        setError(academicContentUiError(loadError));
      }
    } finally {
      if (requestIdRef.current === requestId) setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void reload();
    return () => {
      requestIdRef.current += 1;
    };
  }, [reload]);

  return { policy, isLoading, error, reload };
}
```

- [ ] **Step 4: Write failing file-manager coverage for injected policy and full asset display**

```tsx
render(
  <FilesSection
    contentId="content-1"
    assets={[asset]}
    disabled={false}
    policyState={{ policy: filePolicy, isLoading: false, error: null, reload: vi.fn() }}
    showRecipientAccessPolicy
    onFilesChanged={vi.fn()}
  />,
);
expect(api.getAcademicContentFilePolicy).not.toHaveBeenCalled();
expect(screen.getByText(/application\/pdf.*1 KiB.*Oct 5, 2026/i)).toBeVisible();
expect(screen.getByText(/student downloads enabled/i)).toBeVisible();
expect(screen.getByText(/guardian downloads disabled/i)).toBeVisible();
expect(screen.getByText(/inline preview enabled/i)).toBeVisible();
```

- [ ] **Step 5: Implement policy injection and complete policy presentation**

```tsx
const internalPolicyState = useAcademicContentFilePolicy(
  policyState === undefined,
);
const effectivePolicyState = policyState ?? internalPolicyState;
const policy = effectivePolicyState.policy;
const locale = useLocale();
const dateFormatter = new Intl.DateTimeFormat(locale, {
  dateStyle: "medium",
  timeStyle: "short",
});
const displayedError = error ?? effectivePolicyState.error?.message ?? null;

<AttachmentListItem
  icon={<FileIcon aria-hidden="true" className="size-5 text-primary" />}
  title={asset.originalName}
  subtitle={`${asset.mimeType} · ${formatByteCount(asset.sizeBytes)} · ${dateFormatter.format(new Date(asset.createdAt))}`}
  disabled={unlinkingAssetId === asset.assetId}
  actionsLabel={t("actions", { name: asset.originalName })}
  actions={disabled ? [] : [{
    label: t("unlink"),
    icon: <Trash2 aria-hidden="true" className="size-4" />,
    color: "error",
    onClick: () => void unlink(asset),
  }]}
/>;
```

Replace the component’s local file-policy request effect with the hook state above, while keeping upload/unlink operation errors in the existing local `error` state. Render `displayedError` with a retry action that calls `effectivePolicyState.reload()` when the policy request failed. Render a read-only three-row policy summary only when `showRecipientAccessPolicy` is true; add English/Arabic `files.recipient_policy`, `files.student_download_enabled`, `files.student_download_disabled`, `files.guardian_download_enabled`, `files.guardian_download_disabled`, `files.inline_preview_enabled`, `files.inline_preview_disabled`, and `files.retry_policy` keys so color is not the sole signal. Continue using the live policy’s attachment, size, and file-family flags in `validateAcademicContentFileAgainstPolicy`.

- [ ] **Step 6: Run focused tests and verify GREEN**

```powershell
& {
  npm run test:run -- src/features/academic-content/hooks/__tests__/useAcademicContentFilePolicy.test.tsx src/features/academic-content/components/editor/__tests__/FilesSection.test.tsx
}
```

Expected: PASS.

- [ ] **Step 7: Run required guards**

Use Clean Code Guard on the hook and production component changes. Use Test Guard on both modified/created test files. Fix all must-fix findings before continuing.

- [ ] **Step 8: Commit Task 1**

```powershell
& {
  git add -- src/features/academic-content/hooks/useAcademicContentFilePolicy.ts src/features/academic-content/hooks/__tests__/useAcademicContentFilePolicy.test.tsx src/features/academic-content/components/editor/FilesSection.tsx src/features/academic-content/components/editor/AcademicContentResources.tsx src/features/academic-content/components/editor/__tests__/FilesSection.test.tsx src/messages/en.json src/messages/ar.json
  git commit -m "feat(academic-content): share resource file policy"
}
```

### Task 2: Complete the publication audit contract

**Files:**
- Modify: `src/features/academic-content/components/publication/PublicationDetailModal.tsx`
- Modify: `src/features/academic-content/components/publication/__tests__/PublicationDetailModal.test.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`

**Interfaces:**
- Consumes: existing `AcademicContentPublication` fields.
- Produces: no new API or component props; the modal visibly accounts for `cancellationReason`, `supersedesPublicationId`, `changeSignificance`, and `notifyMinorUpdate`.

- [ ] **Step 1: Complete the publication fixture and write failing assertions**

```tsx
const detail: AcademicContentPublication = {
  publicationId: "publication-1",
  revisionId: "revision-1",
  status: "CANCELLED",
  sourceContentStatus: "PUBLISHED",
  publishAt: "2026-10-05T08:00:00.000Z",
  visibleFrom: "2026-10-05T09:00:00.000Z",
  visibleUntil: "2026-10-06T09:00:00.000Z",
  publishedAt: "2026-10-05T08:00:05.000Z",
  expiredAt: null,
  cancelledAt: "2026-10-05T10:00:00.000Z",
  studentRecipientCount: 12,
  guardianRecipientContextCount: 8,
  createdByUserId: "user-1",
  createdAt: "2026-10-05T07:59:00.000Z",
  cancellationReason: "REVISION_STARTED",
  supersedesPublicationId: "publication-0",
  changeSignificance: "MINOR",
  notifyMinorUpdate: true,
};

expect(screen.getByText("Revision started")).toBeVisible();
expect(screen.getByText("publication-0")).toBeVisible();
expect(screen.getByText("Minor")).toBeVisible();
expect(screen.getByText("Yes")).toBeVisible();
```

Add a second case with all nullable audit values set to `null` and `notifyMinorUpdate: false`; assert the localized unavailable/No values rather than hidden rows.

- [ ] **Step 2: Run the publication modal test and verify RED**

```powershell
& {
  npm run test:run -- src/features/academic-content/components/publication/__tests__/PublicationDetailModal.test.tsx
}
```

Expected: FAIL because the four audit fields are not rendered.

- [ ] **Step 3: Render the missing fields using existing detail-card styling**

```tsx
<DetailItem label={t("cancellation_reason")}>
  {detail.cancellationReason
    ? t(`cancellation_reasons.${detail.cancellationReason}`)
    : t("not_available")}
</DetailItem>
<DetailItem label={t("supersedes_publication_id")}>
  {detail.supersedesPublicationId ?? t("not_available")}
</DetailItem>
<DetailItem label={t("change_significance")}>
  {detail.changeSignificance
    ? t(`change_significance_values.${detail.changeSignificance}`)
    : t("not_available")}
</DetailItem>
<DetailItem label={t("notify_minor_update")}>
  {t(detail.notifyMinorUpdate ? "yes" : "no")}
</DetailItem>
```

Add exact English and Arabic keys for the labels and enum values under `academic_content.publication`. Keep publication/revision/creator IDs explicitly labelled as identifiers.

- [ ] **Step 4: Run the publication modal test and verify GREEN**

```powershell
& {
  npm run test:run -- src/features/academic-content/components/publication/__tests__/PublicationDetailModal.test.tsx
}
```

Expected: PASS.

- [ ] **Step 5: Run required guards**

Use Clean Code Guard on `PublicationDetailModal.tsx`. Use Test Guard on `PublicationDetailModal.test.tsx`. Fix all must-fix findings.

- [ ] **Step 6: Commit Task 2**

```powershell
& {
  git add -- src/features/academic-content/components/publication/PublicationDetailModal.tsx src/features/academic-content/components/publication/__tests__/PublicationDetailModal.test.tsx src/messages/en.json src/messages/ar.json
  git commit -m "feat(academic-content): complete publication audit details"
}
```

### Task 3: Build the General Resource chrome and context rail

**Files:**
- Create: `src/features/academic-content/components/general-resource-detail/GeneralResourceHeader.tsx`
- Create: `src/features/academic-content/components/general-resource-detail/GeneralResourceSectionNav.tsx`
- Create: `src/features/academic-content/components/general-resource-detail/GeneralResourceContextRail.tsx`
- Create: `src/features/academic-content/components/general-resource-detail/__tests__/GeneralResourceChrome.test.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`

**Interfaces:**
- Consumes: `Extract<AcademicContentDetail, { type: "GENERAL_RESOURCE" }>`, `TeacherPreparationTargetDisplay`, `AcademicContentReadinessResponse`, and `AcademicContentFilePolicyState`.
- Produces:

```ts
export const GENERAL_RESOURCE_PANELS = [
  "overview",
  "targets",
  "resources",
  "readiness",
  "publication",
  "revisions",
] as const;
export type GeneralResourcePanel = (typeof GENERAL_RESOURCE_PANELS)[number];
```

- `GeneralResourceHeader` props: `content`, `locale`, and optional `lifecycleActions`.
- `GeneralResourceContextRail` props: `content`, `readiness`, `targets`, `targetError`, `filePolicyState`, and `onRefreshReadiness`.

- [ ] **Step 1: Write failing chrome tests**

```tsx
render(
  <GeneralResourceHeader
    content={content}
    locale="en"
    lifecycleActions={<button>Archive resource</button>}
  />,
);
expect(screen.getByRole("heading", { name: "School policy pack" })).toBeVisible();
expect(screen.getByText("Students and guardians")).toBeVisible();
expect(screen.getByText("2 targets")).toBeVisible();
expect(screen.getByText("3 attachments")).toBeVisible();
expect(screen.queryByText("content-1")).toBeNull();
expect(screen.queryByText(/created by/i)).toBeNull();
```

Add navigation assertions for `aria-current`, publication omission for internal staff, mobile/desktop button parity, and context-rail assertions for readiness reasons, resolved targets, ordered tags, publication timing, created/updated times, link/asset counts, and recipient policy.

- [ ] **Step 2: Run the chrome test and verify RED**

```powershell
& {
  npm run test:run -- src/features/academic-content/components/general-resource-detail/__tests__/GeneralResourceChrome.test.tsx
}
```

Expected: FAIL because the new components do not exist.

- [ ] **Step 3: Implement the header and navigation**

```tsx
export default function GeneralResourceHeader({ content, locale, lifecycleActions }: Props) {
  const t = useAcademicContentTranslations("general_resource_detail");
  const commonT = useAcademicContentTranslations();
  const formatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const backHref = academicContentOverviewHref({
    locale,
    routeSuffix: "/general-resources",
    yearId: content.academicYearId,
    termId: content.termId,
  });
  return (
    <header className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={backHref} className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-primary">
          <ArrowLeft aria-hidden="true" className="size-4 rtl:rotate-180" />
          {t("header.back")}
        </Link>
        {lifecycleActions}
      </div>
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <FolderOpen className="size-6" aria-hidden="true" />
        <h1>{content.title}</h1>
        {content.description ? <RichTextContent value={content.description} /> : null}
        <AcademicContentStatusBadge status={content.status} />
        {content.publicationStatus ? <PublicationStatusBadge status={content.publicationStatus} /> : null}
        <div className="grid border-t border-gray-200 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCell label={commonT(`audiences.${content.audience}`)} icon={<Users aria-hidden="true" />} />
          <SummaryCell label={t("header.targets", { count: content.targets.length })} icon={<Target aria-hidden="true" />} />
          <SummaryCell label={t("header.attachments", { count: content.assets.length })} icon={<Paperclip aria-hidden="true" />} />
          <SummaryCell label={formatter.format(new Date(content.updatedAt))} icon={<Clock3 aria-hidden="true" />} />
        </div>
      </section>
    </header>
  );
}
```

Define a private `SummaryCell({ icon, label }: { icon: ReactNode; label: string })` in the header file. Use `FolderOpen` with `bg-sky-50 text-sky-600`, the existing badges, `RichTextContent`, and `rtl:rotate-180` on the back arrow. Navigation follows the Weekly Plan responsive pattern but uses the six approved General Resource panels.

- [ ] **Step 4: Implement the read-only context rail**

```tsx
const sortedTags = [...content.tags].sort((a, b) => a.sortOrder - b.sortOrder);
const publicationTimes = [content.publishAt, content.visibleFrom, content.visibleUntil]
  .filter((value): value is string => Boolean(value));

<aside aria-label={t("context.rail_label")} className="space-y-4">
  <SummaryCard title={t("context.readiness")}>
    <p>{readiness?.canAdvance ? t("context.ready") : t("context.blocked")}</p>
    {readiness?.blockingReasons.map((reason) => <p key={reason.code}>{reason.message}</p>)}
  </SummaryCard>
  <SummaryCard title={t("context.targets")}>
    {targets.map((target) => <p key={target.targetId}>{[target.subject, target.scope].filter(Boolean).join(" · ") || t("context.unavailable")}</p>)}
  </SummaryCard>
  <SummaryCard title={t("context.tags")}>
    {sortedTags.map((tag) => <span key={tag.id}>{tag.value}</span>)}
  </SummaryCard>
  <SummaryCard title={t("context.publication")}>
    {content.publicationStatus ? <PublicationStatusBadge status={content.publicationStatus} /> : <p>{t("context.not_published")}</p>}
    {publicationTimes.map((value) => <time key={value} dateTime={value}>{formatter.format(new Date(value))}</time>)}
  </SummaryCard>
  <SummaryCard title={t("context.audit")}>
    <time dateTime={content.createdAt}>{formatter.format(new Date(content.createdAt))}</time>
    <time dateTime={content.updatedAt}>{formatter.format(new Date(content.updatedAt))}</time>
  </SummaryCard>
  <SummaryCard title={t("context.resources")}>
    <p>{t("context.asset_count", { count: content.assets.length })}</p>
    <p>{t("context.link_count", { count: content.links.length })}</p>
    <RecipientPolicySummary state={filePolicyState} />
  </SummaryCard>
</aside>
```

Define private `SummaryCard({ title, icon, action, children }: SummaryCardProps)` and `RecipientPolicySummary({ state }: { state: AcademicContentFilePolicyState })` helpers in `GeneralResourceContextRail.tsx`; the latter renders loading, retryable error, unavailable, and all three recipient-policy boolean states. Sort assets, links, and tags with copied arrays (`[...items].sort(...)`) so props are never mutated. Show resolver failure as a localized warning and never fall back to raw IDs.

- [ ] **Step 5: Add complete English/Arabic chrome copy**

Add `academic_content.general_resource_detail` with `workspace_label`, `sections_label`, `sections`, `header`, and `context` trees. Include pluralized count messages, empty/unavailable text, policy enabled/disabled copy, and accessible action labels.

- [ ] **Step 6: Run the chrome test and verify GREEN**

```powershell
& {
  npm run test:run -- src/features/academic-content/components/general-resource-detail/__tests__/GeneralResourceChrome.test.tsx
}
```

Expected: PASS.

- [ ] **Step 7: Run required guards**

Use Clean Code Guard on all three production components and Test Guard on `GeneralResourceChrome.test.tsx`. Fix all must-fix findings.

- [ ] **Step 8: Commit Task 3**

```powershell
& {
  git add -- src/features/academic-content/components/general-resource-detail/GeneralResourceHeader.tsx src/features/academic-content/components/general-resource-detail/GeneralResourceSectionNav.tsx src/features/academic-content/components/general-resource-detail/GeneralResourceContextRail.tsx src/features/academic-content/components/general-resource-detail/__tests__/GeneralResourceChrome.test.tsx src/messages/en.json src/messages/ar.json
  git commit -m "feat(academic-content): add general resource workspace chrome"
}
```

### Task 4: Compose the General Resource overview and resources panels

**Files:**
- Create: `src/features/academic-content/components/general-resource-detail/GeneralResourceOverview.tsx`
- Create: `src/features/academic-content/components/general-resource-detail/GeneralResourceResources.tsx`
- Create: `src/features/academic-content/components/general-resource-detail/__tests__/GeneralResourcePanels.test.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`

**Interfaces:**
- Consumes: existing `BasicInformationSection`, `TagsSection`, `AcademicContentResources`, editor section states/save callbacks, and `AcademicContentFilePolicyState`.
- Produces: focused composition components with no new backend calls.

- [ ] **Step 1: Write failing panel-composition tests**

```tsx
render(
  <GeneralResourceOverview
    content={content}
    academicYearName="2026/2027"
    termName="Term 1"
    disabled={false}
    metadataState={cleanState}
    tagsState={cleanState}
    onMetadataDirtyChange={vi.fn()}
    onSaveMetadata={saveMetadata}
    onTagsDirty={vi.fn()}
    onSaveTags={saveTags}
  />,
);
expect(screen.getByText("2026/2027")).toBeVisible();
expect(screen.getByText("Term 1")).toBeVisible();
expect(screen.getByLabelText("Title")).toHaveValue(content.title);
expect(screen.getByText("Policy")).toBeVisible();
```

Render `GeneralResourceResources` with injected policy and assert that link reorder/save and attachment upload/unlink surfaces remain present while no type-detail form or asset-reorder control appears.

- [ ] **Step 2: Run the panel test and verify RED**

```powershell
& {
  npm run test:run -- src/features/academic-content/components/general-resource-detail/__tests__/GeneralResourcePanels.test.tsx
}
```

Expected: FAIL because the composition components do not exist.

- [ ] **Step 3: Implement Overview from existing editors**

```tsx
export default function GeneralResourceOverview(props: Props) {
  const t = useAcademicContentTranslations("general_resource_detail");
  const commonT = useAcademicContentTranslations();
  return (
    <div className="space-y-4">
      <section className="grid gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:grid-cols-3">
        <ContextValue label={t("overview.content_type")} value={commonT("types.GENERAL_RESOURCE")} />
        <ContextValue label={t("overview.academic_year")} value={props.academicYearName} />
        <ContextValue label={t("overview.term")} value={props.termName} />
      </section>
      <BasicInformationSection
        content={props.content}
        disabled={props.disabled}
        sectionState={props.metadataState}
        onDirtyChange={props.onMetadataDirtyChange}
        onSave={props.onSaveMetadata}
      />
      <TagsSection
        key={JSON.stringify(props.content.tags)}
        initial={props.content.tags}
        disabled={props.disabled}
        sectionState={props.tagsState}
        onDirty={props.onTagsDirty}
        onSave={props.onSaveTags}
      />
    </div>
  );
}
```

Define a private `ContextValue({ label, value }: { label: string; value: string })` helper in the same file. Do not combine metadata and tag save operations. Preserve the existing 180-character title and 4,000-character rich-text serialization limits.

- [ ] **Step 4: Implement Resources as a narrow wrapper**

```tsx
export default function GeneralResourceResources(props: Props) {
  return (
    <AcademicContentResources
      content={props.content}
      disabled={props.disabled}
      linksState={props.linksState}
      onLinksDirty={props.onLinksDirty}
      onSaveLinks={props.onSaveLinks}
      onFilesChanged={props.onFilesChanged}
      filePolicyState={props.filePolicyState}
      showRecipientAccessPolicy
    />
  );
}
```

Do not add attachment reordering, management download, or preview actions. Preserve existing safe HTTP/HTTPS validation, 100-link limit, upload/cancel/retry/complete, and unlink behavior.

- [ ] **Step 5: Run the panel test and verify GREEN**

```powershell
& {
  npm run test:run -- src/features/academic-content/components/general-resource-detail/__tests__/GeneralResourcePanels.test.tsx
}
```

Expected: PASS.

- [ ] **Step 6: Run required guards**

Use Clean Code Guard on both production components and Test Guard on `GeneralResourcePanels.test.tsx`. Fix all must-fix findings.

- [ ] **Step 7: Commit Task 4**

```powershell
& {
  git add -- src/features/academic-content/components/general-resource-detail/GeneralResourceOverview.tsx src/features/academic-content/components/general-resource-detail/GeneralResourceResources.tsx src/features/academic-content/components/general-resource-detail/__tests__/GeneralResourcePanels.test.tsx src/messages/en.json src/messages/ar.json
  git commit -m "feat(academic-content): add general resource detail panels"
}
```

### Task 5: Assemble the dedicated General Resource editor

**Files:**
- Create: `src/features/academic-content/components/general-resource-detail/GeneralResourceEditorView.tsx`
- Create: `src/features/academic-content/components/general-resource-detail/__tests__/GeneralResourceEditorView.test.tsx`

**Interfaces:**
- Consumes: `useAcademicContentEditor` return type narrowed to `GENERAL_RESOURCE`, `useAcademicContentTargetDisplay`, `useAcademicContentFilePolicy`, all Task 3/4 components, and existing targets/readiness/publication/revision/lifecycle components.
- Produces: `GeneralResourceEditorView` with the same permission/lifecycle callback shape as other specialized views plus `academicYearName` and `termName`.

- [ ] **Step 1: Write failing editor behavior tests**

```tsx
render(
  <GeneralResourceEditorView
    editor={editor}
    canManage
    canPublish
    academicYearName="2026/2027"
    termName="Term 1"
    onLifecycleChanged={vi.fn()}
    onDeleted={vi.fn()}
  />,
);
expect(screen.getByRole("main", { name: "General resource workspace" })).toBeVisible();
fireEvent.click(screen.getAllByRole("button", { name: "Resources" })[0]);
expect(screen.getByRole("heading", { name: "Files" })).toBeVisible();
expect(screen.getByRole("heading", { name: "Links" })).toBeVisible();
```

Add cases for Overview metadata/tag callbacks, targets, readiness refresh, revisions, `INTERNAL_STAFF` publication omission, external-audience publication gating, shared publication-panel composition (including publication readiness, audience preview, history, and detail), read-only status, dirty indicators, target resolver failure, and file-policy failure isolation.

- [ ] **Step 2: Run the editor test and verify RED**

```powershell
& {
  npm run test:run -- src/features/academic-content/components/general-resource-detail/__tests__/GeneralResourceEditorView.test.tsx
}
```

Expected: FAIL because `GeneralResourceEditorView` does not exist.

- [ ] **Step 3: Implement the editor composition**

```tsx
function sectionIndicator(section: AcademicContentEditorSectionState): EditorSectionIndicator | undefined {
  if (section.error) return "error";
  if (section.saving) return "saving";
  return section.dirty ? "unsaved" : undefined;
}

const [activePanel, setActivePanel] = useState<GeneralResourcePanel>("overview");
const filePolicyState = useAcademicContentFilePolicy();
const disabled = editor.isReadOnly || !canManage;
const t = useAcademicContentTranslations("general_resource_detail");
const editorT = useAcademicContentTranslations("editor");
const { targets, error: targetError } = useAcademicContentTargetDisplay(
  content,
  locale,
  t("context.unavailable"),
);
const publicationAvailable = isPublicationSurfaceAvailable(
  content.type,
  content.audience,
);
const refreshContent = async () => {
  await Promise.all([editor.refreshAggregate(), editor.refreshReadiness()]);
};

const panels: Record<GeneralResourcePanel, React.ReactNode> = {
  overview: (
    <GeneralResourceOverview
      content={content}
      academicYearName={academicYearName}
      termName={termName}
      disabled={disabled}
      metadataState={editor.sections.metadata}
      tagsState={editor.sections.tags}
      onMetadataDirtyChange={(dirty) => editor.markSectionDirty("metadata", dirty)}
      onSaveMetadata={editor.saveMetadata}
      onTagsDirty={() => editor.markSectionDirty("tags", true)}
      onSaveTags={editor.saveTags}
    />
  ),
  targets: (
    <AcademicTargetsSection
      content={content}
      disabled={disabled}
      sectionState={editor.sections.targets}
      onDirtyChange={(dirty) => editor.markSectionDirty("targets", dirty)}
      onSave={editor.saveTargets}
    />
  ),
  resources: (
    <GeneralResourceResources
      content={content}
      disabled={disabled}
      linksState={editor.sections.links}
      onLinksDirty={() => editor.markSectionDirty("links", true)}
      onSaveLinks={editor.saveLinks}
      onFilesChanged={refreshContent}
      filePolicyState={filePolicyState}
    />
  ),
  readiness: <ReadinessPanel readiness={editor.readiness} onRefresh={editor.refreshReadiness} />,
  publication: <AcademicContentPublicationPanel content={content} canMutate={canPublish} onContentChanged={refreshContent} />,
  revisions: <RevisionHistoryPanel key={`${content.id}:${content.updatedAt}`} contentId={content.id} />,
};
const indicators: Partial<Record<GeneralResourcePanel, EditorSectionIndicator>> = {
  overview:
    editor.sections.metadata.error || editor.sections.tags.error
      ? "error"
      : editor.sections.metadata.saving || editor.sections.tags.saving
        ? "saving"
        : editor.sections.metadata.dirty || editor.sections.tags.dirty
          ? "unsaved"
          : undefined,
  targets: sectionIndicator(editor.sections.targets),
  resources: sectionIndicator(editor.sections.links),
  readiness: editor.readiness?.canAdvance ? "ready" : "blocked",
};
const resolvedPanel =
  activePanel === "publication" && !publicationAvailable
    ? "overview"
    : activePanel;
```

Map all six panels explicitly. When publication is unavailable and currently selected after an audience change, resolve back to `overview`. Use this layout verbatim:

```tsx
<main aria-label={t("workspace_label")} className="mx-auto max-w-screen-2xl space-y-4 p-4 sm:p-6">
  {editor.isReadOnly ? (
    <div role="status">{editorT("read_only")}</div>
  ) : null}
  <GeneralResourceHeader
    content={content}
    locale={locale}
    lifecycleActions={
      <LifecycleActions
        content={content}
        canManage={canManage}
        onChanged={onLifecycleChanged}
        onDeleted={onDeleted}
      />
    }
  />
  <GeneralResourceSectionNav
    variant="mobile"
    activePanel={resolvedPanel}
    showPublication={publicationAvailable}
    indicators={indicators}
    onChange={setActivePanel}
  />
  <div className="grid min-w-0 gap-4 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_320px]">
    <div className="hidden lg:block">
      <GeneralResourceSectionNav
        variant="desktop"
        activePanel={resolvedPanel}
        showPublication={publicationAvailable}
        indicators={indicators}
        onChange={setActivePanel}
      />
    </div>
    <div className="min-w-0">{panels[resolvedPanel]}</div>
    <div className="lg:col-start-2 xl:col-start-auto">
      <GeneralResourceContextRail
        content={content}
        readiness={editor.readiness}
        targets={targets}
        targetError={targetError}
        filePolicyState={filePolicyState}
        onRefreshReadiness={editor.refreshReadiness}
      />
    </div>
  </div>
</main>
```

Pass the same `filePolicyState` instance to Resources and Context Rail. Do not fetch a second policy copy. Use `editor.isReadOnly || !canManage` for authoring controls and `canPublish` independently for publication mutations.

- [ ] **Step 4: Run the editor test and verify GREEN**

```powershell
& {
  npm run test:run -- src/features/academic-content/components/general-resource-detail/__tests__/GeneralResourceEditorView.test.tsx
}
```

Expected: PASS.

- [ ] **Step 5: Run required guards**

Use Clean Code Guard on `GeneralResourceEditorView.tsx` and Test Guard on `GeneralResourceEditorView.test.tsx`. Fix all must-fix findings.

- [ ] **Step 6: Commit Task 5**

```powershell
& {
  git add -- src/features/academic-content/components/general-resource-detail/GeneralResourceEditorView.tsx src/features/academic-content/components/general-resource-detail/__tests__/GeneralResourceEditorView.test.tsx
  git commit -m "feat(academic-content): compose general resource detail workspace"
}
```

### Task 6: Route General Resources and enforce translation parity

**Files:**
- Modify: `src/features/academic-content/pages/AcademicContentEditorPage.tsx`
- Modify: `src/features/academic-content/pages/__tests__/AcademicContentEditorPage.test.tsx`
- Modify: `src/messages/__tests__/academicContentWorkflowTranslations.test.ts`

**Interfaces:**
- Consumes: `GeneralResourceEditorView` from Task 5.
- Produces: dedicated `GENERAL_RESOURCE` routing while leaving every other existing branch unchanged.

- [ ] **Step 1: Add failing route and translation-parity tests**

```tsx
vi.mock("../../components/general-resource-detail/GeneralResourceEditorView", () => ({
  default: () => <main aria-label="General resource workspace" />,
}));

it("routes general resources to their dedicated workspace", () => {
  render(<AcademicContentEditorView editor={editorState()} canManage academicYearName="2026/2027" termName="Term 1" />);
  expect(screen.getByRole("main", { name: "General resource workspace" })).toBeVisible();
  expect(screen.queryByText("Basic information")).toBeNull();
});
```

Add `general_resource_detail` to the translation parity `sections` tuple and required publication audit keys to `requiredAcademicContentKeys`.

The current page test uses General Resources to exercise the generic editor. Replace those obsolete generic-editor assertions with routing and prop-forwarding assertions, because General Resources no longer use the generic presentation. The metadata save, read-only, dirty-indicator, publication-availability, publication-refresh, and status-gating cases must already exist in `GeneralResourceEditorView.test.tsx` from Task 5; do not delete coverage without that replacement.

- [ ] **Step 2: Run focused route/parity tests and verify RED**

```powershell
& {
  npm run test:run -- src/features/academic-content/pages/__tests__/AcademicContentEditorPage.test.tsx src/messages/__tests__/academicContentWorkflowTranslations.test.ts
}
```

Expected: FAIL because the dedicated branch and parity namespace are not wired.

- [ ] **Step 3: Add the dedicated branch before the generic fallback**

```tsx
if (content.type === "GENERAL_RESOURCE") {
  return (
    <GeneralResourceEditorView
      editor={{ ...editor, content }}
      canManage={canManage}
      canPublish={canPublish}
      academicYearName={academicYearName}
      termName={termName}
      onLifecycleChanged={onLifecycleChanged}
      onDeleted={onDeleted}
    />
  );
}
```

Keep `GenericAcademicContentEditorView` as the final fallback. Do not remove `GeneralResourceNotice`; it remains valid for generic/revision contexts until a separate cleanup is approved.

- [ ] **Step 4: Run focused route/parity tests and verify GREEN**

```powershell
& {
  npm run test:run -- src/features/academic-content/pages/__tests__/AcademicContentEditorPage.test.tsx src/messages/__tests__/academicContentWorkflowTranslations.test.ts
}
```

Expected: PASS with all existing specialized-routing cases unchanged.

- [ ] **Step 5: Run required guards**

Use Clean Code Guard on `AcademicContentEditorPage.tsx` and Test Guard on both modified tests. Fix all must-fix findings.

- [ ] **Step 6: Commit Task 6**

```powershell
& {
  git add -- src/features/academic-content/pages/AcademicContentEditorPage.tsx src/features/academic-content/pages/__tests__/AcademicContentEditorPage.test.tsx src/messages/__tests__/academicContentWorkflowTranslations.test.ts
  git commit -m "feat(academic-content): route general resource details"
}
```

### Task 7: Focused verification and final quality gates

**Files:**
- Review only: all files changed in Tasks 1–6.

**Interfaces:**
- Consumes: completed General Resource detail workspace.
- Produces: verified implementation ready for owner review; no backend or unrelated changes.

- [ ] **Step 1: Run all focused General Resource and shared-contract tests**

```powershell
& {
  npm run test:run -- src/features/academic-content/hooks/__tests__/useAcademicContentFilePolicy.test.tsx src/features/academic-content/components/editor/__tests__/FilesSection.test.tsx src/features/academic-content/components/publication/__tests__/PublicationDetailModal.test.tsx src/features/academic-content/components/general-resource-detail/__tests__/GeneralResourceChrome.test.tsx src/features/academic-content/components/general-resource-detail/__tests__/GeneralResourcePanels.test.tsx src/features/academic-content/components/general-resource-detail/__tests__/GeneralResourceEditorView.test.tsx src/features/academic-content/pages/__tests__/AcademicContentEditorPage.test.tsx src/messages/__tests__/academicContentWorkflowTranslations.test.ts
}
```

Expected: PASS. This is a focused set, not the full suite.

- [ ] **Step 2: Run scoped ESLint**

```powershell
& {
  npx eslint src/features/academic-content/hooks/useAcademicContentFilePolicy.ts src/features/academic-content/hooks/__tests__/useAcademicContentFilePolicy.test.tsx src/features/academic-content/components/editor/FilesSection.tsx src/features/academic-content/components/editor/AcademicContentResources.tsx src/features/academic-content/components/editor/__tests__/FilesSection.test.tsx src/features/academic-content/components/publication/PublicationDetailModal.tsx src/features/academic-content/components/publication/__tests__/PublicationDetailModal.test.tsx src/features/academic-content/components/general-resource-detail src/features/academic-content/pages/AcademicContentEditorPage.tsx src/features/academic-content/pages/__tests__/AcademicContentEditorPage.test.tsx src/messages/__tests__/academicContentWorkflowTranslations.test.ts
}
```

Expected: exit code 0 with no new warnings caused by this feature.

- [ ] **Step 3: Run typecheck**

```powershell
& {
  npm run typecheck
}
```

Expected: PASS.

- [ ] **Step 4: Run production build**

```powershell
& {
  npm run build
}
```

Expected: PASS.

- [ ] **Step 5: Perform final guards and contract audit**

Run Clean Code Guard across the complete production diff and Test Guard across the complete test diff. Compare the implemented fields/actions to the exact inventory in the approved spec. Confirm that no General Resource type-detail call, approval workflow, asset reorder, or unverified management download action was introduced.

- [ ] **Step 6: Inspect repository scope**

```powershell
& {
  git status --short
  git diff --check
  git diff --name-only origin/main...HEAD
}
```

Expected: only the planned academic-content files plus pre-existing unrelated worktree changes are present; no secrets, backend files, deployment files, or generated cache files are included in feature commits.

- [ ] **Step 7: Ask before any full-suite run**

Do not run `npm run test:run` without explicit file arguments and do not run `npm run test:all` unless the user explicitly approves the full test suite.

- [ ] **Step 8: Commit verification-only fixes if guards required changes**

```powershell
& {
  git add -- src/features/academic-content/hooks/useAcademicContentFilePolicy.ts src/features/academic-content/hooks/__tests__/useAcademicContentFilePolicy.test.tsx src/features/academic-content/components/editor/FilesSection.tsx src/features/academic-content/components/editor/AcademicContentResources.tsx src/features/academic-content/components/editor/__tests__/FilesSection.test.tsx src/features/academic-content/components/publication/PublicationDetailModal.tsx src/features/academic-content/components/publication/__tests__/PublicationDetailModal.test.tsx src/features/academic-content/components/general-resource-detail src/features/academic-content/pages/AcademicContentEditorPage.tsx src/features/academic-content/pages/__tests__/AcademicContentEditorPage.test.tsx src/messages/en.json src/messages/ar.json src/messages/__tests__/academicContentWorkflowTranslations.test.ts
  git commit -m "fix(academic-content): address general resource quality review"
}
```

Skip this commit when the verification and guards require no file changes. Never commit unrelated dirty-worktree files.
