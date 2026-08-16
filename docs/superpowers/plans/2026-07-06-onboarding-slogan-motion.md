# Onboarding Slogan and Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a friendly page slogan and accessible, restrained entrance and interaction animations to the standalone school onboarding experience.

**Architecture:** `SchoolOnboardingPage` will own the semantic hero and page-level stagger classes. `SetupGuide` will own its internal entrance sequence and remount the selected-step content wrapper when selection changes. Reusable keyframes and reduced-motion behavior will live in `src/app/globals.css`; no animation dependency will be added.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, Vitest, React Testing Library

---

### Task 1: Add the onboarding hero and page-level entrance sequence

**Files:**
- Modify: `src/features/onboarding/__tests__/SchoolOnboardingPage.test.tsx`
- Modify: `src/features/onboarding/pages/SchoolOnboardingPage.tsx`

- [ ] **Step 1: Write the failing hero test**

Add this test inside the existing `SchoolOnboardingPage` suite:

```tsx
it("renders the welcoming onboarding hero before the setup workflow", () => {
  render(<SchoolOnboardingPage />);

  const heading = screen.getByRole("heading", {
    level: 1,
    name: "Let’s get your school ready",
  });

  expect(heading).toBeVisible();
  expect(
    screen.getByText(
      "Complete the essential setup so every part of your school dashboard works smoothly.",
    ),
  ).toBeVisible();
  expect(heading.closest("header")).toHaveClass("onboarding-enter");
});
```

- [ ] **Step 2: Run the page test and verify it fails**

Run:

```bash
npx vitest run src/features/onboarding/__tests__/SchoolOnboardingPage.test.tsx
```

Expected: FAIL because the `h1` slogan does not exist.

- [ ] **Step 3: Add the hero and stagger the page sections**

In `SchoolOnboardingPage`, keep the existing skip logic unchanged and update the returned markup to this structure:

```tsx
return (
  <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
    <header className="onboarding-enter mx-auto mb-6 max-w-6xl text-center sm:mb-8">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
        School onboarding
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
        Let’s get your school ready
      </h1>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">
        Complete the essential setup so every part of your school dashboard works smoothly.
      </p>
    </header>

    <div className="onboarding-enter onboarding-enter-delay-1 mx-auto mb-4 flex max-w-6xl flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
      <p>Add academic years, terms, and academic structure before skipping.</p>
      <Button disabled={!canSkip} onClick={handleSkip} type="button" variant="outline">
        Skip setup
      </Button>
    </div>

    <div className="onboarding-enter onboarding-enter-delay-2">
      <SetupGuideContent result={result} title="School setup" />
    </div>
  </div>
);
```

- [ ] **Step 4: Run the page test and verify it passes**

Run:

```bash
npx vitest run src/features/onboarding/__tests__/SchoolOnboardingPage.test.tsx
```

Expected: all `SchoolOnboardingPage` tests PASS.

- [ ] **Step 5: Commit the hero change**

```bash
git add src/features/onboarding/pages/SchoolOnboardingPage.tsx src/features/onboarding/__tests__/SchoolOnboardingPage.test.tsx
git commit -m "feat: add onboarding welcome hero"
```

### Task 2: Animate the setup guide and selected-step transition

**Files:**
- Modify: `src/features/onboarding/__tests__/SetupGuide.test.tsx`
- Modify: `src/features/onboarding/components/SetupGuide.tsx`

- [ ] **Step 1: Write failing tests for setup animation hooks and content remount**

Extend the first `SetupGuide` test with these assertions:

```tsx
expect(screen.getByTestId("setup-guide-header")).toHaveClass("onboarding-enter");
expect(screen.getByTestId("setup-guide-progress")).toHaveClass("onboarding-enter-delay-1");
expect(screen.getByTestId("setup-guide-steps")).toHaveClass("onboarding-enter-delay-2");
expect(screen.getByTestId("setup-guide-panel")).toHaveClass("onboarding-enter-delay-3");
```

Add a separate remount test:

```tsx
it("remounts animated step content when the selected step changes", () => {
  const props = {
    copy,
    evaluation: makeEvaluation(),
    onSelectStep: vi.fn(),
    onRetryStep: vi.fn(),
    stepContent: Object.fromEntries(
      stepIds.map((id) => [id, <p key={id}>{id} panel</p>]),
    ) as never,
  };
  const { rerender } = render(
    <SetupGuide {...props} selectedStepId="academicContext" />,
  );
  const firstContent = screen.getByTestId("setup-guide-step-content");

  rerender(<SetupGuide {...props} selectedStepId="structure" />);

  expect(screen.getByTestId("setup-guide-step-content")).not.toBe(firstContent);
  expect(screen.getByText("structure panel")).toBeVisible();
});
```

- [ ] **Step 2: Run the setup guide test and verify it fails**

Run:

```bash
npx vitest run src/features/onboarding/__tests__/SetupGuide.test.tsx
```

Expected: FAIL because the animation test IDs and keyed content wrapper do not exist.

- [ ] **Step 3: Add internal animation hooks without changing setup behavior**

Apply these attributes and classes to the corresponding existing `SetupGuide` regions while preserving their children and the user's existing section container classes. The required opening elements are:

```tsx
<div className="onboarding-enter" data-testid="setup-guide-header">
</div>

<div
  className="onboarding-enter onboarding-enter-delay-1 min-w-40"
  data-testid="setup-guide-progress"
>
</div>

<div
  className="onboarding-enter onboarding-enter-delay-2 mt-5 grid grid-cols-1 gap-3 md:grid-cols-5"
  data-testid="setup-guide-steps"
>
</div>

<div
  className="onboarding-enter onboarding-enter-delay-3 mt-5 rounded-xl border border-gray-100 bg-gray-50 p-4"
  data-testid="setup-guide-panel"
>
  <div
    className="onboarding-step-content mt-4"
    data-testid="setup-guide-step-content"
    key={selectedStepId}
  >
    {stepContent[selectedStepId]}
  </div>
</div>
```

Update the progress fill to use a bounded ease-out transition:

```tsx
className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
```

Inside the step map, define cursor and hover behavior from the lock state:

```tsx
const interactionClasses = isLocked
  ? "cursor-not-allowed"
  : "cursor-pointer hover:border-primary/40 hover:bg-primary/[0.03] hover:shadow-sm";
```

Then update each step button to transition only paint properties, avoiding scale and layout movement:

```tsx
className={`rounded-xl border p-3 text-start transition-[border-color,background-color,box-shadow] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${interactionClasses} ${statusClasses(
  step.status,
  isSelected,
)}`}
```

- [ ] **Step 4: Run the setup guide tests and verify they pass**

Run:

```bash
npx vitest run src/features/onboarding/__tests__/SetupGuide.test.tsx
```

Expected: all `SetupGuide` tests PASS.

- [ ] **Step 5: Commit the setup guide animation hooks**

```bash
git add src/features/onboarding/components/SetupGuide.tsx src/features/onboarding/__tests__/SetupGuide.test.tsx
git commit -m "feat: animate onboarding setup guide"
```

### Task 3: Define accessible animation styles and verify the feature

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add keyframes scoped to users who allow motion**

Add the following near the existing motion media query in `src/app/globals.css`:

```css
@keyframes onboarding-enter {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes onboarding-step-content-enter {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: no-preference) {
  .onboarding-enter {
    animation: onboarding-enter 400ms ease-out both;
  }

  .onboarding-enter-delay-1 {
    animation-delay: 100ms;
  }

  .onboarding-enter-delay-2 {
    animation-delay: 180ms;
  }

  .onboarding-enter-delay-3 {
    animation-delay: 260ms;
  }

  .onboarding-step-content {
    animation: onboarding-step-content-enter 240ms ease-out both;
  }
}
```

Because animation declarations exist only under `prefers-reduced-motion: no-preference`, reduced-motion users receive the complete static UI without delayed or hidden content.

- [ ] **Step 2: Verify the reduced-motion CSS contract**

Run:

```bash
rg -n -A 30 "prefers-reduced-motion: no-preference" src/app/globals.css
```

Expected: the onboarding animation declarations appear inside the media query; no onboarding animation is declared outside it.

- [ ] **Step 3: Run focused onboarding tests**

Run:

```bash
npx vitest run src/features/onboarding 'src/app/[lang]/(onboarding)/__tests__/layout.test.tsx'
```

Expected: all onboarding tests PASS.

- [ ] **Step 4: Run static verification**

Run:

```bash
npm run typecheck
npm run lint -- src/features/onboarding 'src/app/[lang]/(onboarding)'
git diff --check
```

Expected: each command exits with code 0.

- [ ] **Step 5: Run the full test suite**

Run:

```bash
npx vitest run --reporter=dot
```

Expected: the full suite exits with code 0.

- [ ] **Step 6: Commit the animation styles**

```bash
git add src/app/globals.css
git commit -m "style: add accessible onboarding motion"
```
