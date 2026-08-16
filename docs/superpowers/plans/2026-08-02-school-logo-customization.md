# School Logo Customization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let administrators apply persistent image adjustments, filters, backgrounds, and frames while cropping a school logo before upload.

**Architecture:** The shared `SchoolLogoCropDialog` owns editor state and a live preview. `cropImage.ts` receives a typed customization object and renders every selected option onto the final square Canvas `File`; Settings Branding and onboarding remain consumers of that file-only boundary.

**Tech Stack:** React 19, TypeScript, `react-easy-crop`, browser Canvas 2D, Vitest, Testing Library, next-intl.

## Global Constraints

- Keep `SchoolLogoCropDialog` under `src/components/ui/school-logo-crop-dialog/` and share it between Settings Branding and onboarding.
- Accept PNG and JPEG input only, preserving PNG output; a JPEG output must use an opaque white background when transparency was selected.
- Persist every visible customization in the processed file; CSS is preview-only and must mirror Canvas output.
- Keep the existing crop, movement, zoom, 90-degree rotation, upload API, and source-file validation behavior unchanged.
- Keep controls accessible, localized in English and Arabic, and disabled while processing or uploading.
- Do not add a runtime dependency.

---

## File Structure

- Modify: `src/components/ui/school-logo-crop-dialog/cropImage.ts` — exports customization types/defaults and applies them to the output Canvas.
- Modify: `src/components/ui/school-logo-crop-dialog/SchoolLogoCropDialog.tsx` — maintains customization state, renders editor controls, and passes state to the helper.
- Modify: `src/components/ui/school-logo-crop-dialog/__tests__/cropImage.test.ts` — verifies Canvas render options and output-format behavior.
- Modify: `src/components/ui/school-logo-crop-dialog/__tests__/SchoolLogoCropDialog.test.tsx` — verifies defaults, controls, reset, and confirmation payload.
- Modify: `src/features/settings/branding/components/SchoolBrandingEditor.tsx` — widens the shared dialog-copy contract only.
- Modify: `src/features/settings/branding/pages/SettingsBrandingPage.tsx` — maps Settings Branding translations to the expanded dialog copy.
- Modify: `src/features/onboarding/components/SetupGuideContent.tsx` — maps onboarding translations to the expanded dialog copy.
- Modify: `src/features/settings/branding/__tests__/SchoolBrandingEditor.test.tsx` — supplies the expanded copy contract to the shared editor test.
- Modify: `src/features/onboarding/__tests__/OrganizationSetupStep.test.tsx` — supplies the expanded copy contract to onboarding tests.
- Modify: `src/messages/en.json` and `src/messages/ar.json` — add matching Settings Branding and onboarding customization labels.
- Modify: `src/messages/__tests__/onboardingTranslations.test.ts` — asserts the new onboarding copy is present in both locales.

### Task 1: Render persistent customization options into the output Canvas

**Files:**
- Modify: `src/components/ui/school-logo-crop-dialog/cropImage.ts`
- Test: `src/components/ui/school-logo-crop-dialog/__tests__/cropImage.test.ts`

**Interfaces:**
- Produces: `LogoCustomization`, `DEFAULT_LOGO_CUSTOMIZATION`, and `createCroppedImage(sourceFile, cropPixels, rotation, customization): Promise<File>`.
- Consumes: existing `CropPixels` and browser `CanvasRenderingContext2D` APIs.

- [ ] **Step 1: Write failing Canvas-renderer tests**

```ts
const customization = {
  background: "custom",
  backgroundColor: "#2563eb",
  borderColor: "#ffffff",
  borderWidth: 8,
  brightness: 115,
  contrast: 105,
  filter: "warm",
  frame: "circle",
  saturation: 120,
};

await createCroppedImage(pngFile, crop, 0, customization);

expect(context.filter).toBe("brightness(115%) contrast(105%) saturate(120%) sepia(18%)");
expect(context.fillRect).toHaveBeenCalledWith(0, 0, 120, 120);
expect(context.arc).toHaveBeenCalledWith(60, 60, 60, 0, Math.PI * 2);
expect(context.stroke).toHaveBeenCalled();
```

Add a JPEG case that passes `background: "transparent"` and asserts the renderer fills `#ffffff` before encoding a JPEG.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/ui/school-logo-crop-dialog/__tests__/cropImage.test.ts`

Expected: FAIL because `createCroppedImage` accepts only three arguments and no customization Canvas calls exist.

- [ ] **Step 3: Write minimal Canvas implementation**

```ts
export type LogoFilter = "original" | "grayscale" | "warm" | "cool";
export type LogoFrame = "square" | "circle";

export interface LogoCustomization {
  background: "transparent" | "white" | "custom";
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  brightness: number;
  contrast: number;
  filter: LogoFilter;
  frame: LogoFrame;
  saturation: number;
}

export const DEFAULT_LOGO_CUSTOMIZATION: LogoCustomization = {
  background: "transparent",
  backgroundColor: "#2563eb",
  borderColor: "#ffffff",
  borderWidth: 0,
  brightness: 100,
  contrast: 100,
  filter: "original",
  frame: "square",
  saturation: 100,
};
```

Create a final square canvas after the existing crop canvas. Resolve `"white"` to `#ffffff`, `"custom"` to `backgroundColor`, and `"transparent"` to `#ffffff` for JPEG while leaving it unfilled for PNG. Set `context.filter` from brightness/contrast/saturation plus the selected preset. Clip before drawing for a circle and draw the optional border after restoring the context.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/ui/school-logo-crop-dialog/__tests__/cropImage.test.ts`

Expected: PASS with PNG transparency and JPEG white-background coverage.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/school-logo-crop-dialog/cropImage.ts src/components/ui/school-logo-crop-dialog/__tests__/cropImage.test.ts
git commit -m "feat: render school logo customizations"
```

### Task 2: Add accessible customization controls and live preview

**Files:**
- Modify: `src/components/ui/school-logo-crop-dialog/SchoolLogoCropDialog.tsx`
- Test: `src/components/ui/school-logo-crop-dialog/__tests__/SchoolLogoCropDialog.test.tsx`

**Interfaces:**
- Consumes: `DEFAULT_LOGO_CUSTOMIZATION`, `LogoCustomization`, and the four-argument `createCroppedImage` from `cropImage.ts`.
- Produces: expanded `SchoolLogoCropDialogCopy`, used by both branding entry points.

- [ ] **Step 1: Write failing control and Reset tests**

```tsx
await user.selectOptions(screen.getByLabelText(copy.filter), "grayscale");
await user.selectOptions(screen.getByLabelText(copy.frame), "circle");
await user.clear(screen.getByLabelText(copy.borderColor));
await user.type(screen.getByLabelText(copy.borderColor), "#2563eb");
await user.click(screen.getByRole("button", { name: copy.reset }));

expect(screen.getByLabelText(copy.brightness)).toHaveValue("100");
expect(screen.getByLabelText(copy.filter)).toHaveValue("original");
expect(screen.getByLabelText(copy.frame)).toHaveValue("square");
```

Mock `createCroppedImage` and assert confirmation passes `DEFAULT_LOGO_CUSTOMIZATION` after Reset together with the existing file, crop, and rotation values.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/ui/school-logo-crop-dialog/__tests__/SchoolLogoCropDialog.test.tsx`

Expected: FAIL because the copy fields and form controls do not exist.

- [ ] **Step 3: Write minimal dialog implementation**

Initialize `customization` from `DEFAULT_LOGO_CUSTOMIZATION`, except initialize `background: "white"` when the selected source is JPEG. Reset it with crop, zoom, and rotation, using the same source-aware background default. Add labelled controls for brightness, contrast, saturation, filter, background, frame, border color, border width, and Reset. `customization.background` has select values `transparent`, `white`, and `custom`; show and bind `customization.backgroundColor` only for `custom`. Apply `filter`, resolved background color, `borderRadius`, `border`, and `overflow-hidden` to the preview wrapper. Pass `customization` to `createCroppedImage`.

Extend `SchoolLogoCropDialogCopy` with:

```ts
adjustments: string;
background: string;
backgroundCustom: string;
backgroundTransparent: string;
backgroundWhite: string;
borderColor: string;
borderWidth: string;
brightness: string;
contrast: string;
filter: string;
filterCool: string;
filterGrayscale: string;
filterOriginal: string;
filterWarm: string;
frame: string;
frameCircle: string;
frameSquare: string;
reset: string;
saturation: string;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/ui/school-logo-crop-dialog/__tests__/SchoolLogoCropDialog.test.tsx`

Expected: PASS, including the Strict Mode blob URL regression test.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/school-logo-crop-dialog/SchoolLogoCropDialog.tsx src/components/ui/school-logo-crop-dialog/__tests__/SchoolLogoCropDialog.test.tsx
git commit -m "feat: add school logo editor controls"
```

### Task 3: Localize and wire shared copy into both entry points

**Files:**
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`
- Modify: `src/features/settings/branding/components/SchoolBrandingEditor.tsx`
- Modify: `src/features/settings/branding/pages/SettingsBrandingPage.tsx`
- Modify: `src/features/onboarding/components/SetupGuideContent.tsx`
- Modify: `src/features/settings/branding/__tests__/SchoolBrandingEditor.test.tsx`
- Modify: `src/features/onboarding/__tests__/OrganizationSetupStep.test.tsx`
- Modify: `src/messages/__tests__/onboardingTranslations.test.ts`

**Interfaces:**
- Consumes: every required field in the expanded `SchoolLogoCropDialogCopy` from Task 2.
- Produces: complete Settings Branding and onboarding copy objects that can render the dialog without fallback strings.

- [ ] **Step 1: Write failing translation and consumer-contract tests**

```ts
expect(en.onboarding.steps.organization.logoCrop.adjustments).toBe("Adjustments");
expect(en.onboarding.steps.organization.logoCrop.frameCircle).toBe("Circle");
expect(ar.onboarding.steps.organization.logoCrop.reset).toBeTruthy();
```

Add the required new `logoCrop` fields to the explicit copy fixtures in `SchoolBrandingEditor.test.tsx` and `OrganizationSetupStep.test.tsx`; TypeScript will make omissions fail compilation.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/messages/__tests__/onboardingTranslations.test.ts src/features/settings/branding/__tests__/SchoolBrandingEditor.test.tsx src/features/onboarding/__tests__/OrganizationSetupStep.test.tsx`

Expected: FAIL because the new message keys and copy properties are missing.

- [ ] **Step 3: Add locale keys and copy mappings**

Add identical key structure under `settings.branding.crop_dialog` and `onboarding.steps.organization.logoCrop`. Map every Task 2 field with existing Settings `t("crop_dialog.*")` and onboarding `t("steps.organization.logoCrop.*")` calls. English names are `Adjustments`, `Transparent`, `White`, `Custom color`, `Square`, and `Circle`; Arabic names are `تعديلات`, `شفاف`, `أبيض`, `لون مخصص`, `مربع`, and `دائري`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/messages/__tests__/onboardingTranslations.test.ts src/features/settings/branding/__tests__/SchoolBrandingEditor.test.tsx src/features/onboarding/__tests__/OrganizationSetupStep.test.tsx`

Expected: PASS with both entry points still opening the shared editor and both locales exposing the controls.

- [ ] **Step 5: Commit**

```bash
git add src/messages/en.json src/messages/ar.json src/messages/__tests__/onboardingTranslations.test.ts src/features/settings/branding/components/SchoolBrandingEditor.tsx src/features/settings/branding/pages/SettingsBrandingPage.tsx src/features/onboarding/components/SetupGuideContent.tsx src/features/settings/branding/__tests__/SchoolBrandingEditor.test.tsx src/features/onboarding/__tests__/OrganizationSetupStep.test.tsx
git commit -m "feat: localize school logo customizations"
```

### Task 4: Verify the completed editor

**Files:**
- Verify: all files changed in Tasks 1–3.

**Interfaces:**
- Consumes: final localized dialog, Canvas renderer, and branding integrations.
- Produces: verification evidence; no production interface change.

- [ ] **Step 1: Run the focused feature suite**

```bash
npx vitest run src/components/ui/school-logo-crop-dialog src/features/settings/branding src/features/onboarding/__tests__/OrganizationSetupStep.test.tsx src/messages/__tests__/onboardingTranslations.test.ts
```

Expected: PASS, including crop output, reset, accessibility, both entry points, and localization tests.

- [ ] **Step 2: Run type and lint checks**

```bash
npx tsc --noEmit --pretty false
npx eslint src/components/ui/school-logo-crop-dialog src/features/settings/branding/components/SchoolBrandingEditor.tsx src/features/settings/branding/pages/SettingsBrandingPage.tsx src/features/onboarding/components/SetupGuideContent.tsx
```

Expected: both commands exit with status 0.

- [ ] **Step 3: Run the production build**

Run: `npm run build`

Expected: exit status 0 after Next.js compilation, type checking, and route generation.

- [ ] **Step 4: Inspect the final diff before handoff**

```bash
git diff --check
git status --short
```

Expected: no whitespace errors; preserve unrelated user changes in the existing dirty worktree.
