# Academic Content Announcement Banner Implementation Plan

> **For agentic workers:** Use executing-plans for inline implementation in the existing feature worktree. No delegated agents are required.

**Goal:** Announce the new Academic Content Hub globally with a dismissible localized banner.

**Architecture:** A presentation-only UI banner receives copy and action content. A feature wrapper owns per-user dismissal and translations. A dashboard placement provider moves the single banner into a context-bar slot, falling back to its normal position below the navbar.

**Tech Stack:** React, Next.js, next-intl, Tailwind, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-09-academic-content-announcement-banner-design.md`

## Global Constraints

- Announce a new feature, never an update.
- Reuse UI Button styles and GuardedLink for SPA navigation with unsaved-change protection.
- No backend contract changes or additional API requests.
- Localize Arabic and English; use logical spacing and responsive wrapping.
- Persist dismissal per user and announcement version; a storage failure must not prevent closing.
- Run focused tests only, plus scoped lint and typecheck. Ask before full tests.

## Task 1: Banner UI, dismissal, and placement

**Files:** Create `src/components/ui/announcement-banner/AnnouncementBanner.tsx`, its barrel, `src/components/layout/DashboardAnnouncementPlacement.tsx`, `src/features/academic-content/components/AcademicContentAnnouncement.tsx`, and `src/features/academic-content/components/__tests__/AcademicContentAnnouncement.test.tsx`. Modify the UI barrel and Arabic/English messages.

**Interfaces:** `AnnouncementBanner` takes title, description, newLabel, closeLabel, action ReactNode, and onClose callback. `DashboardAnnouncementProvider` owns the target element; `DashboardAnnouncementSlot` registers its div; `DashboardAnnouncementOutlet` renders its children into the registered target or inline. `AcademicContentAnnouncement` takes userId and canView.

- [x] Write tests for locale-specific href/copy, dismissal/remount, different users, permission gating, blocked storage, and one banner moving into/out of the context slot.

```tsx
render(<AcademicContentAnnouncement userId="user-a" canView />);
expect(screen.getByRole("link", { name: "Explore" })).toHaveAttribute("href", "/en/academic-content-hub");
fireEvent.click(screen.getByRole("button", { name: "Dismiss announcement" }));
expect(screen.queryByRole("region")).not.toBeInTheDocument();
```

- [x] Run the focused test before implementation and verify the missing component failure.
- [x] Implement the UI, localized feature wrapper, DOMException-only browser storage recovery, and React portal placement.

```tsx
return target ? createPortal(children, target) : children;
```

- [x] Run the same focused test and review with Clean Code Guard and Test Guard.

## Task 2: Global dashboard wiring

**Files:** Modify `src/components/layout/SideBarTopNav.tsx`, `src/features/academics/components/shared/ContextBar.tsx`, and the behavior and students/guardians dashboard layouts.

**Interfaces:** Wrap the shared dashboard chrome with `DashboardAnnouncementProvider`. Render `AcademicContentAnnouncement` once in each mutually exclusive normal/chat branch; supply the authenticated user ID and academic-content view permission. Insert `DashboardAnnouncementSlot` after each academic context bar; attendance and grades already consume the shared ContextBar.

- [x] Wire the provider, single outlet, and three context slot locations.

```tsx
<DashboardAnnouncementProvider><SideBarTopNavContent>{children}</SideBarTopNavContent></DashboardAnnouncementProvider>
```

- [x] Run announcement, sidebar, academic-context layout, and translation-focused tests. Run scoped eslint, `npm run typecheck`, and `git diff --check` for affected files.
- [x] Review final changes against the approved spec and report actual verification results. Preserve all unrelated worktree changes.

## Verification results

- 153 focused tests passed across the announcement, sidebar, academic-context layout, and workflow translations.
- Scoped eslint passed with no errors or warnings in the banner implementation files.
- `npm run typecheck` was attempted but is blocked by malformed generated `.next/dev/types/routes.d.ts` and `.next/dev/types/validator.ts` files. Source-only TypeScript checking with the same compiler options and Next.js ambient types passed; this does not replace the generated-route check.
- Live browser verification could not run because the browser tool failed during initialization. Responsive and RTL styles are implemented, but not visually confirmed in a running browser.
