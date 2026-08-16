import { expect, type Page } from "@playwright/test";

export const openGradesContext = {
  year: "year-2",
  term: "term-2-1",
  scopeType: "school",
  scopeId: "school",
  subjectId: "subj-5",
} as const;

export const sharedGradesRoutes = [
  "/en/grades",
  "/en/grades/assessments",
  "/en/grades/gradebook",
  "/en/grades/assessments/new",
] as const;

export function withGradesQuery(
  pathname: string,
  overrides: Partial<Record<string, string>> = {},
) {
  const params = new URLSearchParams({
    ...openGradesContext,
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

export async function expectSharedGradesContextBar(page: Page) {
  await expect(
    page.getByRole("heading", { name: "Academic Context" }),
  ).toHaveCount(1);
}

export async function expectNoVisibleContextBar(page: Page) {
  await expect(
    page.getByRole("heading", { name: "Academic Context" }),
  ).toHaveCount(0);
}

export async function expandContextBar(page: Page) {
  const toggle = page
    .locator("button")
    .filter({
      has: page.getByRole("heading", { name: "Academic Context" }),
    })
    .first();
  await toggle.click();
}

export async function chooseSelectOption(
  page: Page,
  label: string,
  optionLabel: string,
) {
  const field = page
    .locator("label")
    .filter({ hasText: label })
    .first()
    .locator("..");
  await field.getByRole("button").click();
  await page.getByRole("button", { name: optionLabel, exact: true }).last().click();
}

export async function fillInputByLabel(
  page: Page,
  label: string,
  value: string,
) {
  const field = page
    .locator("label")
    .filter({ hasText: label })
    .first()
    .locator("..");
  const input = field.locator("input").first();
  await input.fill("");
  await input.fill(value);
}

export async function addAndFillQuestion(page: Page, suffix: string) {
  const addQuestionButton = page.getByRole("button", { name: "Add Question" });
  if ((await addQuestionButton.count()) > 0) {
    await addQuestionButton.first().click();
  } else {
    await page.getByRole("button", { name: "Add First Question" }).click();
  }

  await page.getByPlaceholder("Enter question text in English").fill(
    `Smoke question ${suffix}`,
  );
  await page
    .locator('input[placeholder*="أدخل نص السؤال"]')
    .first()
    .fill(`سؤال اختبار ${suffix}`);

  await page
    .locator('input[placeholder="Option text (English)"]')
    .nth(0)
    .fill(`Option A ${suffix}`);
  await page
    .locator('input[placeholder="Option text (English)"]')
    .nth(1)
    .fill(`Option B ${suffix}`);
  await page
    .locator('input[placeholder="Option text (عربي)"]')
    .nth(0)
    .fill(`الخيار أ ${suffix}`);
  await page
    .locator('input[placeholder="Option text (عربي)"]')
    .nth(1)
    .fill(`الخيار ب ${suffix}`);
}
