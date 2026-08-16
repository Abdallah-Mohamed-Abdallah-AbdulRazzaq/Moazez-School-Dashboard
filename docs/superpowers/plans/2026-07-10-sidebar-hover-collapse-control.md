# Sidebar Hover Collapse Control Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reveal the expanded desktop sidebar’s collapse button on sidebar hover/focus with a polished, accessible animation while keeping the collapsed sidebar’s expand control available.

**Architecture:** Keep the existing toggle button and `Sidebar` API unchanged. Use Tailwind group-hover/focus-visible utilities on the existing `<aside>` and button so the interaction needs no new React state, layout changes, or component extraction. Preserve the current chevron and RTL behavior.

**Tech Stack:** React 19, Next.js 16, TypeScript, Tailwind CSS v4, lucide-react, Vitest.

## Global Constraints

- Update only the existing toggle control in `src/components/layout/Sidebar.tsx`.
- Preserve the current `isOpen`, `onToggle`, and `isRTL` behavior.
- Do not add new React hover state, change sidebar widths, or change mobile behavior.
- Use opacity and transform only so the animation does not cause layout shift.
- Keep keyboard focus visible and respect `prefers-reduced-motion`.

---

### Task 1: Add the animated hover/focus reveal to the sidebar toggle

**Files:**
- Modify: `src/components/layout/Sidebar.tsx` (sidebar `<aside>` and existing desktop toggle button)
- Test: manual browser verification; no new unit test because the requested behavior is CSS interaction state on an existing control

**Interfaces:**
- Consumes: existing `isOpen`, `onToggle`, and `isRTL` props in `Sidebar`
- Produces: the same toggle callback and icon behavior, with hover/focus styling applied

- [ ] **Step 1: Add a named hover/focus group to the sidebar container**

Keep all existing positioning, responsive visibility, open/closed transforms, and width classes. Add a Tailwind group name to the `<aside>` so the toggle can react to pointer hover and focus within the sidebar:

```tsx
className={`group/sidebar fixed z-50 h-screen ...`}
```

- [ ] **Step 2: Make the expanded toggle revealable without changing layout**

Extend the existing desktop button classes so the open-state button starts subdued and slightly raised, then becomes fully visible and interactive when the sidebar is hovered or contains keyboard focus. Keep the compact-state control visible at all times:

```tsx
className={`hidden lg:block rounded-lg border border-white/30 p-2 text-white
  transition-[opacity,transform,background-color,box-shadow] duration-200 ease-out
  motion-reduce:transition-none
  ${isOpen
    ? "opacity-0 -translate-y-1 pointer-events-none group-hover/sidebar:pointer-events-auto group-hover/sidebar:opacity-100 group-hover/sidebar:translate-y-0 group-focus-within/sidebar:pointer-events-auto group-focus-within/sidebar:opacity-100 group-focus-within/sidebar:translate-y-0"
    : "opacity-100 translate-y-0 hover:bg-white/20 hover:shadow-md"}
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#065769]
  mt-2 shrink-0 ${isRTL ? "ml-2 mr-auto" : "ml-auto mr-2"}`}
```

Retain the existing `onClick`, icon selection, and RTL chevron rotation.

- [ ] **Step 3: Add accessible labels to both toggle states**

Add `aria-label` to the button using the existing translation namespace. Verify the translation keys before selecting the final key names; do not introduce a broken translation lookup. Prefer the existing `collapse` key and add a matching `expand` key only if needed.

- [ ] **Step 4: Run focused verification**

Run:

```bash
npm run typecheck
npx eslint src/components/layout/Sidebar.tsx
```

Expected: both commands complete successfully with no TypeScript or ESLint errors.

- [ ] **Step 5: Manually verify the interaction states**

Open the dashboard at desktop width and verify all of the following:

- Expanded LTR sidebar: button fades/slides in on sidebar hover and remains visible while focused.
- Expanded Arabic/RTL sidebar: button appears on the correct side and the chevron direction is unchanged.
- Collapsed sidebar: menu/expand button is always available and has a subtle hover response.
- Mobile width: existing mobile behavior is unchanged.
- With reduced motion enabled: the visibility state changes without the slide animation.

- [ ] **Step 6: Review the diff and commit the implementation**

Run:

```bash
git diff --check
git diff -- src/components/layout/Sidebar.tsx
git add src/components/layout/Sidebar.tsx
git commit -m "feat: reveal sidebar collapse control on hover"
```

Expected: only the intended sidebar interaction changes are included in the commit.

