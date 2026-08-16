# Sidebar Tab Search Design

## Goal

Add a fast, modern search experience to the sidebar that finds both top-level navigation items and grouped child tabs in the active language.

## Scope

- Search the permission-filtered navigation tree locally in the browser; no API request or URL query state is introduced.
- Match English or Arabic labels according to the current locale, case-insensitively for English and with trimmed text comparison.
- Keep matching top-level items and child tabs visible, retaining the existing subgroup headings for child results.
- Automatically reveal sections containing matches while a query is active.
- Restore the user’s prior expansion state when the query is cleared.
- Show a localized empty state when no navigation item matches.
- Keep search available when the sidebar is collapsed through a search icon that expands the sidebar and focuses the search field.

## Interaction and visual design

Place the search control below the school selector and above the scrollable navigation. The expanded control is a compact rounded input with the existing teal sidebar surface, a Lucide search icon, a visible focus ring, and a clear button that appears only when text is entered. Use a 150–200ms opacity/width transition for the clear affordance and a subtle focus transition; avoid scale transforms that shift surrounding navigation.

When the sidebar is collapsed, show a square search icon button near the existing collapse/menu control. Activating it calls the existing `onToggle` action, then focuses the input after the expanded layout is available. The button has an accessible localized label and a visible keyboard focus state.

Search results reuse the existing navigation links, badges, pending states, active styling, subgroup titles, and guarded navigation behavior. Top-level matches remain normal links. Child matches remain under their parent and subgroup. A small localized empty state is rendered inside the scroll area when the query has no matches.

## State and data flow

Add local `searchQuery` state and a ref for the input. Derive `filteredMenuItems` from `visibleMenuItems` with `useMemo`: retain a top-level item when its label matches or at least one child/grandchild matches, and filter children/grandchildren to matching descendants. Use the existing `groupMenuChildren` helper to omit empty subgroup headings.

Track the expanded keys that existed immediately before the first non-empty query. While searching, merge matching parent and child keys into `expandedItems`. On clear, restore the saved keys and reset the saved snapshot. Do not alter route navigation, permission checks, collapsed flyout behavior, or grade query preservation.

## Accessibility and localization

- Use a labeled `<input>` with a localized placeholder and `aria-label`.
- Provide a localized clear button label and no-results message.
- Keep all interactive controls keyboard reachable with visible focus rings.
- Respect `prefers-reduced-motion` by disabling transition effects when requested.
- Preserve LTR/RTL alignment and place icons using logical positioning/classes.

## Verification

- Test matching top-level items and child tabs.
- Test automatic expansion while searching and restoration after clearing.
- Test no-results rendering, clear-button behavior, and the collapsed search trigger.
- Test Arabic labels and RTL rendering behavior.
- Run the focused Sidebar tests, TypeScript check, targeted lint, and a manual responsive check at expanded/collapsed widths.
