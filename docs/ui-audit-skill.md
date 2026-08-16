# UI/UX Audit Skill

This repository includes a local Playwright-based UI/UX audit command. It opens configured pages, captures screenshots at mobile/tablet/desktop sizes, checks layout overflow, runs axe accessibility checks, and builds a Markdown packet for AI review.

## Repository Routing Note

This project uses locale-prefixed routes. Use `/ar/...` or `/en/...` routes. The default locale is `ar`. Dashboard routes live under `src/app/[lang]/(dashboard)`, but the `(dashboard)` segment is a Next.js route group and should not appear in URLs.

Examples of valid routes:

- `/ar/login`
- `/ar/dashboard`
- `/ar/admissions/applications`
- `/ar/students-guardians/students`

## Install Dependencies

This project uses npm and already includes:

- `@playwright/test`
- `@axe-core/playwright`

If dependencies are missing on a fresh checkout, run:

```bash
npm install
```

## Install Playwright Browsers

Install Chromium for the audit runner:

```bash
npm run e2e:install
```

Or install all Playwright browsers:

```bash
npx playwright install
```

## Configure Pages

Edit `ui-audit.config.json`. Keep routes locale-prefixed:

```json
{
  "baseUrl": "http://localhost:3000",
  "locale": "ar",
  "pages": ["/ar/login", "/ar/dashboard", "/ar/admissions"]
}
```

The default base URL is `http://localhost:3000`. To point the audit at another running app without editing the file:

```bash
UI_AUDIT_BASE_URL=http://localhost:3001 npm run skill:uiux
```

On Windows PowerShell:

```powershell
$env:UI_AUDIT_BASE_URL="http://localhost:3001"; npm run skill:uiux
```

## Run The Local Dev Server

The audit Playwright config starts the dev server automatically with:

```bash
npm run dev
```

If a compatible server is already running at the configured base URL, Playwright reuses it.

## Authenticated Pages

Most dashboard routes are protected, so `ui-audit.config.json` enables auth by default. The audit uses `playwright/.auth/user.json` for protected pages and leaves `/ar/login` unauthenticated so the login UI is audited too.

With email/password login:

```bash
E2E_EMAIL="your-email@example.com" E2E_PASSWORD="your-password" npm run skill:uiux
```

You can also add these keys to `.env`; the audit scripts load `.env` automatically:

```text
E2E_EMAIL=your-email@example.com
E2E_PASSWORD=your-password
```

For PowerShell:

```powershell
$env:E2E_EMAIL="your-email@example.com"
$env:E2E_PASSWORD="your-password"
npm run skill:uiux
```

You can also create the auth state separately:

```bash
npm run auth:setup
```

If login requires OTP or manual browser login, use:

```bash
npm run auth:manual
npm run skill:uiux
```

`auth:manual` opens Playwright codegen at the configured login URL and saves storage state to `playwright/.auth/user.json` after you complete login.

## Run The Audit

```bash
npm run skill:uiux
```

Equivalent alias:

```bash
npm run ui:audit
```

## Report Output

The audit writes:

```text
ui-audit-report/
  screenshots/
  ui-issues.json
  accessibility-issues.json
  ai-review-prompt.md
```

`ui-issues.json` includes console errors, horizontal-scroll findings, and overflowing elements. `accessibility-issues.json` includes axe violations and affected nodes. The tests collect issues without failing just because issues exist.

## Send To An AI Reviewer

Send `ui-audit-report/ai-review-prompt.md` plus the files in `ui-audit-report/screenshots/` to the reviewer. The prompt packet includes the role, screenshot list, JSON findings, review checklist, and required output format.
