# Sidebar Subgroup Titles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add localized subgroup headings to related sidebar links while preserving existing navigation behavior.

**Architecture:** Store subgroup definitions on each parent `MenuItem` and a subgroup key on each child. Add a small pure grouping helper in `navigation.ts` that filters empty groups after permissions are applied, then use the helper in both the expanded sidebar and collapsed flyout so the two render paths stay consistent. Headings remain non-interactive and inherit the current locale and text direction.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, Vitest, Testing Library, Lucide icons.

## Global Constraints

- Keep existing parent rows, expand/collapse behavior, permissions filtering, active states, loading states, routing, and collapsed flyout behavior unchanged.
- Preserve child order and render no empty subgroup heading after permission filtering.
- Provide `label_en` and `label_ar` for every subgroup.
- Do not add new React state or change sidebar widths/mobile behavior.
- Use non-interactive semantic text for headings; existing buttons and links retain focus and keyboard behavior.

---

### Task 1: Add typed subgroup metadata and localized navigation group definitions

**Files:**
- Modify: `src/config/navigation.ts`
- Test: `src/components/layout/__tests__/Sidebar.test.tsx`

**Interfaces:**
- `SubgroupDefinition`: `{ key: string; label_en: string; label_ar: string }`.
- `MenuItem.subgroups?: SubgroupDefinition[]`.
- `MenuItem.subgroup?: string` on child items.
- `groupMenuChildren(item, children)`: returns ordered non-empty groups containing the subgroup definition and its visible children.

- [ ] **Step 1: Add a failing rendering test for localized subgroup headings**

Extend the Sidebar test suite with a test that renders the expanded sidebar and asserts that representative English headings such as `Application Pipeline` and `Enrollment` are present. Also assert that a child link such as `Applications` remains present, proving headings supplement rather than replace navigation.

```tsx
it("renders subgroup headings above related links", () => {
  render(<Sidebar isOpen onToggle={vi.fn()} />);

  expect(screen.getByText("Application Pipeline")).toBeInTheDocument();
  expect(screen.getByText("Enrollment")).toBeInTheDocument();
  expect(screen.getByText("Applications")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npm run test:run -- src/components/layout/__tests__/Sidebar.test.tsx`

Expected: FAIL because subgroup headings do not exist yet.

- [ ] **Step 3: Add subgroup types and definitions to navigation config**

Add the optional subgroup types to `MenuItem`, then add `subgroups` to the ten grouped parents and `subgroup` to each child. Use these exact localized labels:

```ts
type SubgroupDefinition = {
  key: string;
  label_en: string;
  label_ar: string;
};

// Example shape on a parent:
subgroups: [
  { key: "pipeline", label_en: "Application Pipeline", label_ar: "مسار التقديم" },
  { key: "enrollment", label_en: "Enrollment", label_ar: "التسجيل" },
],
```

Apply the approved mapping and exact labels below. Keep all existing child hrefs, labels, icons, badges, and ordering unchanged.

| Parent | Subgroups in order (`key` — English / Arabic) |
| --- | --- |
| Communication | `general` — General / عام; `messaging` — Messaging / المراسلات; `notifications` — Notifications / الإشعارات; `safety-settings` — Safety & Settings / الأمان والإعدادات |
| Admissions & Registration | `pipeline` — Application Pipeline / مسار التقديم; `enrollment` — Enrollment / التسجيل |
| Students & Guardians | `directory` — Directory / الدليل; `requests` — Requests / الطلبات |
| Academics | `setup` — Academic Setup / الإعداد الأكاديمي; `teaching-learning` — Teaching & Learning / التعليم والتعلم; `staff` — Staff / الموظفون |
| Assessments & Grades | `general` — General / عام; `assessment-management` — Assessment Management / إدارة التقييمات |
| Attendance & Discipline | `monitoring` — Monitoring / المتابعة; `policies-records` — Policies & Records / السياسات والسجلات |
| Behavior | `general` — General / عام; `management` — Behavior Management / إدارة السلوك |
| Nedaa | `operations` — Operations / العمليات; `configuration` — Configuration / الإعدادات |
| Reinforcement | `general` — General / عام; `programs` — Programs / البرامج; `xp-rewards` — XP & Rewards / نقاط الخبرة والمكافآت |
| Settings & Integrations | `general` — General / عام; `access-identity` — Access & Identity / الوصول والهوية; `email` — Email / البريد الإلكتروني; `security-data` — Security & Data / الأمان والبيانات |

- [ ] **Step 4: Add the grouping helper and verify its behavior with the Sidebar test**

Implement `groupMenuChildren` as a pure function near the navigation types. It must iterate subgroup definitions in configured order, collect only children whose `subgroup` matches, and omit groups with no visible children. Every child under the ten grouped parents receives an explicit subgroup key, so no fallback group is needed.

- [ ] **Step 5: Run the focused test and verify it still fails only on rendering**

Run: `npm run test:run -- src/components/layout/__tests__/Sidebar.test.tsx`

Expected: The metadata/helper compiles, but the heading assertion still fails until Task 2 renders the groups.

- [ ] **Step 6: Commit the navigation metadata**

```bash
git add src/config/navigation.ts src/components/layout/__tests__/Sidebar.test.tsx
git commit -m "feat: define sidebar navigation subgroups"
```

### Task 2: Render subgroup headings in both sidebar presentations

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`

**Interfaces:**
- Consumes `groupMenuChildren` and the subgroup metadata from Task 1.
- Produces identical subgroup ordering and empty-group filtering in the expanded menu and collapsed flyout.

- [ ] **Step 1: Render grouped children in the expanded sidebar**

In the existing `hasChildren && isExpanded` branch, derive grouped visible children and render each group in order. Before the existing child link markup, add a non-interactive heading such as:

```tsx
<p
  className={`px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/55 ${
    isArabic ? "text-right" : "text-left"
  }`}
>
  {isArabic ? group.label_ar : group.label_en}
</p>
```

Keep the existing child/grandchild rendering, active classes, badges, pending loader, and `handleItemClick` calls unchanged.

- [ ] **Step 2: Render the same headings in the collapsed flyout**

Replace the flyout’s direct `hoveredCollapsedItem.children.map(...)` loop with the same grouped data. Render the flyout heading using its existing compact padding and keep the flyout title, child expansion buttons, grandchildren, navigation links, and hover behavior unchanged.

- [ ] **Step 3: Run focused Sidebar tests**

Run: `npm run test:run -- src/components/layout/__tests__/Sidebar.test.tsx`

Expected: PASS, including collapse/expand accessibility tests and subgroup heading coverage.

- [ ] **Step 4: Commit the rendering change**

```bash
git add src/components/layout/Sidebar.tsx
git commit -m "feat: show sidebar subgroup titles"
```

### Task 3: Verify localization, permissions, types, and UI quality

**Files:**
- Modify: `src/components/layout/__tests__/Sidebar.test.tsx`

- [ ] **Step 1: Add a permission-filtering regression test**

Mock one child permission as unavailable and verify its subgroup heading is absent when all children in that subgroup are filtered out, while a populated subgroup heading remains. Keep the test focused on the rendered result rather than implementation details.

- [ ] **Step 2: Add an Arabic heading assertion**

Mock `usePathname` to return an Arabic route and assert a representative Arabic subgroup label renders with the child links still present. Use the existing test setup conventions for `next/navigation` and `next-intl` mocks.

- [ ] **Step 3: Run the complete verification commands**

Run:

```bash
npm run test:run -- src/components/layout/__tests__/Sidebar.test.tsx
npm run typecheck
npm run lint
```

Expected: all focused tests pass, TypeScript reports no errors, and ESLint reports no errors.

- [ ] **Step 4: Review the final diff and working tree**

Run: `git diff --check; git status --short; git diff HEAD~2 -- src/config/navigation.ts src/components/layout/Sidebar.tsx src/components/layout/__tests__/Sidebar.test.tsx`

Confirm only the sidebar navigation files and the approved design/plan documents are part of this work; leave unrelated existing modifications untouched.

- [ ] **Step 5: Commit the regression tests**

```bash
git add src/components/layout/__tests__/Sidebar.test.tsx
git commit -m "test: cover sidebar subgroup localization"
```
