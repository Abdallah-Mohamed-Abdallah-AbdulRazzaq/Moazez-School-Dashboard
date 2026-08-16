# Onboarding Localization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Translate the complete welcome and school setup experience through the existing English and Arabic `next-intl` message files.

**Architecture:** The top-level `onboarding` namespace will own all onboarding copy. Page components and `SetupGuideContent` will read that namespace; leaf setup-step components keep receiving typed copy props. The server layout will use `getTranslations`, while client components use `useTranslations`.

**Tech Stack:** Next.js App Router, React, TypeScript, next-intl 4.8.2, Vitest, React Testing Library

---

### Task 1: Expand and verify the onboarding message contract

**Files:**
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`
- Modify: `src/messages/__tests__/onboardingTranslations.test.ts`

- [ ] **Step 1: Add failing assertions for the expanded contract**

Extend the translation test with representative visible and interpolated messages:

```ts
it("contains complete localized onboarding copy", () => {
  expect(en.onboarding.welcome.title).toBe("Welcome to your school workspace");
  expect(ar.onboarding.welcome.title).toBe("مرحبًا بك في مساحة عمل مدرستك");
  expect(en.onboarding.setup.skip).toBe("Skip setup");
  expect(ar.onboarding.setup.skip).toBe("تخطي الإعداد");
  expect(en.onboarding.steps.organization.saveFailed).toBe("Could not save profile");
  expect(ar.onboarding.steps.organization.saveFailed).toBe("تعذر حفظ ملف المدرسة");
  expect(en.onboarding.guide.progressText).toContain("{completed}");
  expect(ar.onboarding.steps.academicContext.yearsCount).toContain("plural");
});
```

Keep the existing recursive key-parity assertion.

- [ ] **Step 2: Run the message test and verify RED**

Run:

```bash
npx vitest run src/messages/__tests__/onboardingTranslations.test.ts
```

Expected: FAIL because the nested welcome, setup, guide, and step keys do not exist.

- [ ] **Step 3: Replace the existing `onboarding` objects in both message files**

Use this English key structure and values:

```json
"onboarding": {
  "layout": { "label": "Onboarding setup" },
  "loading": { "preparing": "Preparing your setup…" },
  "errors": { "stepLoadFailed": "Could not load this setup step." },
  "welcome": {
    "eyebrow": "School onboarding",
    "title": "Welcome to your school workspace",
    "description": "Follow the guided setup to add the essential data your dashboard needs and avoid missing-data errors.",
    "start": "Start setup",
    "stages": {
      "organization": { "title": "Organization", "description": "Add your school profile and core details." },
      "academicContext": { "title": "Academic year and terms", "description": "Define the calendar used across academics." },
      "structure": { "title": "Academic structure", "description": "Create stages, grades, and sections." },
      "subjects": { "title": "Subjects and allocations", "description": "Connect subjects to grades and weekly hours." },
      "rooms": { "title": "Rooms", "description": "Add rooms used by schedules and assignments." }
    }
  },
  "setup": {
    "eyebrow": "School onboarding",
    "title": "Let’s get your school ready",
    "description": "Complete the essential setup so every part of your school dashboard works smoothly.",
    "skipRequirement": "Add academic years, terms, and academic structure before skipping.",
    "skip": "Skip setup",
    "guideTitle": "School setup"
  },
  "guide": {
    "cardTitle": "Quick school setup",
    "progressLabel": "Setup progress",
    "progressText": "{completed}/{total} complete ({percent}%)",
    "dismiss": "Dismiss setup guide",
    "retry": "Retry",
    "lockedPrefix": "Complete first",
    "statuses": {
      "complete": "Complete",
      "available": "Available",
      "locked": "Locked",
      "loading": "Loading",
      "error": "Needs attention"
    }
  },
  "steps": {
    "organization": {
      "title": "Organization", "description": "Add core school profile data.",
      "summary": "Complete the school profile used across the dashboard.",
      "schoolName": "School name", "shortName": "Short name", "timezone": "Timezone",
      "addressLine": "Address", "city": "City", "country": "Country",
      "save": "Save profile", "saving": "Saving", "required": "School name is required",
      "saveFailed": "Could not save profile"
    },
    "academicContext": {
      "title": "Academic year", "description": "Create the active year and term.",
      "summary": "Create the academic year and terms used by academic pages.",
      "yearsCount": "{count, plural, =0 {No academic years} one {# academic year} other {# academic years}}",
      "termsCount": "{count, plural, =0 {No terms} one {# term} other {# terms}}",
      "createYear": "Create academic year", "createTerm": "Create term"
    },
    "structure": {
      "title": "Structure", "description": "Create stage, grade, and section.",
      "summary": "Create the minimum academic structure chain.",
      "stageTitle": "Create stage", "gradeTitle": "Create grade", "sectionTitle": "Create section",
      "nameAr": "Arabic name", "nameEn": "English name", "save": "Create", "saving": "Creating",
      "required": "Both names are required", "saveFailed": "Could not create structure item",
      "complete": "Academic structure has the minimum required chain."
    },
    "subjects": {
      "title": "Subjects", "description": "Create subjects and grade allocations.",
      "summary": "Create subjects and allocate weekly hours to a grade.",
      "createSubject": "Create subject", "grade": "Grade", "subject": "Subject",
      "weeklyHours": "Weekly hours", "saveAllocation": "Save allocation", "saving": "Saving",
      "saveFailed": "Could not save allocation"
    },
    "rooms": {
      "title": "Rooms", "description": "Create the first room.",
      "summary": "Create rooms used by timetables and room assignments.",
      "createRoom": "Create room", "missingSchool": "No school selected",
      "saveFailed": "Could not create room"
    }
  }
}
```

Use this complete Arabic object with the exact same keys:

```json
"onboarding": {
  "layout": { "label": "إعداد المدرسة" },
  "loading": { "preparing": "جارٍ تجهيز الإعداد…" },
  "errors": { "stepLoadFailed": "تعذر تحميل خطوة الإعداد هذه." },
  "welcome": {
    "eyebrow": "إعداد المدرسة",
    "title": "مرحبًا بك في مساحة عمل مدرستك",
    "description": "اتبع خطوات الإعداد لإضافة البيانات الأساسية التي تحتاجها لوحة التحكم وتجنب أخطاء البيانات الناقصة.",
    "start": "بدء الإعداد",
    "stages": {
      "organization": { "title": "المؤسسة", "description": "أضف ملف المدرسة وبياناتها الأساسية." },
      "academicContext": { "title": "العام والفصول الدراسية", "description": "حدد التقويم المستخدم في الصفحات الأكاديمية." },
      "structure": { "title": "الهيكل الأكاديمي", "description": "أنشئ المراحل والصفوف والشُعب." },
      "subjects": { "title": "المواد والتوزيعات", "description": "اربط المواد بالصفوف والساعات الأسبوعية." },
      "rooms": { "title": "الغرف", "description": "أضف الغرف المستخدمة في الجداول والتوزيعات." }
    }
  },
  "setup": {
    "eyebrow": "إعداد المدرسة",
    "title": "لنجهز مدرستك",
    "description": "أكمل الإعدادات الأساسية حتى تعمل جميع أجزاء لوحة تحكم المدرسة بسلاسة.",
    "skipRequirement": "أضف العام والفصول الدراسية والهيكل الأكاديمي قبل التخطي.",
    "skip": "تخطي الإعداد",
    "guideTitle": "إعداد المدرسة"
  },
  "guide": {
    "cardTitle": "إعداد المدرسة السريع",
    "progressLabel": "تقدم الإعداد",
    "progressText": "اكتمل {completed} من {total} ({percent}٪)",
    "dismiss": "إخفاء دليل الإعداد",
    "retry": "إعادة المحاولة",
    "lockedPrefix": "أكمل أولًا",
    "statuses": {
      "complete": "مكتمل",
      "available": "متاح",
      "locked": "مقفل",
      "loading": "جارٍ التحميل",
      "error": "يحتاج إلى انتباه"
    }
  },
  "steps": {
    "organization": {
      "title": "المؤسسة", "description": "أضف بيانات ملف المدرسة الأساسية.",
      "summary": "أكمل ملف المدرسة المستخدم في لوحة التحكم.",
      "schoolName": "اسم المدرسة", "shortName": "الاسم المختصر", "timezone": "المنطقة الزمنية",
      "addressLine": "العنوان", "city": "المدينة", "country": "الدولة",
      "save": "حفظ الملف", "saving": "جارٍ الحفظ", "required": "اسم المدرسة مطلوب",
      "saveFailed": "تعذر حفظ ملف المدرسة"
    },
    "academicContext": {
      "title": "العام الدراسي", "description": "أنشئ العام والفصل الدراسي النشطين.",
      "summary": "أنشئ العام والفصول الدراسية المستخدمة في الصفحات الأكاديمية.",
      "yearsCount": "{count, plural, =0 {لا توجد أعوام دراسية} one {عام دراسي واحد} two {عامان دراسيان} few {# أعوام دراسية} many {# عامًا دراسيًا} other {# عام دراسي}}",
      "termsCount": "{count, plural, =0 {لا توجد فصول دراسية} one {فصل دراسي واحد} two {فصلان دراسيان} few {# فصول دراسية} many {# فصلًا دراسيًا} other {# فصل دراسي}}",
      "createYear": "إنشاء عام دراسي", "createTerm": "إنشاء فصل دراسي"
    },
    "structure": {
      "title": "الهيكل", "description": "أنشئ المرحلة والصف والشعبة.",
      "summary": "أنشئ الحد الأدنى المطلوب لسلسلة الهيكل الأكاديمي.",
      "stageTitle": "إنشاء مرحلة", "gradeTitle": "إنشاء صف", "sectionTitle": "إنشاء شعبة",
      "nameAr": "الاسم بالعربية", "nameEn": "الاسم بالإنجليزية", "save": "إنشاء", "saving": "جارٍ الإنشاء",
      "required": "الاسمان العربي والإنجليزي مطلوبان", "saveFailed": "تعذر إنشاء عنصر الهيكل",
      "complete": "يحتوي الهيكل الأكاديمي على الحد الأدنى المطلوب."
    },
    "subjects": {
      "title": "المواد", "description": "أنشئ المواد وتوزيعات الصفوف.",
      "summary": "أنشئ المواد وخصص الساعات الأسبوعية لكل صف.",
      "createSubject": "إنشاء مادة", "grade": "الصف", "subject": "المادة",
      "weeklyHours": "الساعات الأسبوعية", "saveAllocation": "حفظ التوزيع", "saving": "جارٍ الحفظ",
      "saveFailed": "تعذر حفظ التوزيع"
    },
    "rooms": {
      "title": "الغرف", "description": "أنشئ أول غرفة.",
      "summary": "أنشئ الغرف المستخدمة في الجداول وتوزيعات الغرف.",
      "createRoom": "إنشاء غرفة", "missingSchool": "لم يتم تحديد مدرسة",
      "saveFailed": "تعذر إنشاء الغرفة"
    }
  }
}
```

- [ ] **Step 4: Run the message test and verify GREEN**

Run:

```bash
npx vitest run src/messages/__tests__/onboardingTranslations.test.ts
```

Expected: all onboarding message tests PASS, including key parity.

- [ ] **Step 5: Commit the message contract**

```bash
git add src/messages/en.json src/messages/ar.json src/messages/__tests__/onboardingTranslations.test.ts
git commit -m "feat: add complete onboarding translations"
```

### Task 2: Localize the welcome and setup page shells

**Files:**
- Modify: `src/features/onboarding/pages/OnboardingWelcomePage.tsx`
- Modify: `src/features/onboarding/pages/SchoolOnboardingPage.tsx`
- Modify: `src/features/onboarding/__tests__/OnboardingWelcomePage.test.tsx`
- Modify: `src/features/onboarding/__tests__/SchoolOnboardingPage.test.tsx`

- [ ] **Step 1: Add translation mocks and convert visible assertions to keys**

In both page test files, add:

```ts
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));
```

Assert translation keys instead of English literals. Representative assertions:

```tsx
expect(screen.getByRole("heading", { name: "welcome.title" })).toBeVisible();
expect(screen.getByText("welcome.stages.organization.title")).toBeVisible();
await user.click(screen.getByRole("button", { name: "welcome.start" }));
```

```tsx
expect(screen.getByRole("heading", { name: "setup.title" })).toBeVisible();
expect(screen.getByText("setup.skipRequirement")).toBeVisible();
expect(screen.getByRole("button", { name: "setup.skip" })).toBeDisabled();
```

- [ ] **Step 2: Run both page tests and verify RED**

Run:

```bash
npx vitest run src/features/onboarding/__tests__/OnboardingWelcomePage.test.tsx src/features/onboarding/__tests__/SchoolOnboardingPage.test.tsx
```

Expected: FAIL because both pages still render hardcoded English.

- [ ] **Step 3: Wire both pages to `useTranslations`**

In each page:

```tsx
import { useTranslations } from "next-intl";

const t = useTranslations("onboarding");
```

Replace every visible literal with its message key. Build welcome stages from translation keys inside the component so locale changes produce new values:

```tsx
const welcomeStages = [
  { id: "organization", icon: Building2 },
  { id: "academicContext", icon: CalendarRange },
  { id: "structure", icon: Network },
  { id: "subjects", icon: BookOpen },
  { id: "rooms", icon: DoorOpen },
] as const;
```

Render stage text with:

```tsx
{t(`welcome.stages.${id}.title`)}
{t(`welcome.stages.${id}.description`)}
```

Use `t("loading.preparing")`, all `welcome.*` keys, all `setup.*` keys, and pass `title={t("setup.guideTitle")}` to `SetupGuideContent`. Preserve the current white-background classes and navigation paths.

- [ ] **Step 4: Run both page tests and verify GREEN**

Run the same two-file Vitest command. Expected: all page tests PASS.

- [ ] **Step 5: Commit the localized pages**

```bash
git add src/features/onboarding/pages/OnboardingWelcomePage.tsx src/features/onboarding/pages/SchoolOnboardingPage.tsx src/features/onboarding/__tests__/OnboardingWelcomePage.test.tsx src/features/onboarding/__tests__/SchoolOnboardingPage.test.tsx
git commit -m "feat: localize onboarding pages"
```

### Task 3: Localize the setup guide, steps, and dashboard card

**Files:**
- Modify: `src/features/onboarding/components/SetupGuideContent.tsx`
- Modify: `src/features/onboarding/components/SetupGuide.tsx`
- Modify: `src/features/onboarding/components/SetupGuideCard.tsx`
- Modify: `src/features/onboarding/__tests__/SetupGuide.test.tsx`
- Modify: `src/features/onboarding/__tests__/SetupGuideCard.test.tsx`

- [ ] **Step 1: Add failing translation-boundary tests**

Mock `useTranslations` in `SetupGuideCard.test.tsx` with `(key) => key`, then expect `guide.cardTitle` and `guide.dismiss` instead of English labels.

Extend `SetupGuideCopy` test fixtures with:

```ts
stepError: "Localized load failure",
```

For an error-status selected step, assert `Localized load failure` is visible and the raw `selectedStep.error` string is not rendered.

- [ ] **Step 2: Run guide tests and verify RED**

Run:

```bash
npx vitest run src/features/onboarding/__tests__/SetupGuide.test.tsx src/features/onboarding/__tests__/SetupGuideCard.test.tsx
```

Expected: FAIL because the card and guide still use hardcoded/default English and `SetupGuideCopy` has no `stepError`.

- [ ] **Step 3: Build all copy from `useTranslations`**

In `SetupGuideContent`, import `useTranslations`, remove `defaultSetupGuideCopy` and all module-level English copy objects, and create translated objects in the component:

```tsx
const t = useTranslations("onboarding");
const copy: SetupGuideCopy = {
  title: title ?? t("guide.cardTitle"),
  progressLabel: t("guide.progressLabel"),
  progressText: (completed, total, percent) =>
    t("guide.progressText", { completed, total, percent }),
  retry: t("guide.retry"),
  lockedPrefix: t("guide.lockedPrefix"),
  stepError: t("errors.stepLoadFailed"),
  statuses: {
    complete: t("guide.statuses.complete"),
    available: t("guide.statuses.available"),
    locked: t("guide.statuses.locked"),
    loading: t("guide.statuses.loading"),
    error: t("guide.statuses.error"),
  },
  steps: {
    organization: { title: t("steps.organization.title"), description: t("steps.organization.description") },
    academicContext: { title: t("steps.academicContext.title"), description: t("steps.academicContext.description") },
    structure: { title: t("steps.structure.title"), description: t("steps.structure.description") },
    subjects: { title: t("steps.subjects.title"), description: t("steps.subjects.description") },
    rooms: { title: t("steps.rooms.title"), description: t("steps.rooms.description") },
  },
};
```

Import the five exported `*SetupStepCopy` types and define the helper boundary explicitly:

```tsx
interface SetupStepCopies {
  organization: OrganizationSetupStepCopy;
  academicContext: AcademicContextSetupStepCopy;
  structure: AcademicStructureSetupStepCopy;
  subjects: SubjectsSetupStepCopy;
  rooms: RoomsSetupStepCopy;
}
```

Change `createStepContent` to accept `(result: UseSetupStatusResult, snapshot: SetupSnapshot, stepCopies: SetupStepCopies)`. Keep its existing resource selection and JSX, replacing each module constant with the matching `stepCopies` property. Build each leaf-step copy from its matching `steps.*` keys and pass the bundle to `createStepContent`. For count callbacks use:

```tsx
yearsCount: (count) => t("steps.academicContext.yearsCount", { count }),
termsCount: (count) => t("steps.academicContext.termsCount", { count }),
```

Pass these translated objects into `createStepContent`; change that helper signature to accept one typed copy bundle instead of reading module constants.

Add `stepError` to `SetupGuideCopy` and render it for error status:

```tsx
{selectedStep.status === "error" ? (
  <p className="mt-2 text-sm text-red-700">{copy.stepError}</p>
) : null}
```

In `SetupGuideCard`, use `useTranslations("onboarding")` and set `aria-label={t("guide.dismiss")}`.

- [ ] **Step 4: Run all onboarding component tests**

Run:

```bash
npx vitest run src/features/onboarding
```

Expected: all onboarding tests PASS.

- [ ] **Step 5: Commit guide localization**

```bash
git add src/features/onboarding/components/SetupGuideContent.tsx src/features/onboarding/components/SetupGuide.tsx src/features/onboarding/components/SetupGuideCard.tsx src/features/onboarding/__tests__/SetupGuide.test.tsx src/features/onboarding/__tests__/SetupGuideCard.test.tsx
git commit -m "feat: localize onboarding setup guide"
```

### Task 4: Localize the standalone layout and verify the complete feature

**Files:**
- Modify: `src/app/[lang]/(onboarding)/layout.tsx`
- Modify: `src/app/[lang]/(onboarding)/__tests__/layout.test.tsx`

- [ ] **Step 1: Make the layout test expect a translated accessible label**

Mock the installed server API and await the async layout:

```tsx
vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async () => (key: string) => key),
}));

it("renders onboarding content with a localized standalone main label", async () => {
  render(await OnboardingLayout({ children: <div>Onboarding setup content</div> }));
  expect(screen.getByRole("main", { name: "layout.label" })).toContainElement(
    screen.getByText("Onboarding setup content"),
  );
});
```

- [ ] **Step 2: Run the layout test and verify RED**

Run:

```bash
npx vitest run 'src/app/[lang]/(onboarding)/__tests__/layout.test.tsx'
```

Expected: FAIL because the layout label is still hardcoded.

- [ ] **Step 3: Localize the server layout**

```tsx
import { getTranslations } from "next-intl/server";
import { ToastProvider } from "@/components/ui/toast/Toast";

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("onboarding");

  return (
    <ToastProvider>
      <main aria-label={t("layout.label")} className="min-h-screen bg-gray-50">
        {children}
      </main>
    </ToastProvider>
  );
}
```

- [ ] **Step 4: Run focused and static verification**

```bash
npx vitest run src/features/onboarding src/messages/__tests__/onboardingTranslations.test.ts 'src/app/[lang]/(onboarding)/__tests__'
npm run typecheck
npm run lint -- src/features/onboarding src/messages/__tests__/onboardingTranslations.test.ts 'src/app/[lang]/(onboarding)'
git diff --check
```

Expected: all commands exit with code 0.

- [ ] **Step 5: Run the full test suite**

```bash
npx vitest run --reporter=dot
```

Expected: exit code 0.

- [ ] **Step 6: Commit the layout localization**

```bash
git add 'src/app/[lang]/(onboarding)/layout.tsx' 'src/app/[lang]/(onboarding)/__tests__/layout.test.tsx'
git commit -m "feat: localize onboarding layout"
```
