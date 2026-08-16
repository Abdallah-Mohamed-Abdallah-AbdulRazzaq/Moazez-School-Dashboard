# Hero Mission Detail Actions Design

## Goal

Make mission actions easier to discover from the desktop mission details container while preserving the existing modal footer actions.

## Interaction design

- Keep the existing Edit, Delete, Publish, and Archive buttons in the mission modal footer.
- Add a second action group at the bottom of the desktop details card.
- Use a responsive two-column grid so the 360px details panel gives each action a stable, readable target.
- Reuse the current permission checks, editable/archive rules, loading states, and callbacks. The copied controls must behave exactly like the footer controls.
- Keep the details-panel action group hidden with the desktop details panel at smaller breakpoints; the modal footer remains the mobile-accessible action surface.

## Component boundary

Create a focused `HeroJourneyMissionActions` component that receives the selected mission, manage permission, and action callbacks. Render it only in the desktop details container. The modal continues to own its existing footer controls, avoiding changes to modal close or save behavior.

## Accessibility and visual rules

- Use the existing Button component and translated labels.
- Preserve visible focus states and disabled states.
- Keep danger styling for Delete and existing primary/secondary variants for the other actions.
- Use consistent gap and full-width grid cells; avoid layout-shifting hover transforms.

## Verification

- Add or update component tests to verify the copied actions render in the desktop details surface and preserve disabled-state rules.
- Run the Hero Journey test suite, typecheck, ESLint for changed files, and `git diff --check`.
