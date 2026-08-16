# Sidebar Subgroup Titles Design

## Goal

Improve scanability of expanded sidebar sections by grouping related child navigation links under short, localized subgroup titles.

## Scope

- Keep the existing parent navigation rows, expand/collapse behavior, permissions filtering, active states, loading states, collapsed flyout, and routing unchanged.
- Add subgroup metadata to the navigation configuration for sections that contain multiple related child links.
- Render non-interactive subgroup headings above their related links in the expanded sidebar and in the collapsed sidebar flyout.
- Support English and Arabic labels and preserve the existing RTL alignment.
- Do not add new React state or change the mobile/desktop sidebar widths.

## Grouping

The following groups will be added:

- Communication: General, Messaging, Notifications, Safety & Settings
- Admissions & Registration: Application Pipeline, Enrollment
- Students & Guardians: Directory, Requests
- Academics: Academic Setup, Teaching & Learning, Staff
- Assessments & Grades: General, Assessment Management
- Attendance & Discipline: Monitoring, Policies & Records
- Behavior: General, Behavior Management
- Nedaa: Operations, Configuration
- Reinforcement: General, Programs, XP & Rewards
- Settings & Integrations: General, Access & Identity, Email, Security & Data

Links that do not need a distinct subgroup remain under the nearest applicable group. Existing child order is preserved.

## Design

Extend `MenuItem` with optional subgroup metadata on children. Each child can reference a subgroup key, while each parent section defines localized subgroup titles and their order. The sidebar derives visible groups after permission filtering, so an empty group is not rendered.

In the expanded sidebar, render a compact muted heading with consistent horizontal inset above each non-empty group, followed by the existing child link rows. Headings are non-interactive and use semantic text styling appropriate for the sidebar. In the collapsed flyout, render the same headings with the flyout's existing padding and typography.

The existing parent row remains the section's interactive disclosure control. The collapsed sidebar continues to show the parent label as the flyout title, and the flyout continues to support nested expansion and navigation.

## Accessibility and localization

- Subgroup headings are plain text and do not receive focus.
- Existing buttons and links retain their accessible names, focus styles, and keyboard behavior.
- Every subgroup has `label_en` and `label_ar`; headings use the current locale and inherit RTL text alignment.
- No information is conveyed by color alone.

## Verification

- Update sidebar tests to verify representative subgroup headings render when expanded.
- Verify permission filtering does not leave empty headings.
- Run the relevant Sidebar tests and TypeScript/lint checks available in the project.
- Visually check expanded and collapsed states in both English LTR and Arabic RTL.
