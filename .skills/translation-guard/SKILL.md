# Translation Guard Skill

Use this skill whenever you create, modify, review, or refactor UI code in the `sis_dashboard` Next.js app.

## Project i18n Context

- Framework: Next.js App Router.
- Localized routes live under `src/app/[lang]`.
- Supported locales: `ar`, `en`.
- Default locale: `ar`.
- URLs must be locale-prefixed, for example `/ar/login`, `/ar/dashboard`, `/en/login`.
- Route groups like `(dashboard)` are not part of the URL.
- Translation library: `next-intl`.

## Core Rule

No new user-facing UI text may be hardcoded in React components, pages, layouts, metadata, form labels, buttons, empty states, error messages, table headers, toast messages, modal titles, placeholders, aria labels, tooltips, validation messages, or navigation labels.

Every visible string must come from translation messages through `next-intl`.

## Required Behavior

When editing UI code:

1. Detect all new or modified user-facing strings.
2. Replace hardcoded strings with translation keys.
3. Add the same key to both Arabic and English message files.
4. Keep key names stable, descriptive, and scoped by feature.
5. Preserve the existing locale route behavior under `[lang]`.
6. Do not introduce non-prefixed internal links such as `/dashboard`; use locale-aware navigation or include the current `lang`.
7. Do not mix Arabic and English in the same locale file except for proper nouns, product names, or technical terms that are intentionally untranslated.
8. Do not delete existing translation keys unless you verify they are unused.
9. Do not change business logic while only fixing translations.
10. Do not use translation keys as fallback visible text.

## Preferred Key Style

Use nested, feature-scoped keys:

```json
{
  "dashboard": {
    "overview": {
      "title": "Dashboard Overview",
      "emptyState": "No data available"
    }
  }
}
```

Arabic equivalent:

```json
{
  "dashboard": {
    "overview": {
      "title": "نظرة عامة على لوحة التحكم",
      "emptyState": "لا توجد بيانات متاحة"
    }
  }
}
```

## React Usage Pattern

Prefer `useTranslations` in client components:

```tsx
const t = useTranslations('dashboard.overview');

return <h1>{t('title')}</h1>;
```

Prefer server-compatible translation helpers in server components when the project already uses them.
Follow the existing project pattern instead of introducing a new i18n abstraction.

## Dynamic Values

Use interpolation instead of string concatenation:

```tsx
t('studentCount', { count: students.length })
```

Messages:

```json
{
  "studentCount": "{count} students"
}
```

Arabic:

```json
{
  "studentCount": "{count} طالب"
}
```

## Plurals

Use ICU plural syntax when needed:

```json
{
  "selectedStudents": "{count, plural, =0 {No students selected} =1 {One student selected} other {# students selected}}"
}
```

Arabic:

```json
{
  "selectedStudents": "{count, plural, =0 {لم يتم اختيار أي طالب} =1 {تم اختيار طالب واحد} =2 {تم اختيار طالبين} few {تم اختيار # طلاب} many {تم اختيار # طالبًا} other {تم اختيار # طالب}}"
}
```

## Links and Locale Guard

When creating links inside localized routes:

Bad:

```tsx
<Link href="/dashboard">Dashboard</Link>
```

Good:

```tsx
<Link href={`/${lang}/dashboard`}>{t('dashboard')}</Link>
```

Even better: use the project's existing locale-aware navigation helper if available.

## Allowed Hardcoded Strings

These may remain hardcoded:

- Translation keys.
- Test IDs.
- CSS class names.
- Icon names.
- API paths.
- Route segment constants when not visible to users.
- Enum values.
- Console/debug messages not shown to users.
- Proper nouns or brand names intentionally shared across locales.

## Guard Checklist Before Final Answer

Before finishing any implementation or code review, verify:

- [ ] No new hardcoded visible text in `.tsx` or UI-related `.ts` files.
- [ ] All new keys exist in both `ar` and `en` messages.
- [ ] Arabic copy is natural RTL Arabic, not word-for-word machine text.
- [ ] English copy is clear and consistent.
- [ ] Placeholders, aria labels, tooltips, toast messages, and validation errors are translated.
- [ ] Links remain locale-prefixed.
- [ ] Tests or snapshots are updated when visible text changes.
- [ ] No unrelated logic changes were introduced.

## Review Output Format

When reporting translation issues, use this format:

```md
## Translation Guard Findings

### Must fix
1. `path/to/file.tsx`
   - Hardcoded text: "Save changes"
   - Suggested key: `common.actions.saveChanges`
   - Suggested EN: "Save changes"
   - Suggested AR: "حفظ التغييرات"

### Suggested patch
- Replace hardcoded strings with `t(...)` calls.
- Add missing keys to both locale files.

### Verified
- Locale-prefixed routing preserved.
- No untranslated user-facing text left in changed files.
```

## Implementation Standard

When asked to implement a page or feature, apply this skill automatically. Do not wait until the end to translate strings. Build translation support as part of the first implementation pass.
