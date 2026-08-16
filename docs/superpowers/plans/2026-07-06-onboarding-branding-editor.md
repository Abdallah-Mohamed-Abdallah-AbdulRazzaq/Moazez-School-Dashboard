# Onboarding Branding Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show the saved school branding profile in onboarding and let administrators update the complete branding data through the same editor used by Settings.

**Architecture:** Extract the editable branding state into `useSchoolBrandingEditor` and the complete logo/profile/location form into `SchoolBrandingEditor`. `SettingsBrandingPage` keeps its page-only permissions, export, and audit behavior, while `OrganizationSetupStep` adds onboarding summary/edit modes and refreshes setup status after save.

**Tech Stack:** Next.js App Router, React, TypeScript, next-intl, Vitest, Testing Library, Tailwind CSS.

---

## File Structure

- Create `src/features/settings/branding/hooks/useSchoolBrandingEditor.ts`: reusable draft, validation, logo, location, save, and cancel state.
- Create `src/features/settings/branding/components/SchoolBrandingEditor.tsx`: reusable complete branding form and location modal.
- Create `src/features/settings/branding/__tests__/useSchoolBrandingEditor.test.tsx`: editor state and persistence contract.
- Create `src/features/settings/branding/__tests__/SchoolBrandingEditor.test.tsx`: complete form rendering and interaction contract.
- Modify `src/features/settings/branding/pages/SettingsBrandingPage.tsx`: consume the shared editor while retaining page-only controls.
- Modify `src/features/onboarding/components/steps/OrganizationSetupStep.tsx`: add summary/edit modes and use the shared editor.
- Modify `src/features/onboarding/__tests__/OrganizationSetupStep.test.tsx`: verify summary, edit, cancel, and save behavior.
- Modify `src/features/onboarding/components/SetupGuideContent.tsx`: pass the expanded localized copy.
- Modify `src/messages/en.json` and `src/messages/ar.json`: add onboarding branding strings.
- Modify `src/messages/__tests__/onboardingTranslations.test.ts`: enforce the new message contract.
- Modify `src/features/settings/services/brandingService.ts`: align completeness with the approved required fields.
- Modify or create the focused branding service test beside existing settings service tests.

### Task 1: Lock the localized copy and completeness contract

**Files:**
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`
- Modify: `src/messages/__tests__/onboardingTranslations.test.ts`
- Modify: `src/features/settings/services/brandingService.ts`
- Test: `src/features/settings/services/__tests__/brandingService.test.ts`

- [ ] **Step 1: Add failing translation assertions**

Add representative assertions while retaining recursive English/Arabic key parity:

```ts
expect(en.onboarding.steps.organization.editBranding).toBe("Edit branding");
expect(en.onboarding.steps.organization.completeness).toContain("{percent}");
expect(ar.onboarding.steps.organization.editBranding).toBe("تعديل الهوية");
expect(ar.onboarding.steps.organization.locationRequired).toBeTruthy();
```

- [ ] **Step 2: Run the translation test and verify RED**

Run:

```bash
npx vitest run src/messages/__tests__/onboardingTranslations.test.ts --reporter=dot
```

Expected: FAIL because the onboarding branding keys do not exist.

- [ ] **Step 3: Add the complete English and Arabic message contract**

Add these keys below `onboarding.steps.organization` in both locale files:

```json
{
  "savedData": "Saved school branding",
  "editBranding": "Edit branding",
  "cancel": "Cancel",
  "completeness": "Branding completeness: {percent}%",
  "logo": "School logo",
  "noLogo": "No logo uploaded",
  "formattedAddress": "Selected location",
  "coordinates": "{lat}, {lng}",
  "noLocation": "No location selected",
  "footerSignature": "Footer signature",
  "uploadLogo": "Upload logo",
  "uploadHint": "PNG or JPG, up to 2 MB",
  "pickFromMap": "Pick from map",
  "clearLocation": "Clear location",
  "locationRequired": "Select a valid school location",
  "shortNameRequired": "Short name is required",
  "timezoneRequired": "Timezone is required",
  "addressRequired": "Address is required",
  "cityRequired": "City is required",
  "countryRequired": "Country is required",
  "footerRequired": "Footer signature is required",
  "logoRequired": "School logo is required",
  "logoUploadFailed": "Could not read the selected logo"
}
```

Use accurate Arabic values for the same keys; do not copy English text into `ar.json`.

- [ ] **Step 4: Write the failing completeness test**

Create a full profile fixture, then remove one requirement at a time:

```ts
it("requires the full approved branding profile for 100 percent", () => {
  expect(calculateBrandingProfileCompleteness(completeProfile)).toBe(100);
  expect(
    calculateBrandingProfileCompleteness({ ...completeProfile, latitude: null }),
  ).toBeLessThan(100);
  expect(
    calculateBrandingProfileCompleteness({ ...completeProfile, longitude: null }),
  ).toBeLessThan(100);
});
```

- [ ] **Step 5: Run the service test and verify RED**

Run:

```bash
npx vitest run src/features/settings/services/__tests__/brandingService.test.ts --reporter=dot
```

Expected: FAIL because location is not included in completeness.

- [ ] **Step 6: Implement the approved completeness calculation**

Use nine requirements, treating a complete coordinate pair as one requirement:

```ts
const requirements = [
  profile.schoolName.trim().length > 0,
  profile.shortName.trim().length > 0,
  profile.timezone.trim().length > 0,
  profile.addressLine.trim().length > 0,
  profile.city.trim().length > 0,
  profile.country.trim().length > 0,
  profile.footerSignature.trim().length > 0,
  profile.logoUrl.trim().length > 0,
  profile.latitude !== null && profile.longitude !== null,
];

return Math.round(
  (requirements.filter(Boolean).length / requirements.length) * 100,
);
```

- [ ] **Step 7: Run both tests and verify GREEN**

Run:

```bash
npx vitest run src/messages/__tests__/onboardingTranslations.test.ts src/features/settings/services/__tests__/brandingService.test.ts --reporter=dot
```

Expected: all tests pass.

- [ ] **Step 8: Commit**

```bash
git add src/messages/en.json src/messages/ar.json src/messages/__tests__/onboardingTranslations.test.ts src/features/settings/services/brandingService.ts src/features/settings/services/__tests__/brandingService.test.ts
git commit -m "feat: define complete school branding contract"
```

### Task 2: Extract reusable branding editor state

**Files:**
- Create: `src/features/settings/branding/hooks/useSchoolBrandingEditor.ts`
- Test: `src/features/settings/branding/__tests__/useSchoolBrandingEditor.test.tsx`

- [ ] **Step 1: Write failing hook tests**

Test the public behavior rather than React internals:

```ts
const { result } = renderHook(() =>
  useSchoolBrandingEditor({
    initialProfile: completeProfile,
    copy,
    onSave: saveMock,
  }),
);

act(() => result.current.changeText("schoolName", "Updated School"));
expect(result.current.profile.schoolName).toBe("Updated School");

act(() => result.current.cancel());
expect(result.current.profile).toEqual(completeProfile);

await act(() => result.current.save());
expect(saveMock).toHaveBeenCalledWith(result.current.profile);
```

Add separate tests for required fields, address edits clearing stale coordinates, logo `FileReader` success/failure, and confirmed location mapping.
Use `rerender` with a different `initialProfile` and assert that the hook replaces both the draft and cancel baseline; this covers profiles loaded asynchronously by Settings and profiles refreshed by onboarding.

- [ ] **Step 2: Run the hook test and verify RED**

Run:

```bash
npx vitest run src/features/settings/branding/__tests__/useSchoolBrandingEditor.test.tsx --reporter=dot
```

Expected: FAIL because the hook does not exist.

- [ ] **Step 3: Define the copy and hook contracts**

```ts
export interface SchoolBrandingEditorCopy {
  schoolName: string;
  shortName: string;
  timezone: string;
  address: string;
  city: string;
  country: string;
  footerSignature: string;
  uploadLogo: string;
  uploadHint: string;
  pickFromMap: string;
  clearLocation: string;
  selectedLocation: string;
  noLocation: string;
  coordinates(lat: string, lng: string): string;
  validation: Partial<Record<keyof SchoolProfileSettings, string>>;
  logoUploadFailed: string;
}

interface UseSchoolBrandingEditorOptions {
  initialProfile: SchoolProfileSettings;
  copy: SchoolBrandingEditorCopy;
  onSave(profile: SchoolProfileSettings): Promise<SchoolProfileSettings>;
  onError?(): void;
}
```

Return `profile`, `errors`, `isDirty`, `isSaving`, `isLocationModalOpen`, `locationWasEdited`, `changeText`, `uploadLogo`, `confirmLocation`, `clearLocation`, `openLocationModal`, `closeLocationModal`, `save`, `cancel`, and `reset`.
Synchronize the draft and saved baseline in an effect whenever `initialProfile` changes.

- [ ] **Step 4: Implement validation and draft transitions**

Validation must require every approved field and attach errors to the relevant key. An address edit must clear `formattedAddress`, `mapPlaceLabel`, `latitude`, and `longitude`. `cancel()` restores `initialProfile`; a successful `save()` replaces both draft and initial profile with the normalized API response.

- [ ] **Step 5: Run the hook tests and verify GREEN**

Run the same focused command. Expected: all hook tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/features/settings/branding/hooks/useSchoolBrandingEditor.ts src/features/settings/branding/__tests__/useSchoolBrandingEditor.test.tsx
git commit -m "refactor: extract school branding editor state"
```

### Task 3: Extract the complete shared branding form

**Files:**
- Create: `src/features/settings/branding/components/SchoolBrandingEditor.tsx`
- Test: `src/features/settings/branding/__tests__/SchoolBrandingEditor.test.tsx`

- [ ] **Step 1: Write the failing component test**

Mock `SchoolLocationPickerModal` and render the component with a hook result fixture. Assert that the logo preview, six text/select fields, footer signature, selected location, coordinates, upload area, and map actions are visible. Trigger upload and location callbacks and assert the supplied actions are called.

```ts
expect(screen.getByLabelText(copy.schoolName)).toHaveValue(completeProfile.schoolName);
expect(screen.getByAltText(completeProfile.schoolName)).toHaveAttribute("src", completeProfile.logoUrl);
expect(screen.getByText("30.04440, 31.23570")).toBeVisible();
await user.click(screen.getByRole("button", { name: copy.pickFromMap }));
expect(actions.openLocationModal).toHaveBeenCalledOnce();
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
npx vitest run src/features/settings/branding/__tests__/SchoolBrandingEditor.test.tsx --reporter=dot
```

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement the presentational editor**

Define props using the hook return type:

```ts
interface SchoolBrandingEditorProps {
  editor: SchoolBrandingEditorState;
  copy: SchoolBrandingEditorCopy;
  disabled?: boolean;
}
```

Move the existing logo preview, `DragDropUploadArea`, profile inputs, timezone select, location controls, selected-location panel, and `SchoolLocationPickerModal` from `SettingsBrandingPage`. Keep `alt={profile.schoolName}`, `maxSizeBytes={2 * 1024 * 1024}`, `accept="image/*"`, and the existing location initialization rules.

- [ ] **Step 4: Run the component test and verify GREEN**

Run the same focused command. Expected: all component tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/settings/branding/components/SchoolBrandingEditor.tsx src/features/settings/branding/__tests__/SchoolBrandingEditor.test.tsx
git commit -m "refactor: extract shared school branding form"
```

### Task 4: Refactor Settings Branding to the shared editor

**Files:**
- Modify: `src/features/settings/branding/pages/SettingsBrandingPage.tsx`
- Test: `src/features/settings/branding/__tests__/SettingsBrandingPage.test.tsx`

- [ ] **Step 1: Add a focused Settings page regression test**

Mock the branding service and permissions. Verify loading the saved profile, changing a field, cancelling, saving, resetting, opening export, and permission-disabled actions. The saved payload assertion must include logo and location values.

- [ ] **Step 2: Run the regression test against the current page**

Run:

```bash
npx vitest run src/features/settings/branding/__tests__/SettingsBrandingPage.test.tsx --reporter=dot
```

Expected: PASS, establishing the existing behavior before refactoring.

- [ ] **Step 3: Replace duplicated editor state and markup**

Instantiate the hook after loading:

```ts
const editor = useSchoolBrandingEditor({
  initialProfile,
  copy: brandingEditorCopy,
  onSave: updateBrandingProfile,
  onError: () => showError(tCommon("save_failed")),
});
```

Render `<SchoolBrandingEditor editor={editor} copy={brandingEditorCopy} disabled={!hasPermission("settings.branding.manage")} />`. Keep `SettingsAccessGuard`, `SettingsPageHeader`, export modal, permission checks, success toast, dirty-key synchronization, and export rows in the page.

- [ ] **Step 4: Run Settings Branding tests and verify GREEN**

Run the shared hook, component, page, and branding service tests. Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/settings/branding/pages/SettingsBrandingPage.tsx src/features/settings/branding/__tests__/SettingsBrandingPage.test.tsx
git commit -m "refactor: use shared school branding editor in settings"
```

### Task 5: Add onboarding saved-data summary and editing

**Files:**
- Modify: `src/features/onboarding/components/steps/OrganizationSetupStep.tsx`
- Modify: `src/features/onboarding/components/SetupGuideContent.tsx`
- Test: `src/features/onboarding/__tests__/OrganizationSetupStep.test.tsx`

- [ ] **Step 1: Replace the narrow onboarding test with failing summary/edit tests**

Cover these states:

```ts
expect(screen.getByRole("heading", { name: copy.savedData })).toBeVisible();
expect(screen.getByText(completeProfile.footerSignature)).toBeVisible();
expect(screen.getByAltText(completeProfile.schoolName)).toHaveAttribute("src", completeProfile.logoUrl);
expect(screen.getByText(copy.completeness(100))).toBeVisible();

await user.click(screen.getByRole("button", { name: copy.editBranding }));
expect(screen.getByLabelText(copy.schoolName)).toHaveValue(completeProfile.schoolName);

await user.click(screen.getByRole("button", { name: copy.cancel }));
expect(screen.getByRole("heading", { name: copy.savedData })).toBeVisible();
```

Also verify a successful save calls `updateBrandingProfile` with all fields, awaits `refreshStep("organization")`, and returns to the updated summary. Verify `profile={null}` opens edit mode directly.

- [ ] **Step 2: Run the onboarding organization test and verify RED**

Run:

```bash
npx vitest run src/features/onboarding/__tests__/OrganizationSetupStep.test.tsx --reporter=dot
```

Expected: FAIL because summary/edit modes and complete fields do not exist.

- [ ] **Step 3: Expand `OrganizationSetupStepCopy`**

Add summary labels/actions and embed `SchoolBrandingEditorCopy`:

```ts
export interface OrganizationSetupStepCopy {
  summary: string;
  savedData: string;
  editBranding: string;
  cancel: string;
  save: string;
  saving: string;
  completeness(percent: number): string;
  noLogo: string;
  noLocation: string;
  editor: SchoolBrandingEditorCopy;
}
```

- [ ] **Step 4: Implement summary and edit modes**

Initialize `isEditing` to `profile === null`. In summary mode, render all profile values, logo preview, selected location, coordinates, footer signature, and `calculateBrandingProfileCompleteness(profile)`. In edit mode, render the shared editor plus Cancel and Save buttons.

Use this save callback:

```ts
const saveProfile = async (draft: SchoolProfileSettings) => {
  const saved = await updateBrandingProfile(draft);
  await refreshStep("organization");
  setIsEditing(false);
  return saved;
};
```

- [ ] **Step 5: Map every localization key in `SetupGuideContent`**

Build `organization` copy from `t("steps.organization.*")`, including formatter functions:

```ts
completeness: (percent) =>
  t("steps.organization.completeness", { percent }),
editor: {
  coordinates: (lat, lng) =>
    t("steps.organization.coordinates", { lat, lng }),
  validation: {
    schoolName: t("steps.organization.required"),
    shortName: t("steps.organization.shortNameRequired"),
    timezone: t("steps.organization.timezoneRequired"),
    addressLine: t("steps.organization.locationRequired"),
    city: t("steps.organization.cityRequired"),
    country: t("steps.organization.countryRequired"),
    footerSignature: t("steps.organization.footerRequired"),
    logoUrl: t("steps.organization.logoRequired"),
  },
  schoolName: t("steps.organization.schoolName"),
  shortName: t("steps.organization.shortName"),
  timezone: t("steps.organization.timezone"),
  address: t("steps.organization.addressLine"),
  city: t("steps.organization.city"),
  country: t("steps.organization.country"),
  footerSignature: t("steps.organization.footerSignature"),
  uploadLogo: t("steps.organization.uploadLogo"),
  uploadHint: t("steps.organization.uploadHint"),
  pickFromMap: t("steps.organization.pickFromMap"),
  clearLocation: t("steps.organization.clearLocation"),
  selectedLocation: t("steps.organization.formattedAddress"),
  noLocation: t("steps.organization.noLocation"),
  logoUploadFailed: t("steps.organization.logoUploadFailed"),
},
```

- [ ] **Step 6: Run onboarding tests and verify GREEN**

Run:

```bash
npx vitest run src/features/onboarding src/messages/__tests__/onboardingTranslations.test.ts --reporter=dot
```

Expected: all onboarding and translation tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/features/onboarding/components/steps/OrganizationSetupStep.tsx src/features/onboarding/components/SetupGuideContent.tsx src/features/onboarding/__tests__/OrganizationSetupStep.test.tsx
git commit -m "feat: edit complete branding from onboarding"
```

### Task 6: Final quality gates

**Files:**
- Review all files changed in Tasks 1–5.

- [ ] **Step 1: Run focused tests**

```bash
npx vitest run src/features/onboarding src/features/settings/branding src/features/settings/services/__tests__/brandingService.test.ts src/messages/__tests__/onboardingTranslations.test.ts --reporter=dot
```

Expected: zero failures.

- [ ] **Step 2: Run TypeScript and targeted lint**

```bash
npm run typecheck
npx eslint src/features/onboarding src/features/settings/branding src/features/settings/services/brandingService.ts src/messages/__tests__/onboardingTranslations.test.ts
```

Expected: both commands exit 0.

- [ ] **Step 3: Inspect the final diff**

```bash
git diff --check
git status --short
git diff --stat HEAD~5..HEAD
```

Confirm there are no unrelated edits, duplicated branding form implementations, raw user-facing strings, or unsafe display of API errors.

- [ ] **Step 4: Run the full test suite**

```bash
npx vitest run --reporter=dot
```

Expected: exit 0. Existing jsdom, chart sizing, and React `act` warnings may remain, but no test may fail.

- [ ] **Step 5: Commit any verification-only corrections**

If verification required code corrections, commit only those corrections:

```bash
git add src/features/onboarding src/features/settings/branding src/features/settings/services/brandingService.ts src/messages/en.json src/messages/ar.json src/messages/__tests__/onboardingTranslations.test.ts
git commit -m "fix: complete onboarding branding verification"
```
