# Subject Resource Detail Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dedicated, full-contract Subject Resource detail workspace with authenticated multi-format previews, responsive management panels, and existing academic-content workflows.

**Architecture:** Route `SUBJECT_RESOURCE` aggregates from the existing editor page into a dedicated view composed from focused resource-detail components. Reuse the editor hook and existing metadata, target, file, publication, readiness, revision, lifecycle, link, and tag operations; add one reusable embedded authenticated-file preview component under the shared UI folder.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, next-intl, Lucide, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-06-subject-resource-detail-design.md`

## Global Constraints

- Do not change the backend or invent fields absent from `AcademicContentDetail`.
- Use components from `src/components/ui` for UI and UX changes.
- Preserve the current permission and academic-content workflow policies.
- Preview PDF, image, video, audio, TXT, and bounded CSV; use download fallback for Office and archive files.
- Never fetch per-asset metadata; use the assets already present in the aggregate.
- Apply clean-code-guard to every production-code change and test-guard to every test change.
- Ask the user before running the full test suite.
- Preserve all unrelated changes in the dirty worktree.

---

### Task 1: Subject Resource display and preview model

**Files:**

- Create: `src/features/academic-content/model/subjectResourceDetail.ts`
- Test: `src/features/academic-content/model/__tests__/subjectResourceDetail.test.ts`

**Interfaces:**

- Consumes: `AcademicContentAsset`, `AcademicContentDetail`, `AcademicContentSubjectResourceDetail`.
- Produces: `SubjectResourcePanel`, `SubjectResourceAssetKind`, `orderedSubjectResourceAssets(assets)`, `firstPreviewableSubjectResourceAsset(assets)`, `subjectResourceAssetKind(asset)`, and `emptySubjectResourceDetail()`.

- [ ] **Step 1: Write failing model tests**

```ts
it("orders assets and selects the first previewable asset", () => {
  const assets = [
    officeAsset({ sortOrder: 0 }),
    pdfAsset({ sortOrder: 2 }),
    imageAsset({ sortOrder: 1 }),
  ];
  expect(
    orderedSubjectResourceAssets(assets).map((asset) => asset.assetId),
  ).toEqual(["office", "image", "pdf"]);
  expect(firstPreviewableSubjectResourceAsset(assets)?.assetId).toBe("image");
});

it.each([
  ["application/pdf", "pdf"],
  ["image/png", "image"],
  ["video/mp4", "video"],
  ["audio/mpeg", "audio"],
  ["text/plain", "text"],
  ["text/csv", "csv"],
  [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "download",
  ],
])("classifies %s as %s", (mimeType, expected) => {
  expect(subjectResourceAssetKind(asset({ mimeType }))).toBe(expected);
});
```

- [ ] **Step 2: Run the model test and verify failure**

Run: `npx vitest run src/features/academic-content/model/__tests__/subjectResourceDetail.test.ts`

Expected: FAIL because `subjectResourceDetail.ts` does not exist.

- [ ] **Step 3: Implement the model**

```ts
export type SubjectResourcePanel =
  | "preview"
  | "details"
  | "targets"
  | "resources"
  | "readiness"
  | "publication"
  | "revisions";

export type SubjectResourceAssetKind =
  "pdf" | "image" | "video" | "audio" | "text" | "csv" | "download";

export function subjectResourceAssetKind(
  asset: AcademicContentAsset,
): SubjectResourceAssetKind {
  if (asset.mimeType === "application/pdf") return "pdf";
  if (asset.mimeType.startsWith("image/")) return "image";
  if (asset.mimeType.startsWith("video/")) return "video";
  if (asset.mimeType.startsWith("audio/")) return "audio";
  if (asset.mimeType === "text/plain") return "text";
  if (asset.mimeType === "text/csv") return "csv";
  return "download";
}
```

Sort a copy by `sortOrder`, then `createdAt`, without mutating the aggregate. Select the first asset whose kind is not `download`; fall back to the first ordered asset when none is previewable. Return a default detail containing category `OTHER` and null curriculum references.

- [ ] **Step 4: Run the model test**

Run: `npx vitest run src/features/academic-content/model/__tests__/subjectResourceDetail.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the model task**

```powershell
& {
  git add src/features/academic-content/model/subjectResourceDetail.ts src/features/academic-content/model/__tests__/subjectResourceDetail.test.ts
  git commit -m "feat(academic-content): model subject resource detail display"
}
```

### Task 2: Reusable embedded authenticated-file preview

**Files:**

- Create: `src/components/ui/embedded-file-preview/EmbeddedFilePreview.tsx`
- Create: `src/components/ui/embedded-file-preview/parseCsvPreview.ts`
- Create: `src/components/ui/embedded-file-preview/index.ts`
- Modify: `src/components/ui/index.ts`
- Test: `src/components/ui/embedded-file-preview/EmbeddedFilePreview.test.tsx`
- Test: `src/components/ui/embedded-file-preview/parseCsvPreview.test.ts`

**Interfaces:**

- Consumes: `loadAuthenticatedFileUrl(fileId)` and `PreviewAttachment`-compatible `{ id, name, size, type }` data.
- Produces: `EmbeddedFilePreview({ file, kind, labels })` and `parseCsvPreview(text, limits)`.

- [ ] **Step 1: Write failing CSV parser tests**

```ts
it("parses quoted commas and caps rows and columns", () => {
  expect(
    parseCsvPreview('name,score\n"Ali, Omar",9\nSara,10', {
      maxRows: 2,
      maxColumns: 2,
    }),
  ).toEqual({
    rows: [
      ["name", "score"],
      ["Ali, Omar", "9"],
    ],
    truncated: true,
  });
});
```

The parser must handle escaped double quotes, CRLF/LF, quoted commas, empty cells, row limits, and column limits. It must not evaluate formulas or emit HTML.

- [ ] **Step 2: Write failing preview routing tests**

Use the authenticated-file cache as the network boundary and return controlled blobs. Assert user-visible behavior:

```tsx
it("renders native audio controls for an authenticated audio asset", async () => {
  fileCache.loadAuthenticatedFileUrl.mockResolvedValue({
    blob: new Blob(["audio"], { type: "audio/mpeg" }),
    mimeType: "audio/mpeg",
    url: "blob:audio",
  });
  render(<EmbeddedFilePreview file={audioFile} kind="audio" labels={labels} />);
  expect(await screen.findByLabelText("lesson.mp3")).toHaveAttribute(
    "controls",
  );
});

it("shows a download fallback when preview is unsupported", () => {
  render(
    <EmbeddedFilePreview file={docxFile} kind="download" labels={labels} />,
  );
  expect(screen.getByText("Preview unavailable")).toBeVisible();
});
```

Also cover PDF iframe, image alt text, video controls, TXT output, bounded CSV table, loading, 403 access denial, and general failure.

- [ ] **Step 3: Run the shared UI tests and verify failure**

Run: `npx vitest run src/components/ui/embedded-file-preview/parseCsvPreview.test.ts src/components/ui/embedded-file-preview/EmbeddedFilePreview.test.tsx`

Expected: FAIL because the component and parser do not exist.

- [ ] **Step 4: Implement the bounded parser and preview component**

Load only the selected file with `loadAuthenticatedFileUrl`. Render by `kind`:

```tsx
if (kind === "pdf") return <iframe src={loaded.url} title={file.name} />;
if (kind === "image") return <img src={loaded.url} alt={file.name} />;
if (kind === "video")
  return <video controls aria-label={file.name} src={loaded.url} />;
if (kind === "audio")
  return <audio controls aria-label={file.name} src={loaded.url} />;
```

For TXT and CSV, call `loaded.blob.text()` only after confirming the declared size is within a documented preview cap. Render text with `whitespace-pre-wrap`; render CSV cells as text in a semantic table. For `download`, render file metadata and invoke the supplied download action without fetching a preview blob. Keep loading, denied, failed, and unsupported states local to the preview.

- [ ] **Step 5: Export through the shared UI barrel and run tests**

Run: `npx vitest run src/components/ui/embedded-file-preview/parseCsvPreview.test.ts src/components/ui/embedded-file-preview/EmbeddedFilePreview.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit the shared preview**

```powershell
& {
  git add src/components/ui/embedded-file-preview src/components/ui/index.ts
  git commit -m "feat(ui): add embedded authenticated file preview"
}
```

### Task 3: Resource preview workspace and authenticated download

**Files:**

- Create: `src/features/academic-content/components/subject-resource-detail/SubjectResourcePreviewWorkspace.tsx`
- Create: `src/features/academic-content/services/downloadAcademicContentAsset.ts`
- Test: `src/features/academic-content/components/subject-resource-detail/__tests__/SubjectResourcePreviewWorkspace.test.tsx`
- Test: `src/features/academic-content/services/__tests__/downloadAcademicContentAsset.test.ts`

**Interfaces:**

- Consumes: Task 1 asset selection/classification and Task 2 `EmbeddedFilePreview`.
- Produces: `SubjectResourcePreviewWorkspace({ assets, selectedAssetId, onSelectAsset, onDownload })` and `downloadAcademicContentAsset(asset)`.

- [ ] **Step 1: Write failing workspace tests**

```tsx
it("selects another asset without requesting aggregate data", async () => {
  const onSelectAsset = vi.fn();
  render(
    <SubjectResourcePreviewWorkspace
      assets={[pdfAsset, audioAsset]}
      selectedAssetId="pdf"
      onSelectAsset={onSelectAsset}
      onDownload={vi.fn()}
    />,
  );
  await user.click(screen.getByRole("button", { name: /audio lesson/i }));
  expect(onSelectAsset).toHaveBeenCalledWith("audio");
});
```

Cover empty assets, active selection, file name/type/size, horizontal selector semantics, unsupported fallback, and selected-asset Download.

- [ ] **Step 2: Write the failing download service test**

Mock only the authenticated file network boundary. Assert that the downloaded blob is assigned to a temporary anchor with `download = asset.originalName`, clicked once, and its object URL is revoked.

- [ ] **Step 3: Run focused tests and verify failure**

Run: `npx vitest run src/features/academic-content/components/subject-resource-detail/__tests__/SubjectResourcePreviewWorkspace.test.tsx src/features/academic-content/services/__tests__/downloadAcademicContentAsset.test.ts`

Expected: FAIL because the workspace and service do not exist.

- [ ] **Step 4: Implement the workspace and download service**

Use `formatByteCount` for sizes and Lucide file/media icons. Keep preview selection controlled by the parent. The service must call `downloadFileBlob(asset.fileId)`, create an object URL, trigger a named download, remove the anchor, and revoke the URL in `finally`.

- [ ] **Step 5: Run the focused tests**

Run the Task 3 Vitest command again.

Expected: PASS.

- [ ] **Step 6: Commit the workspace task**

```powershell
& {
  git add src/features/academic-content/components/subject-resource-detail/SubjectResourcePreviewWorkspace.tsx src/features/academic-content/components/subject-resource-detail/__tests__/SubjectResourcePreviewWorkspace.test.tsx src/features/academic-content/services/downloadAcademicContentAsset.ts src/features/academic-content/services/__tests__/downloadAcademicContentAsset.test.ts
  git commit -m "feat(academic-content): add subject resource preview workspace"
}
```

### Task 4: Full-contract header, details, resources, and context rail

**Files:**

- Create: `src/features/academic-content/components/subject-resource-detail/SubjectResourceHeader.tsx`
- Create: `src/features/academic-content/components/subject-resource-detail/SubjectResourceMetadataStrip.tsx`
- Create: `src/features/academic-content/components/subject-resource-detail/SubjectResourceDetailsPanel.tsx`
- Create: `src/features/academic-content/components/subject-resource-detail/SubjectResourceResourcesPanel.tsx`
- Create: `src/features/academic-content/components/subject-resource-detail/SubjectResourceContextRail.tsx`
- Test: `src/features/academic-content/components/subject-resource-detail/__tests__/SubjectResourcePanels.test.tsx`

**Interfaces:**

- Consumes: `AcademicContentDetail & { type: "SUBJECT_RESOURCE" }`, resolved target display, detail options, editor section state, and existing editor callbacks.
- Produces: focused presentational/editing panels used by `SubjectResourceEditorView`.

- [ ] **Step 1: Write failing panel tests**

Assert visible contract behavior rather than component internals:

```tsx
expect(
  screen.getByRole("heading", { name: "Fractions worksheet" }),
).toBeVisible();
expect(screen.getByText("Worksheet")).toBeVisible();
expect(screen.getByText("Students")).toBeVisible();
expect(screen.getByText("British Curriculum")).toBeVisible();
expect(screen.getByText("Primary · Grade 4 · Mathematics")).toBeVisible();
expect(screen.getByRole("link", { name: "Practice guide" })).toHaveAttribute(
  "href",
  safeUrl,
);
```

Cover missing curriculum references, multiple targets, all tags, all links, publication dates/status, timestamps, assets, readiness, and absence of “Created by”. Assert Share requests the targets panel and Edit requests the details panel.

- [ ] **Step 2: Run the panel test and verify failure**

Run: `npx vitest run src/features/academic-content/components/subject-resource-detail/__tests__/SubjectResourcePanels.test.tsx`

Expected: FAIL because the components do not exist.

- [ ] **Step 3: Implement the header and metadata strip**

The header uses the dedicated Subject Resources back route with the selected year/term query. Render rich description with `RichTextContent`. Map Edit to `details`, Share to `targets`, Download to the selected asset, and More Actions to existing `LifecycleActions`. Keep action visibility permission-aware.

- [ ] **Step 4: Implement details and resources panels**

Compose existing `BasicInformationSection`, `SubjectResourceForm`, `TagsSection`, `LinksSection`, and `FilesSection` instead of duplicating their forms. Use embedded variants where available; add narrow wrapper styles only inside the Subject Resource feature.

- [ ] **Step 5: Implement the context rail**

Display resource category, resolved curriculum/unit/lesson, audience, all resolved targets, tags, links, publication status/timing, created/updated timestamps, readiness, and revision access. Do not display internal IDs or invented creator data.

- [ ] **Step 6: Run the panel tests**

Run the Task 4 Vitest command again.

Expected: PASS.

- [ ] **Step 7: Commit the contract panels**

```powershell
& {
  git add src/features/academic-content/components/subject-resource-detail
  git commit -m "feat(academic-content): add subject resource detail panels"
}
```

### Task 5: Dedicated editor orchestration and routing

**Files:**

- Create: `src/features/academic-content/components/subject-resource-detail/SubjectResourceEditorView.tsx`
- Create: `src/features/academic-content/components/subject-resource-detail/SubjectResourceSectionNav.tsx`
- Modify: `src/features/academic-content/pages/AcademicContentEditorPage.tsx`
- Modify: `src/features/academic-content/components/overview/overviewRoutes.ts`
- Test: `src/features/academic-content/components/subject-resource-detail/__tests__/SubjectResourceEditorView.test.tsx`
- Test: `src/features/academic-content/pages/__tests__/AcademicContentEditorPage.test.tsx`

**Interfaces:**

- Consumes: Tasks 1–4, `useAcademicContentEditor`, `useAcademicContentTargetDisplay`, `loadAcademicContentDetailOptions`, and existing publication/readiness/revision/target components.
- Produces: complete dedicated Subject Resource workspace selected by `AcademicContentEditorView`.

- [ ] **Step 1: Write failing routing and orchestration tests**

```tsx
it("routes a subject resource aggregate to its dedicated workspace", () => {
  render(
    <AcademicContentEditorView
      editor={subjectResourceEditor}
      canManage
      canPublish
      academicYearName="2026/2027"
      termName="Term 1"
    />,
  );
  expect(screen.getByLabelText("Subject resource workspace")).toBeVisible();
  expect(
    screen.queryByLabelText("Academic content sections"),
  ).not.toBeInTheDocument();
});
```

Also verify first-compatible selection, selection persistence after aggregate refresh, Share panel navigation, publication availability, read-only state, and permission-controlled actions.

- [ ] **Step 2: Run focused editor tests and verify failure**

Run: `npx vitest run src/features/academic-content/components/subject-resource-detail/__tests__/SubjectResourceEditorView.test.tsx src/features/academic-content/pages/__tests__/AcademicContentEditorPage.test.tsx`

Expected: FAIL because the dedicated view is not wired.

- [ ] **Step 3: Implement section navigation**

Expose Preview, Details, Sharing, Resources, Readiness, Publication when available, and Revisions. Provide mobile select/tabs and desktop navigation using the same panel identifiers and dirty/readiness indicators.

- [ ] **Step 4: Implement editor orchestration**

Load detail options with the same cancellation/error pattern used by existing specialized detail pages. Resolve targets with `useAcademicContentTargetDisplay`. Keep `selectedAssetId` in local state and repair it only when the selected asset disappears. Compose existing `AcademicTargetsSection`, `AcademicContentPublicationPanel`, `ReadinessPanel`, and `RevisionHistoryPanel`.

- [ ] **Step 5: Route Subject Resources into the dedicated editor view**

Add this branch before the generic editor fallback:

```tsx
if (content.type === "SUBJECT_RESOURCE") {
  return (
    <SubjectResourceEditorView
      editor={{ ...editor, content }}
      canManage={canManage}
      canPublish={canPublish}
      onLifecycleChanged={onLifecycleChanged}
      onDeleted={onDeleted}
    />
  );
}
```

Ensure deletion returns to `/academic-content-hub/subject-resources` with year and term preserved for Subject Resources, rather than the overview root.

- [ ] **Step 6: Run the focused editor tests**

Run the Task 5 Vitest command again.

Expected: PASS.

- [ ] **Step 7: Commit the integrated workspace**

```powershell
& {
  git add src/features/academic-content/components/subject-resource-detail src/features/academic-content/pages/AcademicContentEditorPage.tsx src/features/academic-content/pages/__tests__/AcademicContentEditorPage.test.tsx src/features/academic-content/components/overview/overviewRoutes.ts
  git commit -m "feat(academic-content): integrate subject resource detail workspace"
}
```

### Task 6: Localization, quality review, and focused verification

**Files:**

- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`
- Modify: `src/messages/__tests__/academicContentWorkflowTranslations.test.ts` only if the existing parity test requires explicit namespace registration.
- Review: all production and test files changed in Tasks 1–5.

**Interfaces:**

- Consumes: every translation key referenced by the dedicated workspace and shared preview.
- Produces: complete English/Arabic copy and a verified implementation.

- [ ] **Step 1: Add English and Arabic namespaces**

Add matching `academic_content.subject_resource_detail` keys for workspace labels, navigation, header actions, metadata, resource information, audience/targets, publication, assets, preview states, TXT/CSV truncation, links, tags, curriculum, readiness, revisions, errors, and retry/download actions. Add shared embedded-preview copy under the established common/UI namespace when the component is used outside academic content.

- [ ] **Step 2: Run translation parity tests**

Run: `npx vitest run src/messages/__tests__/academicContentWorkflowTranslations.test.ts`

Expected: PASS with identical English and Arabic key shapes.

- [ ] **Step 3: Apply test-guard review**

Review changed tests for observable behavior, boundary-only mocks, duplication, meaningful edge cases, and brittle implementation assertions. Remove snapshots and tests that merely verify React prop passing. Re-run every focused test file changed by this plan.

- [ ] **Step 4: Apply clean-code-guard review**

Review production changes for duplicated file-type logic, long orchestration functions, generic naming, catch-all error suppression, speculative options, unused exports, inaccessible controls, and divergence from existing editor patterns. Refactor before verification where a violation is found.

- [ ] **Step 5: Run focused tests**

Run:

```powershell
& {
  npx vitest run src/components/ui/embedded-file-preview src/features/academic-content/model/__tests__/subjectResourceDetail.test.ts src/features/academic-content/components/subject-resource-detail src/features/academic-content/services/__tests__/downloadAcademicContentAsset.test.ts src/features/academic-content/pages/__tests__/AcademicContentEditorPage.test.tsx src/messages/__tests__/academicContentWorkflowTranslations.test.ts
}
```

Expected: PASS. Do not run `npm run test:run` without explicit user approval.

- [ ] **Step 6: Run type checking and scoped lint**

Run:

```powershell
& {
  npm run typecheck
  npx eslint "src/components/ui/embedded-file-preview/**/*.{ts,tsx}" "src/features/academic-content/model/subjectResourceDetail.ts" "src/features/academic-content/model/__tests__/subjectResourceDetail.test.ts" "src/features/academic-content/components/subject-resource-detail/**/*.{ts,tsx}" "src/features/academic-content/services/downloadAcademicContentAsset.ts" "src/features/academic-content/services/__tests__/downloadAcademicContentAsset.test.ts" "src/features/academic-content/pages/AcademicContentEditorPage.tsx" "src/features/academic-content/pages/__tests__/AcademicContentEditorPage.test.tsx"
  git diff --check
}
```

Expected: zero TypeScript errors, zero new ESLint errors or warnings, and no whitespace errors.

- [ ] **Step 7: Commit localization and quality corrections**

```powershell
& {
  git add src/messages/en.json src/messages/ar.json src/messages/__tests__/academicContentWorkflowTranslations.test.ts src/components/ui/embedded-file-preview src/features/academic-content/model/subjectResourceDetail.ts src/features/academic-content/model/__tests__/subjectResourceDetail.test.ts src/features/academic-content/components/subject-resource-detail src/features/academic-content/services/downloadAcademicContentAsset.ts src/features/academic-content/services/__tests__/downloadAcademicContentAsset.test.ts src/features/academic-content/pages/AcademicContentEditorPage.tsx src/features/academic-content/pages/__tests__/AcademicContentEditorPage.test.tsx
  git commit -m "feat(academic-content): localize and verify subject resource workspace"
}
```
