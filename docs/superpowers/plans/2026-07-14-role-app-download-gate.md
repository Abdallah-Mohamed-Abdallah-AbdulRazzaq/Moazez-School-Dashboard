# Role App Download Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dashboard with a modern, role-specific mobile-app download screen for Student, Teacher, Parent, and Dismissal Staff accounts.

**Architecture:** A pure helper maps an authenticated `MeResponse` to an app-only audience. A client gate in the shared dashboard layout uses it to render either the existing dashboard subtree or a localized download screen.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, next-intl, Vitest, Testing Library, lucide-react.

## Global Constraints

- Match exactly `STUDENT`, `TEACHER`, and `PARENT`; never add `PAREN`.
- Accept active membership keys `dismissal_staff` and `DISMISSAL_STAFF` for Dismissal Staff.
- Matched users must not mount dashboard children, navigation, or onboarding.
- Temporary Android and iOS URLs are separate per audience and easy to replace.
- Support Arabic/English and RTL/LTR; provide logout.
- Do not add deep links, QR codes, analytics, or permission changes.

---

## File structure

- Create `src/features/app-download/utils/appDownloadAudience.ts`: audience matcher and store configuration.
- Create `src/features/app-download/utils/__tests__/appDownloadAudience.test.ts`: pure matcher coverage.
- Create `src/features/app-download/components/AppDownloadScreen.tsx`: presentational, localized app-download UI.
- Create `src/features/app-download/components/AppDownloadGate.tsx`: auth-aware dashboard boundary.
- Create `src/features/app-download/components/__tests__/AppDownloadScreen.test.tsx`: UI behavior tests.
- Create `src/features/app-download/components/__tests__/AppDownloadGate.test.tsx`: boundary tests.
- Modify `src/app/[lang]/(dashboard)/layout.tsx`: install gate before providers/chrome.
- Modify `src/messages/en.json` and `src/messages/ar.json`: localization namespace.

### Task 1: Define the audience contract

**Files:**
- Create: `src/features/app-download/utils/appDownloadAudience.ts`
- Test: `src/features/app-download/utils/__tests__/appDownloadAudience.test.ts`

**Interfaces:**
- Produces: `type AppDownloadAudience = "student" | "teacher" | "parent" | "dismissalStaff"`.
- Produces: `getAppDownloadAudience(user: Pick<MeResponse, "userType" | "activeMembership"> | null | undefined): AppDownloadAudience | null`.
- Produces: `APP_DOWNLOAD_CONFIG`, a `Record<AppDownloadAudience, { translationKey; androidUrl; iosUrl; icon }>`.

- [ ] **Step 1: Write failing tests for all audience cases**

```ts
it.each([
  ["STUDENT", "school.admin", "student"],
  ["TEACHER", "school.admin", "teacher"],
  ["PARENT", "school.admin", "parent"],
  ["SCHOOL_USER", "dismissal_staff", "dismissalStaff"],
  ["SCHOOL_USER", "DISMISSAL_STAFF", "dismissalStaff"],
])("maps %s / %s", (userType, roleKey, audience) => {
  expect(getAppDownloadAudience({ userType, activeMembership: { roleKey } } as never)).toBe(audience);
});

it("returns null for a school admin", () => {
  expect(getAppDownloadAudience({ userType: "SCHOOL_USER", activeMembership: { roleKey: "school.admin" } } as never)).toBeNull();
});
```

- [ ] **Step 2: Confirm the test fails**

Run: `npm run test:run -- src/features/app-download/utils/__tests__/appDownloadAudience.test.ts`  
Expected: FAIL because the module does not exist.

- [ ] **Step 3: Add the minimal matcher and configuration**

```ts
export type AppDownloadAudience = "student" | "teacher" | "parent" | "dismissalStaff";

export function getAppDownloadAudience(user: Pick<MeResponse, "userType" | "activeMembership"> | null | undefined): AppDownloadAudience | null {
  if (!user) return null;
  if (user.userType === "STUDENT") return "student";
  if (user.userType === "TEACHER") return "teacher";
  if (user.userType === "PARENT") return "parent";
  const key = user.activeMembership?.roleKey;
  return key === "dismissal_staff" || key === "DISMISSAL_STAFF" ? "dismissalStaff" : null;
}
```

Define configuration URLs as `https://example.com/apps/<audience>/android` and `/ios`; use `graduation-cap`, `book-open`, `heart-handshake`, and `shield-check` icon identifiers.

- [ ] **Step 4: Verify and commit**

Run: `npm run test:run -- src/features/app-download/utils/__tests__/appDownloadAudience.test.ts`  
Expected: PASS.

```bash
git add src/features/app-download/utils
git commit -m "feat: classify app-only dashboard users"
```

### Task 2: Build the localized download screen

**Files:**
- Create: `src/features/app-download/components/AppDownloadScreen.tsx`
- Create: `src/features/app-download/components/__tests__/AppDownloadScreen.test.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`

**Interfaces:**
- Consumes: `AppDownloadAudience`, `APP_DOWNLOAD_CONFIG`, `useAuth().logout`, `useLocale`, and `useTranslations("app_download")`.
- Produces: `AppDownloadScreen({ audience }: { audience: AppDownloadAudience }): React.ReactElement`.

- [ ] **Step 1: Write failing screen tests**

```tsx
it("renders role copy and safe Android/iOS store links", () => {
  render(<AppDownloadScreen audience="student" />);
  expect(screen.getByRole("heading", { name: "Student App" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Android/i })).toHaveAttribute("target", "_blank");
  expect(screen.getByRole("link", { name: /App Store/i })).toHaveAttribute("rel", expect.stringContaining("noopener"));
});

it("calls logout", async () => {
  render(<AppDownloadScreen audience="teacher" />);
  await userEvent.click(screen.getByRole("button", { name: /Log out/i }));
  expect(logout).toHaveBeenCalledOnce();
});
```

- [ ] **Step 2: Confirm the test fails**

Run: `npm run test:run -- src/features/app-download/components/__tests__/AppDownloadScreen.test.tsx`  
Expected: FAIL because the component does not exist.

- [ ] **Step 3: Add equal `app_download` translations**

Add `eyebrow`, `title`, `description`, `android`, `ios`, `logout`, `student`, `teacher`, `parent`, `dismissal_staff` to both locale JSON files. Arabic role labels are `تطبيق الطالب`، `تطبيق المعلم`، `تطبيق ولي الأمر`، `تطبيق موظف الانصراف`; English labels are their direct equivalents.

- [ ] **Step 4: Implement the screen**

```tsx
"use client";

export function AppDownloadScreen({ audience }: { audience: AppDownloadAudience }) {
  const t = useTranslations("app_download");
  const locale = useLocale();
  const { logout } = useAuth();
  const config = APP_DOWNLOAD_CONFIG[audience];
  const storeCtas = [
    ["android", config.androidUrl, t("android")],
    ["ios", config.iosUrl, t("ios")],
  ].map(([platform, url, label]) =>
    url ? <a key={platform} href={url} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white">{label}</a> :
      <button key={platform} type="button" disabled className="rounded-xl bg-slate-200 px-4 py-3 font-semibold text-slate-500">{label}</button>,
  );

  return (
    <main dir={locale === "ar" ? "rtl" : "ltr"} className="grid min-h-screen place-items-center bg-gradient-to-br from-sky-50 via-white to-violet-100 px-4 py-8">
      <section aria-labelledby="app-download-title" className="w-full max-w-lg rounded-3xl border border-white/70 bg-white/90 p-8 text-center shadow-2xl backdrop-blur sm:p-12">
        <Smartphone aria-hidden="true" className="mx-auto mb-5 size-12 text-primary" />
        <p className="text-sm font-semibold text-primary">{t("eyebrow")}</p>
        <h1 id="app-download-title" className="mt-2 text-3xl font-bold text-slate-900">{t("title", { appName: t(config.translationKey) })}</h1>
        <p className="mt-3 text-slate-600">{t("description", { appName: t(config.translationKey) })}</p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">{storeCtas}</div>
        <button type="button" onClick={() => void logout()} className="mt-6 text-sm font-medium text-slate-600 underline">{t("logout")}</button>
      </section>
    </main>
  );
}
```

Use lucide role icons and `Smartphone`/`LogOut`. Render `a` only for non-null URLs, with `target="_blank" rel="noopener noreferrer"`; render a disabled button with the same accessible label when a URL is null.

- [ ] **Step 5: Verify and commit**

Run: `npm run test:run -- src/features/app-download/components/__tests__/AppDownloadScreen.test.tsx && npm run lint -- src/features/app-download/components/AppDownloadScreen.tsx`  
Expected: PASS.

```bash
git add src/features/app-download/components/AppDownloadScreen.tsx src/features/app-download/components/__tests__/AppDownloadScreen.test.tsx src/messages/en.json src/messages/ar.json
git commit -m "feat: add localized app download screen"
```

### Task 3: Gate the dashboard shell

**Files:**
- Create: `src/features/app-download/components/AppDownloadGate.tsx`
- Create: `src/features/app-download/components/__tests__/AppDownloadGate.test.tsx`
- Modify: `src/app/[lang]/(dashboard)/layout.tsx`

**Interfaces:**
- Consumes: `useAuth`, `getAppDownloadAudience`, `AppDownloadScreen`, and existing `MainLoader`.
- Produces: `AppDownloadGate({ children }: { children: React.ReactNode }): React.ReactElement`.

- [ ] **Step 1: Write failing gate tests**

```tsx
it("replaces dashboard children for a parent", () => {
  mockUseAuth({ isLoading: false, user: makeUser("PARENT") });
  render(<AppDownloadGate><div>Dashboard content</div></AppDownloadGate>);
  expect(screen.getByRole("heading", { name: /Parent App/i })).toBeInTheDocument();
  expect(screen.queryByText("Dashboard content")).not.toBeInTheDocument();
});

it("passes dashboard content through for a school admin", () => {
  mockUseAuth({ isLoading: false, user: makeUser("SCHOOL_USER", "school.admin") });
  render(<AppDownloadGate><div>Dashboard content</div></AppDownloadGate>);
  expect(screen.getByText("Dashboard content")).toBeInTheDocument();
});
```

- [ ] **Step 2: Confirm the test fails**

Run: `npm run test:run -- src/features/app-download/components/__tests__/AppDownloadGate.test.tsx`  
Expected: FAIL because `AppDownloadGate` does not exist.

- [ ] **Step 3: Implement the auth boundary**

```tsx
"use client";

export function AppDownloadGate({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <MainLoader />;
  const audience = getAppDownloadAudience(user);
  return audience ? <AppDownloadScreen audience={audience} /> : <>{children}</>;
}
```

- [ ] **Step 4: Install the gate before onboarding/chrome**

Replace the existing direct child of `AuthReadyGate` in the dashboard layout with:

```tsx
<AppDownloadGate>
  <SetupStatusProvider>
    <OnboardingRedirectGuard>
      <SideBarTopNav>{children}</SideBarTopNav>
    </OnboardingRedirectGuard>
  </SetupStatusProvider>
</AppDownloadGate>
```

- [ ] **Step 5: Verify and commit**

Run: `npm run test:run -- src/features/app-download/components/__tests__/AppDownloadGate.test.tsx src/features/auth/components/__tests__/AuthReadyGate.test.tsx && npm run typecheck`  
Expected: PASS with zero TypeScript errors.

```bash
git add src/features/app-download/components/AppDownloadGate.tsx src/features/app-download/components/__tests__/AppDownloadGate.test.tsx src/app/[lang]/(dashboard)/layout.tsx
git commit -m "feat: gate dashboard for mobile app users"
```

### Task 4: Final verification

**Files:** Verify only.

- [ ] **Step 1: Run feature tests**

Run: `npm run test:run -- src/features/app-download`  
Expected: PASS for matcher, screen, and gate tests.

- [ ] **Step 2: Run repository safeguards**

Run: `npm run typecheck && npm run lint`  
Expected: both commands exit `0`.

- [ ] **Step 3: Check diff hygiene**

Run: `git diff --check HEAD~3..HEAD && git status --short`  
Expected: no whitespace errors; only pre-existing unrelated Grades changes, if any, remain uncommitted.

## Self-review

- Spec coverage: tasks cover every audience, temporary platform links, bilingual RTL/LTR display, disabled missing links, logout, loading safety, full dashboard replacement, and non-target pass-through.
- Placeholder scan: there are no `TBD` or deferred work markers.
- Type consistency: the Task 1 audience contract is the sole configuration and matcher API used by Tasks 2 and 3.
