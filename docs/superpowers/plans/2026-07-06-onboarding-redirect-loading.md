# Onboarding Redirect Loading Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent dashboard content from flashing before an incomplete school is redirected to onboarding.

**Architecture:** Keep onboarding eligibility and navigation inside the existing `OnboardingRedirectGuard`. Derive one redirect-pending condition from the loaded snapshot, school identity, completion state, route, and session skip state; render the shared `MainLoader` while either loading eligibility or waiting for that redirect.

**Tech Stack:** React 19, Next.js 16 App Router, TypeScript, Vitest, Testing Library

---

## File Structure

- Modify `src/features/onboarding/components/OnboardingRedirectGuard.tsx`: derive the pending state, preserve the existing redirect effect, and gate dashboard children with `MainLoader`.
- Modify `src/features/onboarding/__tests__/OnboardingRedirectGuard.test.tsx`: verify loading, redirect-pending, complete, skipped, and exempt-route rendering behavior.

### Task 1: Gate Dashboard Rendering on Onboarding Status

**Files:**
- Modify: `src/features/onboarding/components/OnboardingRedirectGuard.tsx`
- Test: `src/features/onboarding/__tests__/OnboardingRedirectGuard.test.tsx`

- [ ] **Step 1: Add failing loading and redirect-pending tests**

Mock the shared loader near the existing module mocks:

```tsx
vi.mock("@/components/ui/loaders/MainLoader", () => ({
  default: () => <div data-testid="main-loader">Loading</div>,
}));
```

Extend `mockStatus` so a caller can provide a snapshot:

```tsx
function mockStatus(overrides?: {
  isComplete?: boolean;
  schoolId?: string;
  snapshot?: SetupSnapshot;
}) {
  hookMock.useSetupStatus.mockReturnValue({
    snapshot: overrides?.snapshot ?? snapshot,
    evaluation: evaluation(overrides?.isComplete ?? false),
    selectedYear: null,
    selectedTerm: null,
    schoolId: overrides?.schoolId ?? "school-1",
    refreshStep: vi.fn(),
    retryStep: vi.fn(),
  });
}
```

Add a loading snapshot and tests that assert children are absent until the routing decision is safe:

```tsx
const loadingSnapshot = {
  ...snapshot,
  organization: { status: "loading" },
} as unknown as SetupSnapshot;

it("shows the main loader instead of dashboard content while setup status loads", () => {
  mockStatus({ snapshot: loadingSnapshot });

  const { queryByText, getByTestId } = render(
    <OnboardingRedirectGuard>
      <div>Dashboard content</div>
    </OnboardingRedirectGuard>,
  );

  expect(getByTestId("main-loader")).toBeInTheDocument();
  expect(queryByText("Dashboard content")).not.toBeInTheDocument();
  expect(navigationMock.replace).not.toHaveBeenCalled();
});

it("keeps dashboard content hidden while redirecting incomplete setup", async () => {
  const { queryByText, getByTestId } = render(
    <OnboardingRedirectGuard>
      <div>Dashboard content</div>
    </OnboardingRedirectGuard>,
  );

  expect(getByTestId("main-loader")).toBeInTheDocument();
  expect(queryByText("Dashboard content")).not.toBeInTheDocument();
  await waitFor(() => {
    expect(navigationMock.replace).toHaveBeenCalledWith("/en/settings/onboarding");
  });
});
```

Add child-rendering assertions to the existing complete, skipped, and onboarding-route tests:

```tsx
expect(screen.getByText("Dashboard content")).toBeInTheDocument();
expect(screen.queryByTestId("main-loader")).not.toBeInTheDocument();
```

Use `Onboarding content` for the onboarding-route assertion.

- [ ] **Step 2: Run the focused tests and verify the new cases fail**

Run:

```bash
npm run test:run -- src/features/onboarding/__tests__/OnboardingRedirectGuard.test.tsx
```

Expected: the new tests fail because dashboard children are currently rendered and `MainLoader` is not rendered.

- [ ] **Step 3: Implement the minimal guard-level pending state**

Import the existing loader:

```tsx
import MainLoader from "@/components/ui/loaders/MainLoader";
```

Inside `OnboardingRedirectGuard`, derive stable decision flags before the effect:

```tsx
const isSnapshotLoading = isSetupSnapshotLoading(snapshot);
const onboardingPath = isOnboardingPath(pathname);
const skipped = schoolId ? hasSkippedOnboarding(schoolId) : false;
const shouldRedirect = Boolean(
  schoolId &&
    !evaluation.isComplete &&
    !onboardingPath &&
    !isSnapshotLoading &&
    !skipped,
);
```

Make the effect perform navigation only when `shouldRedirect` is true:

```tsx
useEffect(() => {
  if (!shouldRedirect) return;

  router.replace(`/${localeFromPathname(pathname)}/settings/onboarding`);
}, [pathname, router, shouldRedirect]);
```

Gate children after the effect:

```tsx
if (isSnapshotLoading || shouldRedirect) {
  return <MainLoader />;
}

return <>{children}</>;
```

- [ ] **Step 4: Run the focused tests and verify they pass**

Run:

```bash
npm run test:run -- src/features/onboarding/__tests__/OnboardingRedirectGuard.test.tsx
```

Expected: all `OnboardingRedirectGuard` tests pass, including the loader and child-visibility assertions.

- [ ] **Step 5: Run static verification**

Run:

```bash
npm run typecheck
npm run lint -- src/features/onboarding/components/OnboardingRedirectGuard.tsx src/features/onboarding/__tests__/OnboardingRedirectGuard.test.tsx
```

Expected: both commands exit successfully with no new TypeScript or ESLint errors.

- [ ] **Step 6: Commit the implementation**

```bash
git add src/features/onboarding/components/OnboardingRedirectGuard.tsx src/features/onboarding/__tests__/OnboardingRedirectGuard.test.tsx
git commit -m "fix: prevent dashboard flash before onboarding"
```
