# Onboarding Slogan and Motion Design

## Goal

Make the standalone school onboarding page feel welcoming and responsive while keeping the setup workflow focused and accessible.

## Page Header

Add a compact hero above the existing skip notice and setup guide.

- Heading: `Let’s get your school ready`
- Supporting copy: `Complete the essential setup so every part of your school dashboard works smoothly.`
- Keep the hero centered within the same maximum width as the onboarding content.
- Use the existing typography and primary color tokens; do not introduce a new font or visual theme.

## Motion

Use CSS and Tailwind utilities only. Do not add an animation dependency.

- On initial render, the hero fades in and moves upward slightly.
- The skip notice and the entire `SetupGuide` container use the same entrance treatment with short staggered delays.
- After the `SetupGuide` container enters, its header, progress bar, step-card row, and selected-step panel appear in a restrained internal sequence.
- Step cards receive subtle border, background, and shadow transitions on hover and selection without scaling or layout shift.
- The progress bar keeps its width transition with a 300ms ease-out duration.
- The selected step content fades in when the selected step changes.
- All nonessential motion is disabled when `prefers-reduced-motion: reduce` is active.

Entrance animations should complete within 500ms. Interactive transitions should remain between 150ms and 300ms.

## Component Boundaries

- `SchoolOnboardingPage` owns the hero and page-level entrance sequencing.
- `SetupGuide` owns step-card, progress-bar, and selected-content transitions.
- `SetupGuide` also owns the internal entrance sequence for its header, progress, cards, and selected-step panel.
- Global CSS defines reusable onboarding entrance keyframes and reduced-motion behavior.
- Existing setup evaluation, skip rules, API behavior, and route structure remain unchanged.

## Accessibility and Responsive Behavior

- The slogan is the page-level `h1`; the existing setup guide title remains `h2`.
- Motion communicates polish only and is not required to understand status or navigation.
- Keyboard focus styles remain visible.
- The hero and setup content must avoid horizontal overflow at 375px and preserve the current desktop layout.

## Verification

- Add or update component tests to verify the slogan and supporting copy render.
- Verify selected step content receives a new animation key when the selection changes.
- Run onboarding tests, TypeScript typecheck, ESLint, and the full test suite.
- Manually confirm reduced-motion CSS disables the new animations.
