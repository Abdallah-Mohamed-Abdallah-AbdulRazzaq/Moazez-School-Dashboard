# Onboarding Welcome Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a standalone welcome page that introduces the five setup stages before users proceed to the existing school onboarding workflow.

**Architecture:** The root onboarding route will render a new client page and the existing workflow will move to a nested `/setup` route. The welcome page will reuse `useSetupStatus`, a shared snapshot-loading predicate, and the current CSS motion utilities. Existing dashboard redirect and skip behavior remain unchanged.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, Lucide React, Vitest, React Testing Library

---

### Task 1: Share setup snapshot loading state

**Files:**
- Modify: `src/features/onboarding/utils/setupStatus.ts`
- Modify: `src/features/onboarding/components/OnboardingRedirectGuard.tsx`
- Modify: `src/features/onboarding/__tests__/setupStatus.test.ts`

- [ ] **Step 1: Write a failing loading-state test**

Update the utility import and add the test:

```tsx
import { evaluateSetup, isSetupSnapshotLoading } from "../utils/setupStatus";

it("reports loading while any setup resource is loading", () => {
  expect(
    isSetupSnapshotLoading({
      ...emptySnapshot,
      rooms: { status: "loading", data: [] },
    }),
  ).toBe(true);
  expect(isSetupSnapshotLoading(emptySnapshot)).toBe(false);
});
```

- [ ] **Step 2: Run the utility test and verify RED**

Run:

```bash
npx vitest run src/features/onboarding/__tests__/setupStatus.test.ts
```

Expected: FAIL because `isSetupSnapshotLoading` is not exported.

- [ ] **Step 3: Implement the shared predicate and reuse it in the guard**

Add to `setupStatus.ts`:

```tsx
export function isSetupSnapshotLoading(snapshot: SetupSnapshot) {
  return Object.values(snapshot).some((resource) => resource.status === "loading");
}
```

In `OnboardingRedirectGuard.tsx`, remove the private `isSnapshotLoading` function, import the shared predicate, and replace its call:

```tsx
import { isSetupSnapshotLoading } from "../utils/setupStatus";
```

Also remove the now-unused `SetupSnapshot` type import from the guard.

```tsx
if (isSetupSnapshotLoading(snapshot) || hasSkippedOnboarding(schoolId)) {
  return;
}
```

- [ ] **Step 4: Run utility and guard tests and verify GREEN**

Run:

```bash
npx vitest run src/features/onboarding/__tests__/setupStatus.test.ts src/features/onboarding/__tests__/OnboardingRedirectGuard.test.tsx
```

Expected: both files PASS.

- [ ] **Step 5: Commit the shared state rule**

```bash
git add src/features/onboarding/utils/setupStatus.ts src/features/onboarding/components/OnboardingRedirectGuard.tsx src/features/onboarding/__tests__/setupStatus.test.ts
git commit -m "refactor: share onboarding loading state"
```

### Task 2: Build the welcome page

**Files:**
- Create: `src/features/onboarding/pages/OnboardingWelcomePage.tsx`
- Create: `src/features/onboarding/__tests__/OnboardingWelcomePage.test.tsx`
- Modify: `src/app/[lang]/(onboarding)/layout.tsx`

- [ ] **Step 1: Write failing welcome-page behavior tests**

Create `OnboardingWelcomePage.test.tsx` with incomplete, loading, navigation, and completion scenarios:

```tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import OnboardingWelcomePage from "../pages/OnboardingWelcomePage";
import type { SetupEvaluation, SetupSnapshot } from "../types";

const hookMock = vi.hoisted(() => ({ useSetupStatus: vi.fn() }));
const navigationMock = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));

vi.mock("../hooks/useSetupStatus", () => ({
  useSetupStatus: hookMock.useSetupStatus,
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ lang: "en" }),
  useRouter: () => navigationMock,
}));

const snapshot = {
  organization: { status: "success", data: null },
  academicContext: { status: "success", data: { years: [], termsByYear: {} } },
  structure: {
    status: "success",
    data: { stages: [], grades: [], sections: [], classrooms: [] },
  },
  subjects: { status: "success", data: { subjects: [], allocations: [] } },
  rooms: { status: "success", data: [] },
} as unknown as SetupSnapshot;

function evaluation(isComplete: boolean): SetupEvaluation {
  return {
    completedCount: isComplete ? 5 : 0,
    totalCount: 5,
    progressPercent: isComplete ? 100 : 0,
    isComplete,
    steps: {
      organization: { id: "organization", status: "available", isComplete: false, lockedBy: [] },
      academicContext: { id: "academicContext", status: "locked", isComplete: false, lockedBy: ["organization"] },
      structure: { id: "structure", status: "locked", isComplete: false, lockedBy: ["academicContext"] },
      subjects: { id: "subjects", status: "locked", isComplete: false, lockedBy: ["structure"] },
      rooms: { id: "rooms", status: "locked", isComplete: false, lockedBy: ["subjects"] },
    },
  };
}

function mockStatus(currentSnapshot = snapshot, isComplete = false) {
  hookMock.useSetupStatus.mockReturnValue({
    snapshot: currentSnapshot,
    evaluation: evaluation(isComplete),
    selectedYear: null,
    selectedTerm: null,
    schoolId: "school-1",
    refreshStep: vi.fn(),
    retryStep: vi.fn(),
  });
}

describe("OnboardingWelcomePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStatus();
  });

  it("introduces all setup stages when setup is incomplete", () => {
    render(<OnboardingWelcomePage />);

    expect(screen.getByRole("heading", { name: "Welcome to your school workspace" })).toBeVisible();
    expect(screen.getByText("Organization")).toBeVisible();
    expect(screen.getByText("Academic year and terms")).toBeVisible();
    expect(screen.getByText("Academic structure")).toBeVisible();
    expect(screen.getByText("Subjects and allocations")).toBeVisible();
    expect(screen.getByText("Rooms")).toBeVisible();
  });

  it("opens the localized setup workflow", async () => {
    const user = userEvent.setup();
    render(<OnboardingWelcomePage />);

    await user.click(screen.getByRole("button", { name: "Start setup" }));

    expect(navigationMock.push).toHaveBeenCalledWith("/en/settings/onboarding/setup");
  });

  it("shows a loading state while setup status is loading", () => {
    mockStatus({ ...snapshot, rooms: { status: "loading", data: [] } } as SetupSnapshot);
    render(<OnboardingWelcomePage />);

    expect(screen.getByText("Preparing your setup…")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Start setup" })).not.toBeInTheDocument();
  });

  it("returns completed schools to the dashboard", async () => {
    mockStatus(snapshot, true);
    render(<OnboardingWelcomePage />);

    await waitFor(() => {
      expect(navigationMock.replace).toHaveBeenCalledWith("/en/dashboard");
    });
    expect(screen.queryByRole("button", { name: "Start setup" })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the welcome-page test and verify RED**

Run:

```bash
npx vitest run src/features/onboarding/__tests__/OnboardingWelcomePage.test.tsx
```

Expected: FAIL because `OnboardingWelcomePage` does not exist.

- [ ] **Step 3: Implement the welcome page**

Create `OnboardingWelcomePage.tsx`:

```tsx
"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Building2,
  CalendarRange,
  DoorOpen,
  Network,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSetupStatus } from "../hooks/useSetupStatus";
import { isSetupSnapshotLoading } from "../utils/setupStatus";

const welcomeStages = [
  { title: "Organization", description: "Add your school profile and core details.", icon: Building2 },
  { title: "Academic year and terms", description: "Define the calendar used across academics.", icon: CalendarRange },
  { title: "Academic structure", description: "Create stages, grades, and sections.", icon: Network },
  { title: "Subjects and allocations", description: "Connect subjects to grades and weekly hours.", icon: BookOpen },
  { title: "Rooms", description: "Add rooms used by schedules and assignments.", icon: DoorOpen },
] as const;

export default function OnboardingWelcomePage() {
  const { evaluation, snapshot } = useSetupStatus();
  const router = useRouter();
  const params = useParams<{ lang?: string }>();
  const locale = params.lang ?? "en";
  const isLoading = isSetupSnapshotLoading(snapshot);

  useEffect(() => {
    if (!isLoading && evaluation.isComplete) {
      router.replace(`/${locale}/dashboard`);
    }
  }, [evaluation.isComplete, isLoading, locale, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <p aria-live="polite" className="animate-pulse text-sm font-medium text-white">
          Preparing your setup…
        </p>
      </div>
    );
  }

  if (evaluation.isComplete) {
    return null;
  }

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto flex max-w-5xl flex-col items-center">
        <header className="onboarding-enter max-w-2xl text-center text-white">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/75">
            School onboarding
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
            Welcome to your school workspace
          </h1>
          <p className="mt-4 text-sm leading-6 text-white/80 sm:text-base">
            Follow the guided setup to add the essential data your dashboard needs and avoid missing-data errors.
          </p>
        </header>

        <section
          aria-label="Setup stages"
          className="onboarding-enter onboarding-enter-delay-1 mt-8 grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-5"
        >
          {welcomeStages.map(({ title, description, icon: StageIcon }) => (
            <article className="rounded-2xl border border-white/20 bg-white/95 p-4 shadow-sm" key={title}>
              <StageIcon aria-hidden className="h-5 w-5 text-primary" />
              <h2 className="mt-4 text-sm font-semibold text-gray-950">{title}</h2>
              <p className="mt-2 text-xs leading-5 text-gray-600">{description}</p>
            </article>
          ))}
        </section>

        <div className="onboarding-enter onboarding-enter-delay-2 mt-8">
          <Button
            onClick={() => router.push(`/${locale}/settings/onboarding/setup`)}
            type="button"
          >
            Start setup
            <ArrowRight aria-hidden className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
```

Keep the existing standalone layout semantics and preserve the approved primary background:

```tsx
<main aria-label="Onboarding setup" className="min-h-screen bg-primary">
  {children}
</main>
```

- [ ] **Step 4: Run the welcome-page tests and verify GREEN**

Run:

```bash
npx vitest run src/features/onboarding/__tests__/OnboardingWelcomePage.test.tsx
```

Expected: all four tests PASS.

- [ ] **Step 5: Commit the welcome page**

```bash
git add src/features/onboarding/pages/OnboardingWelcomePage.tsx src/features/onboarding/__tests__/OnboardingWelcomePage.test.tsx 'src/app/[lang]/(onboarding)/layout.tsx'
git commit -m "feat: add onboarding welcome page"
```

### Task 3: Split welcome and setup routes

**Files:**
- Modify: `src/app/[lang]/(onboarding)/settings/onboarding/page.tsx`
- Create: `src/app/[lang]/(onboarding)/settings/onboarding/setup/page.tsx`
- Create: `src/app/[lang]/(onboarding)/__tests__/routes.test.tsx`

- [ ] **Step 1: Write failing route ownership tests**

Create `routes.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import OnboardingWelcomeRoute from "../settings/onboarding/page";
import OnboardingSetupRoute from "../settings/onboarding/setup/page";

vi.mock("@/features/onboarding/pages/OnboardingWelcomePage", () => ({
  default: () => <div>Welcome route content</div>,
}));

vi.mock("@/features/onboarding/pages/SchoolOnboardingPage", () => ({
  default: () => <div>Setup route content</div>,
}));

describe("onboarding routes", () => {
  it("renders the welcome page at the onboarding root", () => {
    render(<OnboardingWelcomeRoute />);
    expect(screen.getByText("Welcome route content")).toBeVisible();
  });

  it("renders the setup workflow at the nested setup route", () => {
    render(<OnboardingSetupRoute />);
    expect(screen.getByText("Setup route content")).toBeVisible();
  });
});
```

- [ ] **Step 2: Run route tests and verify RED**

Run:

```bash
npx vitest run 'src/app/[lang]/(onboarding)/__tests__/routes.test.tsx'
```

Expected: FAIL because the nested setup route does not exist and the root still renders the setup page.

- [ ] **Step 3: Point each route to its feature page**

Replace the root route with:

```tsx
import OnboardingWelcomePage from "@/features/onboarding/pages/OnboardingWelcomePage";

export default function OnboardingWelcomeRoute() {
  return <OnboardingWelcomePage />;
}
```

Create `settings/onboarding/setup/page.tsx`:

```tsx
import SchoolOnboardingPage from "@/features/onboarding/pages/SchoolOnboardingPage";

export default function OnboardingSetupRoute() {
  return <SchoolOnboardingPage />;
}
```

- [ ] **Step 4: Run route and onboarding tests**

Run:

```bash
npx vitest run 'src/app/[lang]/(onboarding)/__tests__/routes.test.tsx' src/features/onboarding
```

Expected: route tests and all onboarding tests PASS.

- [ ] **Step 5: Run static and full verification**

Run:

```bash
npm run typecheck
npm run lint -- src/features/onboarding 'src/app/[lang]/(onboarding)'
git diff --check
npx vitest run --reporter=dot
```

Expected: all commands exit with code 0.

- [ ] **Step 6: Commit route split**

```bash
git add 'src/app/[lang]/(onboarding)/settings/onboarding/page.tsx' 'src/app/[lang]/(onboarding)/settings/onboarding/setup/page.tsx' 'src/app/[lang]/(onboarding)/__tests__/routes.test.tsx'
git commit -m "refactor: split onboarding welcome and setup routes"
```
