import { expect, type Page } from "@playwright/test";

export const openAttendanceContext = {
  year: "year-1",
  term: "term-1-1",
} as const;

export const sharedAttendanceRoutes = [
  "/en/attendance/policies",
  "/en/attendance/absences",
  "/en/attendance/late-early",
  "/en/attendance/excuses",
  "/en/attendance/reports",
  "/en/attendance/roll-call",
] as const;

export function withAttendanceQuery(
  pathname: string,
  overrides: Partial<Record<string, string>> = {},
) {
  const params = new URLSearchParams({
    ...openAttendanceContext,
    ...overrides,
  });

  return `${pathname}?${params.toString()}`;
}

export function trackPageErrors(page: Page) {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });
  return pageErrors;
}

export async function expectNoPageErrors(errors: string[]) {
  const unexpectedErrors = errors.filter(
    (message) =>
      !message.includes(
        "Hydration failed because the server rendered HTML didn't match the client.",
      ),
  );

  expect(
    unexpectedErrors,
    `Unexpected page errors:\n${unexpectedErrors.join("\n")}`,
  ).toEqual([]);
}

export async function expectSharedAttendanceContextBar(page: Page) {
  await expect(
    page.getByRole("heading", { name: "Academic Context" }),
  ).toHaveCount(1);
}

export async function expandContextBar(page: Page) {
  const termLabel = page.locator("label").filter({ hasText: "Term" }).first();
  if ((await termLabel.count()) > 0 && (await termLabel.isVisible())) {
    return;
  }

  const toggle = page
    .locator("button")
    .filter({
      has: page.getByRole("heading", { name: "Academic Context" }),
    })
    .first();
  await toggle.click();
  await expect(page.locator("label").filter({ hasText: "Term" }).first()).toBeVisible();
}

export async function chooseSelectOption(
  page: Page,
  label: string,
  optionLabel: string,
) {
  let fieldButton = page
    .locator("label")
    .filter({ hasText: label })
    .first()
    .locator("..")
    .getByRole("button")
    .first();

  if ((await fieldButton.count()) === 0) {
    fieldButton = page
      .locator(
        `xpath=//*[normalize-space(text())='${label}' or normalize-space(text())='${label} *']/following::button[1]`,
      )
      .first();
  }

  await fieldButton.click();
  await page
    .getByRole("button", { name: optionLabel, exact: true })
    .last()
    .click();
}

export async function chooseSelectOptionMatching(
  page: Page,
  label: string,
  optionMatcher: RegExp,
) {
  let fieldButton = page
    .locator("label")
    .filter({ hasText: label })
    .first()
    .locator("..")
    .getByRole("button")
    .first();

  if ((await fieldButton.count()) === 0) {
    fieldButton = page
      .locator(
        `xpath=//*[normalize-space(text())='${label}' or normalize-space(text())='${label} *']/following::button[1]`,
      )
      .first();
  }

  await fieldButton.click();
  await page.getByRole("button", { name: optionMatcher }).last().click();
}

export async function fillRollCallDate(page: Page, value: string) {
  const input = page
    .locator(
      "xpath=//*[normalize-space(text())='Date']/following::input[not(@type='hidden')][1]",
    )
    .last();
  await input.fill("");
  await input.fill(value);
  await input.press("Enter");
}

export async function setupEditableRollCallSession(page: Page) {
  await page.goto(withAttendanceQuery("/en/attendance/roll-call"));
  await page.waitForLoadState("networkidle");
  await expectSharedAttendanceContextBar(page);

  await fillRollCallDate(page, "09/02/2024");
  await chooseSelectOption(page, "Scope Type", "School-wide");

  await expect(
    page.getByRole("button", { name: "Mark All Present" }),
  ).toBeVisible({ timeout: 15000 });
}

export async function makeRollCallDirty(page: Page) {
  await page.getByRole("button", { name: "Mark All Present" }).click();
  await expect(page.getByRole("button", { name: "Reset" })).toBeVisible();
}

export async function triggerInjectedInternalNavigation(
  page: Page,
  href: string,
) {
  await page.evaluate((targetHref) => {
    let anchor = document.getElementById("pw-attendance-nav");
    if (!(anchor instanceof HTMLAnchorElement)) {
      anchor = document.createElement("a");
      anchor.id = "pw-attendance-nav";
      anchor.textContent = "navigate";
      anchor.style.display = "none";
      document.body.appendChild(anchor);
    }

    anchor.href = targetHref;
    anchor.click();
  }, href);
}
