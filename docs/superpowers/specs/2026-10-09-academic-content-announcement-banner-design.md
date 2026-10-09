# Academic Content Hub announcement banner

## Approved design

Announce Academic Content Hub as a new feature, not an update. Create a reusable announcement banner under `src/components/ui/`, using the app's primary color, existing button/link components, a subtle tinted background, and responsive RTL/LTR layout.

English: “New: Academic Content Hub — organize and manage your school's academic content.”

Arabic: “جديد: مركز المحتوى الأكاديمي — نظّم وأدِر المحتوى الأكاديمي لمدرستك.”

The action is “Explore / استكشف” and opens the locale-specific Academic Content Hub overview using SPA navigation. The close control has a localized accessible label.

## Placement

Show one banner on dashboard pages: below the academic year/term context bar when one exists, otherwise below the navbar. Keep it in normal document flow so it never covers content. Include full-screen conversation pages above their page content even though those pages deliberately hide the navbar. Do not add it to login or onboarding screens outside the dashboard layout.

Reuse a shared placement mechanism across academic, attendance, grades, behavior, and students/guardians context layouts; do not duplicate the announcement or infer placement from manually maintained route lists.

## State and access

Keep the reusable UI component presentation-only. A dashboard announcement wrapper supplies localized copy, permissions, navigation, and dismissal state. Show it only to users with `academics.academic_content.view`, consistent with the sidebar and hub access guard.

Persist dismissal in browser local storage under an announcement-version and user-specific key. Closing the banner hides it across navigation and refresh for that browser user. If storage is unavailable, closing still works for the current mounted session. This adds no backend fields or requests.

## Verification

Focused tests cover visible copy and link, closing, persisted dismissal, permission gating, and single-banner placement below a context bar or navbar. Verify Arabic/English and narrow-screen layout. Apply Clean Code Guard to production changes and Test Guard to test changes. Run scoped lint and typecheck; ask before any full test suite.
