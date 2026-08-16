# Reward Catalog Academic Context and Images Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add context-backed academic filters and protected reward-image upload, preview, removal, and table display to Reward Catalog.

**Architecture:** Wrap reinforcement routes in the existing academic context provider and make Reward Catalog consume that single source of truth. Keep catalog form scope and image behavior in focused child components, and centralize authenticated file upload/download primitives in a shared service plus image component. Preserve academic URL parameters when ordinary reinforcement filters change.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, next-intl, Axios API client, Tailwind CSS, Vitest, Testing Library.

**Worktree safety:** The repository already contains unrelated local changes. Before every commit, inspect `git diff` and use `git add -p` for any previously modified shared file so unrelated hunks are never staged.

---

### Task 1: Preserve academic context in reinforcement URL filters

**Files:**
- Create: `src/features/reinforcement/hooks/__tests__/useReinforcementUrlFilters.test.tsx`
- Modify: `src/features/reinforcement/hooks/useReinforcementUrlFilters.ts`

- [ ] **Step 1: Write the failing URL-preservation tests**

Add tests which initialize the browser at `?academicYearId=year-1&termId=term-1`, call `setValue("status", "published")`, and assert all three parameters remain. Add a second test which calls `clearAll()` and asserts only the owned `status`, `type`, `search`, `page`, and `pageSize` parameters are removed.

```tsx
const searchParams = () => new URLSearchParams(window.location.search);

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParams(),
}));

it("preserves academic context when a catalog filter changes", async () => {
  window.history.replaceState({}, "", "/catalog?academicYearId=year-1&termId=term-1");
  const { result } = renderHook(() =>
    useReinforcementUrlFilters({ paramKeys: ["status", "type", "search"] }),
  );

  act(() => result.current.setValue("status", "published"));

  await waitFor(() => {
    expect(searchParams().get("academicYearId")).toBe("year-1");
    expect(searchParams().get("termId")).toBe("term-1");
    expect(searchParams().get("status")).toBe("published");
  });
});
```

- [ ] **Step 2: Run the test and verify the current hook drops the context**

Run: `npm run test:run -- src/features/reinforcement/hooks/__tests__/useReinforcementUrlFilters.test.tsx`

Expected: FAIL because `buildUrlFromValues` starts from an empty `URLSearchParams` and `clearAll` navigates to the bare pathname.

- [ ] **Step 3: Make the hook update only parameters it owns**

Change URL construction to start from `window.location.search`, delete `paramKeys`, `page`, and `pageSize`, then write the current owned values. Make `clearAll` perform the same targeted deletion instead of removing the complete query string.

```ts
function buildUrlFromValues(
  values: Record<string, string>,
  ownedKeys: string[],
  page: number,
  pageSize: number,
): string {
  const params = new URLSearchParams(window.location.search);
  [...ownedKeys, "page", "pageSize"].forEach((key) => params.delete(key));
  Object.entries(values).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  if (page > 1) params.set("page", String(page));
  if (pageSize !== 10) params.set("pageSize", String(pageSize));
  const query = params.toString();
  return query ? `${window.location.pathname}?${query}` : window.location.pathname;
}
```

Pass `paramKeys` through `updateUrl`, and implement `clearAll` with the same owned-key deletion before `window.history.replaceState`.

- [ ] **Step 4: Run the focused tests**

Run: `npm run test:run -- src/features/reinforcement/hooks/__tests__/useReinforcementUrlFilters.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit the URL ownership fix**

```bash
git add src/features/reinforcement/hooks/useReinforcementUrlFilters.ts src/features/reinforcement/hooks/__tests__/useReinforcementUrlFilters.test.tsx
git commit -m "fix: preserve reinforcement context query parameters"
```

### Task 2: Add the reinforcement academic layout

**Files:**
- Create: `src/app/[lang]/(dashboard)/reinforcement/layout.tsx`
- Create: `src/features/reinforcement/__tests__/ReinforcementLayout.test.tsx`
- Modify: `src/features/reinforcement/hooks/useReinforcementAcademicContext.ts`

- [ ] **Step 1: Write failing tests for the layout contract**

Mock `AcademicsContextLayout`, render the reinforcement layout, and assert it receives `yearParamKey: "academicYearId"` and `termParamKey: "termId"`. Mock `useAcademicYearTermLayoutContext` and assert `useReinforcementAcademicContext` returns its selected year and term without issuing separate academic API requests.

```tsx
expect(screen.getByTestId("reinforcement-context")).toHaveAttribute(
  "data-year-key",
  "academicYearId",
);
expect(screen.getByTestId("reinforcement-context")).toHaveAttribute(
  "data-term-key",
  "termId",
);
```

- [ ] **Step 2: Run the tests and verify the layout is absent**

Run: `npm run test:run -- src/features/reinforcement/__tests__/ReinforcementLayout.test.tsx`

Expected: FAIL because the reinforcement route layout does not exist and the old hook fetches its own context using `year` and `term`.

- [ ] **Step 3: Create the route layout and simplify the compatibility hook**

```tsx
import AcademicsContextLayout from "@/features/academics/components/layout/AcademicsContextLayout";

export default function ReinforcementLayout({ children }: { children: React.ReactNode }) {
  return (
    <AcademicsContextLayout
      contextOptions={{
        yearParamKey: "academicYearId",
        termParamKey: "termId",
      }}
    >
      {children}
    </AcademicsContextLayout>
  );
}
```

Replace the independent fetch logic in `useReinforcementAcademicContext` with `useAcademicYearTermLayoutContext()` and return `selectedAcademicYear` and `selectedTerm` from the provider.

- [ ] **Step 4: Run the focused tests**

Run: `npm run test:run -- src/features/reinforcement/__tests__/ReinforcementLayout.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit the reinforcement context layout**

```bash
git add "src/app/[lang]/(dashboard)/reinforcement/layout.tsx" src/features/reinforcement/hooks/useReinforcementAcademicContext.ts src/features/reinforcement/__tests__/ReinforcementLayout.test.tsx
git commit -m "feat: add academic context to reinforcement routes"
```

### Task 3: Add shared authenticated file primitives

**Files:**
- Create: `src/services/filesService.ts`
- Create: `src/services/__tests__/filesService.test.ts`

- [ ] **Step 1: Write failing upload and download service tests**

Assert upload sends one multipart `file` field to `/files`, and download calls `/api/files/{encodedId}/download` with `baseURL: ""` and `responseType: "blob"`.

```ts
expect(apiPost).toHaveBeenCalledWith("/files", expect.any(FormData), {
  headers: { "Content-Type": "multipart/form-data" },
});
expect(apiClient.get).toHaveBeenCalledWith("/api/files/file%2F1/download", {
  baseURL: "",
  responseType: "blob",
});
```

- [ ] **Step 2: Run the tests and verify the shared service is missing**

Run: `npm run test:run -- src/services/__tests__/filesService.test.ts`

Expected: FAIL because `src/services/filesService.ts` does not exist.

- [ ] **Step 3: Implement the typed service**

```ts
import { apiClient, apiPost } from "@/lib/api";

export interface UploadedFileRecord {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: string;
  visibility: string;
  createdAt: string;
}

export async function uploadFile(file: File): Promise<UploadedFileRecord> {
  const body = new FormData();
  body.append("file", file);
  return apiPost<UploadedFileRecord>("/files", body, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export async function downloadFileBlob(fileId: string): Promise<Blob> {
  const response = await apiClient.get(
    `/api/files/${encodeURIComponent(fileId)}/download`,
    { baseURL: "", responseType: "blob" },
  );
  return response.data instanceof Blob
    ? response.data
    : new Blob([response.data as BlobPart], {
        type: response.headers["content-type"] as string | undefined,
      });
}
```

- [ ] **Step 4: Run the service tests**

Run: `npm run test:run -- src/services/__tests__/filesService.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the shared file service**

```bash
git add src/services/filesService.ts src/services/__tests__/filesService.test.ts
git commit -m "feat: add authenticated file service"
```

### Task 4: Add a reusable authenticated file image

**Files:**
- Create: `src/components/ui/authenticated-file-image/AuthenticatedFileImage.tsx`
- Create: `src/components/ui/authenticated-file-image/index.ts`
- Create: `src/components/ui/authenticated-file-image/__tests__/AuthenticatedFileImage.test.tsx`

- [ ] **Step 1: Write failing component tests**

Cover successful blob display, missing permission without a request, failed download with retry, stale response suppression, and `URL.revokeObjectURL` on file replacement and unmount.

```tsx
render(
  <AuthenticatedFileImage
    fileId="file-1"
    alt="Reward"
    canDownload
    unavailableLabel="Unavailable"
    retryLabel="Retry"
  />,
);
await waitFor(() => expect(screen.getByRole("img")).toHaveAttribute("src", "blob:file-1"));
unmount();
expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:file-1");
```

- [ ] **Step 2: Run the tests and verify the component is missing**

Run: `npm run test:run -- src/components/ui/authenticated-file-image/__tests__/AuthenticatedFileImage.test.tsx`

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement explicit loading, ready, and error states**

Use `downloadFileBlob(fileId)`, an effect-local `active` flag, and a retry counter. Store the created object URL, revoke the previous URL in cleanup, render a neutral placeholder when `fileId` or download permission is absent, and expose a retry button only after an actual download failure. Keep `alt`, `className`, `unavailableLabel`, and `retryLabel` as required presentation inputs so the component remains feature-neutral.

```tsx
useEffect(() => {
  if (!fileId || !canDownload) {
    setState({ status: "idle", url: null });
    return;
  }
  let active = true;
  let objectUrl: string | null = null;
  setState({ status: "loading", url: null });
  void downloadFileBlob(fileId)
    .then((blob) => {
      if (!active) return;
      objectUrl = URL.createObjectURL(blob);
      setState({ status: "ready", url: objectUrl });
    })
    .catch(() => {
      if (active) setState({ status: "error", url: null });
    });
  return () => {
    active = false;
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  };
}, [canDownload, fileId, retryCount]);
```

- [ ] **Step 4: Run the component tests**

Run: `npm run test:run -- src/components/ui/authenticated-file-image/__tests__/AuthenticatedFileImage.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit the image component**

```bash
git add src/components/ui/authenticated-file-image
git commit -m "feat: add authenticated file image component"
```

### Task 5: Align Reward Catalog types and build focused form fields

**Files:**
- Modify: `src/features/reinforcement/types.ts`
- Modify: `src/components/ui/file-upload/FileUploadButton.tsx`
- Create: `src/components/ui/file-upload/__tests__/FileUploadButton.test.tsx`
- Create: `src/features/reinforcement/components/RewardCatalogScopeFields.tsx`
- Create: `src/features/reinforcement/components/RewardCatalogImageField.tsx`
- Create: `src/features/reinforcement/components/__tests__/RewardCatalogScopeFields.test.tsx`
- Create: `src/features/reinforcement/components/__tests__/RewardCatalogImageField.test.tsx`

- [ ] **Step 1: Write failing scope and image-field tests**

Scope tests cover initial context defaults, edit values, year-dependent term loading, global clearing to null, and a localized term-load error that preserves the selected year. Image tests cover JPEG/PNG acceptance, localized 10 MB rejection, upload success, upload failure with retained form state, replace, remove, and permission-gated upload controls. Extend the upload-button test to prove a caller-provided size-error formatter replaces the existing English fallback.

```tsx
await user.click(screen.getByLabelText("Global reward"));
expect(onChange).toHaveBeenLastCalledWith({
  isGlobal: true,
  academicYearId: null,
  termId: null,
});

const image = new File(["image"], "reward.png", { type: "image/png" });
await user.upload(screen.getByLabelText("Upload image"), image);
await waitFor(() => expect(onChange).toHaveBeenCalledWith("file-2"));
```

- [ ] **Step 2: Run the tests and verify the fields and nullable contracts are absent**

Run: `npm run test:run -- src/components/ui/file-upload/__tests__/FileUploadButton.test.tsx src/features/reinforcement/components/__tests__/RewardCatalogScopeFields.test.tsx src/features/reinforcement/components/__tests__/RewardCatalogImageField.test.tsx`

Expected: FAIL.

- [ ] **Step 3: Make transport types match the backend**

Add explicit `RewardCatalogAcademicYearSummary`, `RewardCatalogTermSummary`, and `RewardCatalogImageFile` interfaces. Change catalog item, create payload, and update payload fields to:

```ts
academicYearId?: string | null;
termId?: string | null;
imageFileId?: string | null;
```

Replace `academicYear`, `term`, and `imageFile` record types with their explicit nullable summary interfaces.

- [ ] **Step 4: Implement the scope field**

`RewardCatalogScopeFields` receives `academicYears`, the current scope value, `onChange`, and `disabled`. It uses searchable existing `Select` controls, fetches terms with `fetchTermsByYear`, ignores stale responses, clears an invalid term after year changes, and disables both selects in global mode. Labels come from the reinforcement translation namespace.

```ts
export interface RewardCatalogScopeValue {
  isGlobal: boolean;
  academicYearId: string | null;
  termId: string | null;
}

export interface RewardCatalogScopeFieldsProps {
  academicYears: AcademicYear[];
  defaultAcademicYearId: string;
  defaultTermId: string;
  value: RewardCatalogScopeValue;
  onChange: (value: RewardCatalogScopeValue) => void;
  disabled?: boolean;
}

function selectYear(yearId: string) {
  onChange({ isGlobal: false, academicYearId: yearId, termId: null });
}

function selectTerm(termId: string) {
  onChange({ ...value, termId });
}

function setGlobal(isGlobal: boolean) {
  onChange(
    isGlobal
      ? { isGlobal: true, academicYearId: null, termId: null }
      : {
          isGlobal: false,
          academicYearId: defaultAcademicYearId || academicYears[0]?.id || null,
          termId: defaultTermId || null,
        },
  );
}
```

- [ ] **Step 5: Implement the image field**

Add an optional `formatSizeError(fileName, maxSizeMb)` prop to `FileUploadButton`; use it when present and retain the existing fallback for other consumers. `RewardCatalogImageField` receives `value`, existing file metadata, `canUpload`, `canDownload`, `disabled`, `onChange`, and `onUploadingChange`. It uses `FileUploadButton` with `accept="image/jpeg,image/png"`, `maxSizeBytes={10 * 1024 * 1024}`, and the localized size formatter, calls `uploadFile`, renders `AuthenticatedFileImage`, and sends `null` from Remove.

```ts
// FileUploadButton.tsx
formatSizeError?: (fileName: string, maxSizeMb: number) => string;

const maxSizeMb = maxSizeBytes / (1024 * 1024);
const errorMsg = formatSizeError
  ? formatSizeError(file.name, maxSizeMb)
  : `File "${file.name}" exceeds ${maxSizeMb.toFixed(0)}MB limit`;

// RewardCatalogImageField.tsx
async function handleFilesSelected([file]: File[]) {
  if (!file) return;
  if (!["image/jpeg", "image/png"].includes(file.type.toLowerCase())) {
    setError(t("rewardsModule.catalog.form.imageTypeInvalid"));
    return;
  }
  onUploadingChange(true);
  setError(null);
  try {
    const uploaded = await uploadFile(file);
    onChange(uploaded.id);
    setFileName(uploaded.originalName);
  } catch {
    setError(t("rewardsModule.catalog.form.imageUploadFailed"));
  } finally {
    onUploadingChange(false);
  }
}
```

- [ ] **Step 6: Run the field tests**

Run: `npm run test:run -- src/components/ui/file-upload/__tests__/FileUploadButton.test.tsx src/features/reinforcement/components/__tests__/RewardCatalogScopeFields.test.tsx src/features/reinforcement/components/__tests__/RewardCatalogImageField.test.tsx`

Expected: PASS.

- [ ] **Step 7: Commit the contracts and focused fields**

```bash
git add -p src/features/reinforcement/types.ts src/components/ui/file-upload/FileUploadButton.tsx src/components/ui/file-upload/__tests__/FileUploadButton.test.tsx
git add src/features/reinforcement/components/RewardCatalogScopeFields.tsx src/features/reinforcement/components/RewardCatalogImageField.tsx src/features/reinforcement/components/__tests__/RewardCatalogScopeFields.test.tsx src/features/reinforcement/components/__tests__/RewardCatalogImageField.test.tsx
git commit -m "feat: add reward catalog scope and image fields"
```

### Task 6: Integrate academic scope and image state into the catalog form

**Files:**
- Modify: `src/features/reinforcement/components/RewardCatalogFormModal.tsx`
- Create: `src/features/reinforcement/components/__tests__/RewardCatalogFormModal.test.tsx`

- [ ] **Step 1: Write failing form integration tests**

Render the form with academic options and context defaults. Assert create submits those IDs, edit submits the item's stored IDs, global submits null IDs, uploaded IDs reach the payload, remove submits `imageFileId: null`, and submit stays disabled while uploading. Assert failed upload does not clear titles, descriptions, stock, or scope.

- [ ] **Step 2: Run the test and verify the form omits all three fields**

Run: `npm run test:run -- src/features/reinforcement/components/__tests__/RewardCatalogFormModal.test.tsx`

Expected: FAIL because the modal does not render scope/image fields or include their values in payloads.

- [ ] **Step 3: Extend the form interface and state**

Add these props:

```ts
academicYears: AcademicYear[];
defaultAcademicYearId: string;
defaultTermId: string;
canUploadFiles: boolean;
canDownloadFiles: boolean;
```

Track `{ isGlobal, academicYearId, termId }`, `imageFileId`, and `imageUploading`. On open, initialize edit state from `initialData`; otherwise initialize scope from the context defaults. Pass the stored `imageFile` metadata to the image field.

- [ ] **Step 4: Include scope and image values in both payloads**

```ts
const scopedFields = scope.isGlobal
  ? { academicYearId: null, termId: null }
  : { academicYearId: scope.academicYearId, termId: scope.termId };

const commonPayload = {
  ...scopedFields,
  imageFileId,
  titleEn: titleEn.trim() || undefined,
  titleAr: titleAr.trim() || undefined,
  descriptionEn: descriptionEn.trim() || undefined,
  descriptionAr: descriptionAr.trim() || undefined,
  type,
  minTotalXp: minTotalXp ? Number(minTotalXp) : undefined,
  stockQuantity: !isUnlimited && stockQuantity ? Number(stockQuantity) : undefined,
  stockRemaining: !isUnlimited && stockRemaining ? Number(stockRemaining) : undefined,
  isUnlimited,
  sortOrder: sortOrder ? Number(sortOrder) : undefined,
};
```

Disable Save/Create when `loading`, `imageUploading`, or a scoped reward lacks either selected ID.

- [ ] **Step 5: Run the modal tests**

Run: `npm run test:run -- src/features/reinforcement/components/__tests__/RewardCatalogFormModal.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit the modal integration**

```bash
git add -p src/features/reinforcement/components/RewardCatalogFormModal.tsx
git add src/features/reinforcement/components/__tests__/RewardCatalogFormModal.test.tsx
git commit -m "feat: add scope and images to reward catalog form"
```

### Task 7: Add context filters and images to Reward Catalog page

**Files:**
- Modify: `src/features/reinforcement/pages/RewardCatalogPage.tsx`
- Modify: `src/features/reinforcement/pages/__tests__/RewardCatalogPage.test.tsx`

- [ ] **Step 1: Extend the page tests before production code**

Mock `useAcademicYearTermLayoutContext` with two years, dependent terms, request-change functions, and initialization state. Add assertions that list and summary receive identical context IDs; year/term controls call the context APIs and reset pagination; status/search changes preserve academic URL parameters; the title cell renders the protected image; and missing file permissions skip downloads/uploads while leaving the catalog usable.

```ts
expect(catalogMocks.listRewardCatalog).toHaveBeenCalledWith(
  expect.objectContaining({ academicYearId: "year-1", termId: "term-1" }),
);
expect(dashboardMocks.getRewardCatalogSummary).toHaveBeenCalledWith(
  expect.objectContaining({ academicYearId: "year-1", termId: "term-1" }),
);
```

- [ ] **Step 2: Run the page tests and verify they fail**

Run: `npm run test:run -- src/features/reinforcement/pages/__tests__/RewardCatalogPage.test.tsx`

Expected: FAIL because context options, permission-aware images, and modal props are not wired.

- [ ] **Step 3: Consume the academic context as the request source of truth**

Read `academicYearId`, `termId`, `academicYears`, `terms`, `isInitializing`, `requestAcademicYearChange`, and `requestTermChange` from `useAcademicYearTermLayoutContext`. Remove academic keys from `useReinforcementUrlFilters` ownership. Add required year and term filter configs without empty options, and route their changes through the context request APIs. Clear/remove actions affect only status, type, and search.

```ts
const {
  academicYearId,
  termId,
  academicYears,
  terms,
  isInitializing,
  requestAcademicYearChange,
  requestTermChange,
} = useAcademicYearTermLayoutContext();

const handleFilterChange = useCallback(
  (key: string, value: string) => {
    setCatalogPage(1);
    if (key === "academicYearId") {
      void requestAcademicYearChange(value);
      return;
    }
    if (key === "termId") {
      requestTermChange(value);
      return;
    }
    setValue(key, value);
  },
  [requestAcademicYearChange, requestTermChange, setValue],
);
```

- [ ] **Step 4: Gate catalog fetching on initialized context**

Build list and summary parameters from the context IDs. Do not request either endpoint while the context is initializing or either ID is empty. Reset `catalogPage` to 1 on context change. Show a localized context-unavailable notice if initialization completes without a usable year and term.

- [ ] **Step 5: Render thumbnails and pass form dependencies**

Compute `canUploadFiles = hasPermission("files.uploads.manage")` and `canDownloadFiles = hasPermission("files.downloads.view")`. Render `AuthenticatedFileImage` beside the localized title using `row.imageFileId`. Pass academic years, current default IDs, and both file permissions to `RewardCatalogFormModal`.

- [ ] **Step 6: Run the page tests**

Run: `npm run test:run -- src/features/reinforcement/pages/__tests__/RewardCatalogPage.test.tsx`

Expected: PASS.

- [ ] **Step 7: Commit the page integration**

```bash
git add -p src/features/reinforcement/pages/RewardCatalogPage.tsx src/features/reinforcement/pages/__tests__/RewardCatalogPage.test.tsx
git commit -m "feat: add reward catalog context filters and thumbnails"
```

### Task 8: Localize and verify the complete feature

**Files:**
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`

- [ ] **Step 1: Add complete English and Arabic copy**

Add keys under `reinforcement.rewardsModule.catalog.form` for academic scope, academic year, term, global reward and help text, image, upload, replace, remove, JPEG/PNG 10 MB help, invalid image type, oversized image, uploading, upload failure, image unavailable, retry image, term loading failure, and context unavailable. Use human Arabic translations rather than transliterated English.

English values:

```json
{
  "academicScope": "Academic scope",
  "academicYear": "Academic year",
  "term": "Term",
  "globalReward": "Global reward",
  "globalRewardHelp": "Make this reward available across all academic years and terms.",
  "image": "Reward image",
  "uploadImage": "Upload image",
  "replaceImage": "Replace image",
  "removeImage": "Remove image",
  "imageHelp": "PNG or JPEG, up to 10 MB.",
  "imageTypeInvalid": "Choose a PNG or JPEG image.",
  "imageTooLarge": "The image must not exceed 10 MB.",
  "uploadingImage": "Uploading image...",
  "imageUploadFailed": "Unable to upload the image. Try again.",
  "imageUnavailable": "Image unavailable.",
  "retryImage": "Retry",
  "termsLoadFailed": "Unable to load terms for this academic year.",
  "contextUnavailable": "Select an academic year and term to view the reward catalog."
}
```

Arabic values:

```json
{
  "academicScope": "النطاق الأكاديمي",
  "academicYear": "العام الأكاديمي",
  "term": "الفصل الدراسي",
  "globalReward": "مكافأة عامة",
  "globalRewardHelp": "إتاحة هذه المكافأة في جميع الأعوام والفصول الدراسية.",
  "image": "صورة المكافأة",
  "uploadImage": "رفع صورة",
  "replaceImage": "استبدال الصورة",
  "removeImage": "إزالة الصورة",
  "imageHelp": "PNG أو JPEG، بحد أقصى 10 ميجابايت.",
  "imageTypeInvalid": "اختر صورة بصيغة PNG أو JPEG.",
  "imageTooLarge": "يجب ألا يتجاوز حجم الصورة 10 ميجابايت.",
  "uploadingImage": "جارٍ رفع الصورة...",
  "imageUploadFailed": "تعذر رفع الصورة. حاول مرة أخرى.",
  "imageUnavailable": "الصورة غير متاحة.",
  "retryImage": "إعادة المحاولة",
  "termsLoadFailed": "تعذر تحميل الفصول الدراسية لهذا العام.",
  "contextUnavailable": "اختر عامًا أكاديميًا وفصلًا دراسيًا لعرض كتالوج المكافآت."
}
```

- [ ] **Step 2: Run all focused Reward Catalog and support tests**

Run: `npm run test:run -- src/features/reinforcement/hooks/__tests__/useReinforcementUrlFilters.test.tsx src/features/reinforcement/__tests__/ReinforcementLayout.test.tsx src/services/__tests__/filesService.test.ts src/components/ui/authenticated-file-image/__tests__/AuthenticatedFileImage.test.tsx src/components/ui/file-upload/__tests__/FileUploadButton.test.tsx src/features/reinforcement/components/__tests__/RewardCatalogScopeFields.test.tsx src/features/reinforcement/components/__tests__/RewardCatalogImageField.test.tsx src/features/reinforcement/components/__tests__/RewardCatalogFormModal.test.tsx src/features/reinforcement/pages/__tests__/RewardCatalogPage.test.tsx`

Expected: PASS.

- [ ] **Step 3: Run reinforcement regression tests**

Run: `npm run test:run -- src/features/reinforcement`

Expected: PASS.

- [ ] **Step 4: Run type checking**

Run: `npm run typecheck`

Expected: exit code 0.

- [ ] **Step 5: Inspect the final diff for unrelated changes and formatting errors**

Run: `git diff --check && git status --short`

Expected: no whitespace errors; only files listed in this plan are part of this feature's commits.

- [ ] **Step 6: Commit translations and final verification adjustments**

```bash
git add -p src/messages/en.json src/messages/ar.json
git commit -m "feat: localize reward catalog context and images"
```
