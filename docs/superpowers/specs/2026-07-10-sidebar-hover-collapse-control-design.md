# Sidebar Hover Collapse Control Design

## Goal

Make the desktop sidebar collapse control easier to discover without keeping it visually prominent all the time. When the sidebar is expanded, the control should reveal itself with a short, polished animation when the pointer enters the sidebar or keyboard focus moves into it. When the sidebar is collapsed, the existing expand/menu control remains available.

## Scope

- Update the existing toggle button in `src/components/layout/Sidebar.tsx`.
- Preserve the current `isOpen`, `onToggle`, and `isRTL` behavior.
- Do not add new React hover state, change sidebar widths, or change mobile behavior.
- Do not alter navigation, flyouts, or content layout.

## Interaction design

### Expanded sidebar

- The collapse button is visually subdued when the sidebar is idle.
- On sidebar hover, it fades in and translates into its resting position over approximately 200ms.
- `focus-visible`/keyboard focus reveals the button as well, with a clear focus ring.
- The current chevron direction and RTL rotation are preserved.

### Collapsed sidebar

- The existing menu/expand button remains available rather than relying on hover alone.
- Its existing hover affordance receives the same restrained transition treatment.

## Accessibility and motion

- The button has an accessible label describing the action.
- Hover is an enhancement only; keyboard users can still reach and use the button.
- The animation uses opacity and transform only, avoiding layout shift.
- Reduced-motion users receive the state change without the slide animation.
- The control remains desktop-only according to the existing `lg` visibility rule.

## Implementation approach

Use Tailwind utility classes and the existing sidebar hover/focus grouping. The button will transition its opacity and vertical transform in the expanded state, become fully interactive on sidebar hover or focus, and retain normal interactivity in the collapsed state. No new component or state is needed.

## Verification

- Run the relevant layout tests if present.
- Run TypeScript checking and linting for the changed component.
- Manually verify expanded and collapsed states in both LTR and RTL, plus keyboard focus and reduced-motion behavior.

