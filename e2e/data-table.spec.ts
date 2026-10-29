import { test, expect, fulfillJson } from "./helpers/mock-session";

const applications = Array.from({ length: 25 }, (_, index) => ({
  id: `application-${index + 1}`, studentName: `Student ${String(index + 1).padStart(2, "0")}`,
  status: "submitted", source: "in_app", requestedGradeId: "grade-1", requestedAcademicYearId: "year-1",
  submittedAt: "2026-10-01T08:00:00Z", createdAt: "2026-10-01T08:00:00Z", updatedAt: "2026-10-01T08:00:00Z",
}));

test.beforeEach(async ({ page }) => {
  await page.route("**/api/session/admissions/applications", route => fulfillJson(route, applications));
  await page.goto("/en/admissions/applications");
  await expect(page.getByRole("table")).toBeVisible();
});

test("displays application rows", async ({ page }) => {
  await expect(page.getByRole("row").filter({ hasText: "Student 01" })).toBeVisible();
});

test("sorts application names in both directions", async ({ page }) => {
  const header = page.getByRole("columnheader", { name: /Student Name/i });
  await header.click();
  await expect(header).toHaveAttribute("aria-sort", "ascending");
  await expect(page.locator("tbody tr").first()).toContainText("Student 01");
  await header.click();
  await expect(header).toHaveAttribute("aria-sort", "descending");
  await expect(page.locator("tbody tr").first()).toContainText("Student 25");
});

test("moves to the next page of applications", async ({ page }) => {
  await page.getByRole("button", { name: "Next page", exact: true }).click();
  await expect(page).toHaveURL(/applicationsTablePage=2/);
  await expect(page.getByRole("row").filter({ hasText: "Student 11" })).toBeVisible();
  await expect(page.getByRole("row").filter({ hasText: "Student 01" })).toHaveCount(0);
});

test("filters applications by student name", async ({ page }) => {
  await page.getByRole("textbox", { name: /Search/i }).fill("Student 25");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(page.locator("tbody tr").first()).toContainText("Student 25");
});
