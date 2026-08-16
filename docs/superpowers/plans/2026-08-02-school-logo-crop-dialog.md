# School Logo Crop Dialog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Let administrators crop, zoom, move, and rotate a school logo in a square dialog before the existing branding upload endpoint receives it.

**Architecture:** A generic dialog under src/components/ui/school-logo-crop-dialog converts a validated source image into a square File and does not know about schools or APIs. SchoolBrandingEditor owns file selection and invokes the existing upload hook only after confirmation, so Settings Branding and onboarding receive the same behavior.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, Vitest/Testing Library, react-easy-crop, browser Canvas API, next-intl.

## Global Constraints

- Run pnpm add react-easy-crop; update package.json and pnpm-lock.yaml only, leaving the legacy package-lock.json unchanged.
- Accept only image/png and image/jpeg source files of at most 5 MiB; keep validation in DragDropUploadArea.
- The crop is always 1:1. PNG outputs image/png; JPEG outputs image/jpeg.
- Do not change POST /settings/branding/logo, FormData field name file, or SchoolProfileSettings.logoUrl.
- Place all generic crop UI and Canvas logic in src/components/ui/school-logo-crop-dialog.
- Apply the behavior through SchoolBrandingEditor so it covers Settings Branding and the onboarding Organization step.
- Add matching settings and onboarding keys in en.json and ar.json; onboarding translation parity must pass.

---

## File Structure

- Create: src/components/ui/school-logo-crop-dialog/cropImage.ts — decode, rotate, crop, and export the source File.
- Create: src/components/ui/school-logo-crop-dialog/SchoolLogoCropDialog.tsx — generic Modal with crop, zoom, rotation, loading, and confirmation states.
- Create: src/components/ui/school-logo-crop-dialog/index.ts — public exports.
- Create: src/components/ui/school-logo-crop-dialog/__tests__/cropImage.test.ts — Canvas export tests.
- Create: src/components/ui/school-logo-crop-dialog/__tests__/SchoolLogoCropDialog.test.tsx — dialog interaction/accessibility tests.
- Modify: src/features/settings/branding/hooks/useSchoolBrandingEditor.ts — make uploadLogo report success.
- Modify: src/features/settings/branding/components/SchoolBrandingEditor.tsx — delay upload until crop confirmation.
- Modify: src/features/settings/branding/pages/SettingsBrandingPage.tsx and src/features/onboarding/components/SetupGuideContent.tsx — map localized dialog copy.
- Modify: src/messages/en.json, src/messages/ar.json, and the affected branding/onboarding/translation tests.

### Task 1: Add the dependency and Canvas crop helper

**Files:**
- Modify: package.json
- Modify: pnpm-lock.yaml
- Create: src/components/ui/school-logo-crop-dialog/cropImage.ts
- Test: src/components/ui/school-logo-crop-dialog/__tests__/cropImage.test.ts

**Interfaces:**
- Produces: type CropPixels = { x: number; y: number; width: number; height: number }.
- Produces: createCroppedImage(sourceFile: File, cropPixels: CropPixels, rotation: number): Promise<File>.
- Consumed by Task 2: the dialog supplies react-easy-crop pixel coordinates and clockwise degrees.

- [ ] **Step 1: Write the failing helper tests**

Mock Image and HTMLCanvasElement so drawImage, getImageData, putImageData, and toBlob are observable. Add this contract test, plus the null-blob test:

~~~
it.each([
  ["image/png", "school-logo.png", "image/png", "school-logo-cropped.png"],
  ["image/jpeg", "school-logo.jpg", "image/jpeg", "school-logo-cropped.jpg"],
])("exports a square image in the source format", async (type, name, outputType, outputName) => {
  const result = await createCroppedImage(
    new File(["source"], name, { type }),
    { x: 8, y: 12, width: 120, height: 120 },
    90,
  );

  expect(result.type).toBe(outputType);
  expect(result.name).toBe(outputName);
  expect(mockCanvas.width).toBe(120);
  expect(mockCanvas.height).toBe(120);
});
~~~

- [ ] **Step 2: Run the test to verify it fails**

Run: npx vitest run src/components/ui/school-logo-crop-dialog/__tests__/cropImage.test.ts

Expected: FAIL because cropImage.ts and createCroppedImage do not exist.

- [ ] **Step 3: Add the dependency and implement the helper**

Run pnpm add react-easy-crop. Decode sourceFile with a URL.createObjectURL-backed Image promise and revoke the URL in finally. Draw the source to a rotation-safe temporary canvas, copy cropPixels into a destination canvas with width cropPixels.width and height cropPixels.height, then use canvas.toBlob with sourceFile.type.

Use outputType equal to image/png for PNG source and image/jpeg otherwise. Derive a name with the original basename plus -cropped and use png or jpg extension. Reject a null canvas blob with Error("Could not prepare image"). Do not pass JPEG quality to toBlob.

- [ ] **Step 4: Run the test to verify it passes**

Run: npx vitest run src/components/ui/school-logo-crop-dialog/__tests__/cropImage.test.ts

Expected: PASS for PNG/JPEG output, square dimensions, rotation draw path, and null-blob failure.

- [ ] **Step 5: Commit**

~~~
git add package.json pnpm-lock.yaml src/components/ui/school-logo-crop-dialog/cropImage.ts src/components/ui/school-logo-crop-dialog/__tests__/cropImage.test.ts
git commit -m "feat: add school logo crop helper"
~~~

### Task 2: Build the reusable crop dialog

**Files:**
- Create: src/components/ui/school-logo-crop-dialog/SchoolLogoCropDialog.tsx
- Create: src/components/ui/school-logo-crop-dialog/index.ts
- Test: src/components/ui/school-logo-crop-dialog/__tests__/SchoolLogoCropDialog.test.tsx

**Interfaces:**
- Consumes: CropPixels and createCroppedImage from Task 1.
- Produces: SchoolLogoCropDialogCopy with title, instruction, zoom, rotate, rotation(degrees), cancel, confirm, preparing, and preparationFailed strings.
- Produces: SchoolLogoCropDialog props: file, isOpen, copy, isUploading, uploadError, onClose, and onConfirm(file): Promise<boolean>.
- Consumed by Task 3: SchoolBrandingEditor supplies the selected file and its existing upload action.

- [ ] **Step 1: Write the failing dialog tests**

Mock react-easy-crop so it invokes onCropComplete with { x: 10, y: 10, width: 128, height: 128 }, then mock createCroppedImage. Assert that clicking Rotate then Confirm calls the helper with rotation 90 and calls onConfirm with the processed file. Assert Cancel and Escape call onClose without calling either helper or onConfirm. Also assert the labelled zoom range exists, preparation and supplied uploadError values use role="alert", and all controls are disabled while preparation or isUploading is true.

- [ ] **Step 2: Run the test to verify it fails**

Run: npx vitest run src/components/ui/school-logo-crop-dialog/__tests__/SchoolLogoCropDialog.test.tsx

Expected: FAIL because the dialog module does not exist.

- [ ] **Step 3: Implement the dialog**

Use the existing Modal with size="xl", Crop from react-easy-crop, aspect={1}, minZoom={1}, initial crop x/y zero, initial zoom 1, and initial rotation 0. Keep the latest pixel crop from onCropComplete. Implement an accessible range input labelled with copy.zoom. The rotation button applies (rotation + 90) % 360.

On confirmation, set local preparation state, call createCroppedImage, then await onConfirm(processedFile). Close only when that callback resolves true. Render copy.preparationFailed with role="alert" if the helper rejects; render the supplied uploadError in the same way after a failed API upload. Set effectiveOnClose to a no-op while preparation or isUploading is true and pass it to Modal; also set closeOnEscape and closeOnOverlayClick to false while busy. Disable Cancel, rotate, zoom, and Confirm while busy. Clear crop state and revoke its preview URL whenever file changes or the dialog closes. Export the component and both public TypeScript interfaces from index.ts.

- [ ] **Step 4: Run the test to verify it passes**

Run: npx vitest run src/components/ui/school-logo-crop-dialog/__tests__/SchoolLogoCropDialog.test.tsx

Expected: PASS for confirmation, cancellation, Escape, 90-degree rotation, accessible zoom, loading, and helper errors.

- [ ] **Step 5: Commit**

~~~
git add src/components/ui/school-logo-crop-dialog/SchoolLogoCropDialog.tsx src/components/ui/school-logo-crop-dialog/index.ts src/components/ui/school-logo-crop-dialog/__tests__/SchoolLogoCropDialog.test.tsx
git commit -m "feat: add reusable school logo crop dialog"
~~~

### Task 3: Defer School Branding upload until confirmation

**Files:**
- Modify: src/features/settings/branding/hooks/useSchoolBrandingEditor.ts
- Modify: src/features/settings/branding/components/SchoolBrandingEditor.tsx
- Modify: src/features/settings/branding/__tests__/useSchoolBrandingEditor.test.tsx
- Modify: src/features/settings/branding/__tests__/SchoolBrandingEditor.test.tsx

**Interfaces:**
- Changes: uploadLogo(files: File[]): Promise<boolean> resolves true after uploadBrandingLogo succeeds and resolves false after setting logoError.
- Extends: SchoolBrandingFormCopy with logoCrop: SchoolLogoCropDialogCopy.
- Produces: selecting a valid file opens the dialog; the upload service receives only the confirmed processed file.

- [ ] **Step 1: Write the failing branding tests**

In the hook test, assert await result.current.uploadLogo([file]) resolves true after a mocked success and resolves false after a mocked rejection, while logoError retains the existing failed-upload text.

In the editor test, mock the generic dialog with a Confirm button whose handler calls onConfirm(croppedPngFile). Upload a valid file into DragDropUploadArea and assert the dialog appears but uploadBrandingLogo has no calls. Click Confirm and assert one call with croppedPngFile. Add a cancel test that asserts zero upload calls and that the current logo src remains unchanged.

- [ ] **Step 2: Run the tests to verify they fail**

Run: npx vitest run src/features/settings/branding/__tests__/useSchoolBrandingEditor.test.tsx src/features/settings/branding/__tests__/SchoolBrandingEditor.test.tsx

Expected: FAIL because uploadLogo returns void and SchoolBrandingEditor uploads immediately.

- [ ] **Step 3: Implement deferred upload**

In useSchoolBrandingEditor, preserve all current state updates but return true after accepting uploadedProfile and false in the catch branch.

In SchoolBrandingEditor, retain selectedLogoFile and isLogoCropDialogOpen state. Replace onFilesSelected={editor.uploadLogo} with a handler that stores the first valid File and opens the dialog. Render SchoolLogoCropDialog with the selected file, copy.logoCrop, isUploading={editor.isUploadingLogo}, uploadError={editor.logoError}, and this flow:

~~~
onConfirm={async (processedFile) => editor.uploadLogo([processedFile])}
onClose={() => {
  setIsLogoCropDialogOpen(false);
  setSelectedLogoFile(null);
}}
~~~

Disable DragDropUploadArea while the dialog is open or editor.isUploadingLogo is true. Do not change branding service endpoints, FormData, deletion, or profile-save behavior.

- [ ] **Step 4: Run the tests to verify they pass**

Run: npx vitest run src/features/settings/branding/__tests__/useSchoolBrandingEditor.test.tsx src/features/settings/branding/__tests__/SchoolBrandingEditor.test.tsx

Expected: PASS for boolean hook outcomes, deferred upload, confirmed upload, and cancellation.

- [ ] **Step 5: Commit**

~~~
git add src/features/settings/branding/hooks/useSchoolBrandingEditor.ts src/features/settings/branding/components/SchoolBrandingEditor.tsx src/features/settings/branding/__tests__/useSchoolBrandingEditor.test.tsx src/features/settings/branding/__tests__/SchoolBrandingEditor.test.tsx
git commit -m "feat: crop school logos before upload"
~~~

### Task 4: Localize and verify Settings plus onboarding integration

**Files:**
- Modify: src/messages/en.json
- Modify: src/messages/ar.json
- Modify: src/features/settings/branding/pages/SettingsBrandingPage.tsx
- Modify: src/features/onboarding/components/SetupGuideContent.tsx
- Modify: src/features/onboarding/__tests__/OrganizationSetupStep.test.tsx
- Modify: src/messages/__tests__/onboardingTranslations.test.ts

**Interfaces:**
- Consumes: SchoolLogoCropDialogCopy from Task 2 through SchoolBrandingFormCopy.logoCrop.
- Produces: settings.branding.crop_dialog and onboarding.steps.organization.logoCrop key paths, each mapped to the same editor copy shape.

- [ ] **Step 1: Write the failing localization/integration tests**

Extend every typed editor fixture with logoCrop. In OrganizationSetupStep.test.tsx, enter Edit Branding, select logo.png, verify the crop-dialog title, cancel, and assert the saved summary's logo src is unchanged. Keep Canvas behavior mocked in this integration test because Task 2 already covers it.

In onboardingTranslations.test.ts, add:

~~~
expect(en.onboarding.steps.organization.logoCrop.title).toBe("Crop school logo");
expect(en.onboarding.steps.organization.logoCrop.rotation).toContain("{degrees}");
expect(ar.onboarding.steps.organization.logoCrop.confirm).toBeTruthy();
~~~

- [ ] **Step 2: Run the tests to verify they fail**

Run: npx vitest run src/features/onboarding/__tests__/OrganizationSetupStep.test.tsx src/messages/__tests__/onboardingTranslations.test.ts

Expected: FAIL because logoCrop is missing from translations and typed copies.

- [ ] **Step 3: Add translated copy and mappings**

Add title, instruction, zoom, rotate, rotation with the degrees ICU argument, cancel, confirm, preparing, and preparationFailed to both locale files. Use settings.branding.crop_dialog for Settings Branding and onboarding.steps.organization.logoCrop for onboarding. In SettingsBrandingPage and SetupGuideContent, map every key into copy.logoCrop. Reuse only existing cancel text where its meaning is identical; all crop-specific labels get their own translated keys.

- [ ] **Step 4: Run focused verification**

Run: npx vitest run src/components/ui/school-logo-crop-dialog src/features/settings/branding src/features/onboarding/__tests__/OrganizationSetupStep.test.tsx src/messages/__tests__/onboardingTranslations.test.ts

Expected: PASS for generic dialog behavior, branding upload deferral, onboarding flow, and key parity.

- [ ] **Step 5: Run project verification and commit**

Run:

~~~
npm run typecheck
npx eslint src/components/ui/school-logo-crop-dialog src/features/settings/branding src/features/onboarding/components/SetupGuideContent.tsx src/messages/en.json src/messages/ar.json
npm run test:run
npm run build
git diff --check
~~~

Expected: all commands pass and git diff --check reports no whitespace errors. If an unrelated existing failure appears, record its exact command and output separately; do not alter unrelated code.

~~~
git add src/messages/en.json src/messages/ar.json src/features/settings/branding/pages/SettingsBrandingPage.tsx src/features/onboarding/components/SetupGuideContent.tsx src/features/onboarding/__tests__/OrganizationSetupStep.test.tsx src/messages/__tests__/onboardingTranslations.test.ts
git commit -m "feat: localize school logo crop flow"
~~~
