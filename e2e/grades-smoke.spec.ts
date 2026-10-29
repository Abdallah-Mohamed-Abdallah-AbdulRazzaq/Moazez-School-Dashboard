import { test, expect } from "./helpers/mock-session";
import { mockGradesApi } from "./helpers/grades-api";
import {
  addAndFillQuestion,
  chooseSelectOption,
  expectNoPageErrors,
  expectNoVisibleContextBar,
  expectSharedGradesContextBar,
  expandContextBar,
  fillInputByLabel,
  sharedGradesRoutes,
  trackPageErrors,
  withGradesQuery,
} from "./grades-test-helpers";

test.describe("Grades Migrated Smoke", () => {
  test.use({ viewport: { width: 1700, height: 1100 } });
  test.beforeEach(async ({ page }) => { await mockGradesApi(page); });

  test("shared-layout grades pages render under one visible context bar", async ({
    page,
  }) => {
    const pageErrors = trackPageErrors(page);

    for (const route of sharedGradesRoutes) {
      await page.goto(withGradesQuery(route));
      await page.waitForLoadState("networkidle");
      await expectSharedGradesContextBar(page);
      await expect(page).toHaveURL(
        new RegExp(`${route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`),
      );
      await expect(page).toHaveURL(/year=year-2/);
      await expect(page).toHaveURL(/term=term-2-1/);
    }

    await page.goto(withGradesQuery("/en/grades/assessments"));
    await page.waitForLoadState("networkidle");
    await expandContextBar(page);
    await chooseSelectOption(page, "Term", "Term 2");
    await expect(page).toHaveURL(/term=term-2-2/);
    await page.reload();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/term=term-2-2/);

    await expectNoPageErrors(pageErrors);
  });

  test("create assessment score-only flow returns to assessments with preserved context", async ({
    page,
  }) => {
    const pageErrors = trackPageErrors(page);
    const suffix = Date.now().toString();

    await page.goto(withGradesQuery("/en/grades/assessments"));
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Create Exam" }).click();

    await expect(page).toHaveURL(/\/en\/grades\/assessments\/new/);
    await expectSharedGradesContextBar(page);
    await fillInputByLabel(page, "Title (English)", `Smoke Score ${suffix}`);
    await fillInputByLabel(page, "Title (Arabic)", `اختبار درجات ${suffix}`);

    await page.getByRole("button", { name: "Create", exact: true }).click();

    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/en\/grades\/assessments/);
    await expect(page).toHaveURL(/year=year-2/);
    await expect(page).toHaveURL(/term=term-2-1/);
    await expect(page).toHaveURL(/scopeType=school/);
    expect(new URL(page.url()).searchParams.has("scopeId")).toBe(false);
    await expect(page).toHaveURL(/subjectId=subj-5/);

    await expectNoPageErrors(pageErrors);
  });

  test("question-based create assessment carries query context into the builder and back", async ({
    page,
  }) => {
    const pageErrors = trackPageErrors(page);
    const suffix = Date.now().toString();

    await page.goto(withGradesQuery("/en/grades/assessments/new"));
    await page.waitForLoadState("networkidle");
    await expectSharedGradesContextBar(page);

    await chooseSelectOption(page, "Test Mode", "Electronic Test");
    await fillInputByLabel(page, "Title (English)", `Smoke Builder ${suffix}`);
    await fillInputByLabel(page, "Title (Arabic)", `منشئ الأسئلة ${suffix}`);
    await page
      .getByRole("button", { name: "Continue to Question Builder" })
      .click();

    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/en\/grades\/assessments\/new\/questions/);
    await expect(page).toHaveURL(/year=year-2/);
    await expect(page).toHaveURL(/term=term-2-1/);
    await expect(page).toHaveURL(/scopeType=school/);
    expect(new URL(page.url()).searchParams.has("scopeId")).toBe(false);
    await expect(page).toHaveURL(/subjectId=subj-5/);
    await expectNoVisibleContextBar(page);
    await expect(page.getByText(`Smoke Builder ${suffix}`)).toBeVisible();

    await page.getByRole("button", { name: "Back to Assessments" }).click();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/en\/grades\/assessments\/new/);
    await expect(page).toHaveURL(/year=year-2/);
    await expect(page).toHaveURL(/term=term-2-1/);

    await expectNoPageErrors(pageErrors);
  });

  test("create questions builder stays context-bar free and can create an assessment with questions", async ({
    page,
  }) => {
    const pageErrors = trackPageErrors(page);
    const suffix = Date.now().toString();

    await page.goto(
      withGradesQuery("/en/grades/assessments/new/questions", {
        type: "QUIZ",
        deliveryMode: "QUESTION_BASED",
        title: `Builder Create ${suffix}`,
        titleAr: `إنشاء أسئلة ${suffix}`,
        date: "2025-10-10",
        weight: "15",
        maxScore: "20",
      }),
    );

    await page.waitForLoadState("networkidle");
    await expectNoVisibleContextBar(page);
    await expect(page.getByText(`Builder Create ${suffix}`)).toBeVisible();

    await addAndFillQuestion(page, suffix);
    await page.getByRole("button", { name: "Auto Distribute" }).click();
    await expect(
      page.getByText("Points match the assessment total"),
    ).toBeVisible();
    await page.getByRole("button", { name: "Save question" }).click();
    await expect(
      page.getByRole("button", { name: "Save question" }),
    ).toBeDisabled();

    await page.getByRole("button", { name: "Create Exam" }).click();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/en\/grades\/assessments\/.*\/questions/);
    await expectNoVisibleContextBar(page);

    await expectNoPageErrors(pageErrors);
  });

  test("edit question builder adds, reorders, and deletes questions without the context bar", async ({
    page,
  }) => {
    const pageErrors = trackPageErrors(page);
    const suffix = `edit-${Date.now()}`;
    await page.goto(withGradesQuery("/en/grades/assessments/assessment-1/questions"));
    await page.waitForLoadState("networkidle");

    await expectNoVisibleContextBar(page);
    await expect(page).toHaveURL(/\/en\/grades\/assessments\/.*\/questions/);
    await expect(page).toHaveURL(/year=year-2/);
    await expect(page).toHaveURL(/term=term-2-1/);
    await expect(page).toHaveURL(/scopeType=school/);
    expect(new URL(page.url()).searchParams.has("scopeId")).toBe(false);
    await expect(page).toHaveURL(/subjectId=subj-5/);

    await expect(page.getByRole("button", { name: /^Actions for question / })).toHaveCount(1);

    await addAndFillQuestion(page, suffix);
    await Promise.all([
      page.waitForResponse(response => response.request().method() === "GET" && new URL(response.url()).pathname === "/api/session/grades/assessments/assessment-1"),
      page.getByRole("button", { name: "Save question" }).click(),
    ]);
    await expect(
      page.getByRole("button", { name: "Save question" }),
    ).toBeDisabled();

    const addedQuestionCard = page.getByRole("button", { name: /^Question 2 / }).locator("..").locator("..");
    await addedQuestionCard.getByRole("button", { name: "Move up", exact: true }).click();
    await expect(page.getByRole("button", { name: /^Question 1 / })).toContainText(`Smoke question ${suffix}`);

    await page.getByRole("button", { name: "Actions for question 1", exact: true }).click();
    await page.getByRole("menuitem", { name: "Delete question?", exact: true }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Delete", exact: true }).click();
    await expect(
      page.getByRole("button", { name: /^Actions for question / }),
    ).toHaveCount(1);

    await page.getByRole("button", { name: "Back to Assessments" }).click();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/en\/grades\/assessments/);
    await expect(page).toHaveURL(/year=year-2/);
    await expect(page).toHaveURL(/term=term-2-1/);

    await expectNoPageErrors(pageErrors);
  });
});
