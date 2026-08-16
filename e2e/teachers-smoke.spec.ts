import { expect, test } from "@playwright/test";
import {
  expectNoPageErrors,
  mockTeacherDirectory,
  teacherRecord,
  trackPageErrors,
} from "./teachers-test-helpers";

test.describe("Teacher Directory", () => {
  test.beforeEach(async ({ page }) => {
    await mockTeacherDirectory(page);
  });

  test("renders contract-backed rows without academic context", async ({ page }) => {
    const pageErrors = trackPageErrors(page);
    await page.goto("/en/teachers");
    await expect(page.getByRole("heading", { name: "Teachers Management" })).toBeVisible();
    await expect(page.getByText(teacherRecord.displayName.fullName)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Academic Context" })).toHaveCount(0);
    await expectNoPageErrors(pageErrors);
  });

  test("keeps supported server filters in the URL", async ({ page }) => {
    await page.goto("/en/teachers?employmentStatus=ACTIVE&gender=FEMALE");
    await expect(page).toHaveURL(/employmentStatus=ACTIVE/);
    await expect(page).toHaveURL(/gender=FEMALE/);
    await expect(page.getByText(teacherRecord.teacherCode)).toBeVisible();
  });

  test("debounces search into the server-backed URL", async ({ page }) => {
    await page.goto("/en/teachers");
    await page.getByPlaceholder("Search by code, name, email, or phone").fill("Nour");
    await expect(page).toHaveURL(/search=Nour/);
  });

  test("opens the dedicated teacher detail route", async ({ page }) => {
    await page.goto("/en/teachers");
    await page.getByText(teacherRecord.displayName.fullName).click();
    await expect(page).toHaveURL(`/en/teachers/${teacherRecord.id}`);
    await expect(page.getByText(teacherRecord.loginEmail)).toBeVisible();
    await expect(page.getByRole("button", { name: "Change Password" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Activate" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Terminate" })).toBeVisible();
    await expect(page.getByRole("button", { name: /rehire/i })).toHaveCount(0);
  });

  test("opens contract-scoped create, edit, and archive dialogs", async ({ page }) => {
    await page.goto("/en/teachers");
    await page.getByRole("button", { name: "Add Teacher" }).click();
    await expect(page.getByRole("heading", { name: "Add Teacher" })).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();

    await page.getByText(teacherRecord.displayName.fullName).click();
    await page.getByRole("button", { name: "Edit" }).click();
    await expect(page.getByRole("heading", { name: "Edit Teacher" })).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
    await page.getByRole("button", { name: "Archive" }).click();
    await expect(page.getByRole("heading", { name: "Archive teacher" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Export" })).toHaveCount(0);
  });

  test("regenerates a teacher credential using the one-time reveal flow", async ({ page }) => {
    await page.goto(`/en/teachers/${teacherRecord.id}`);
    await page.getByRole("button", { name: "Regenerate temporary password" }).click();
    const confirmation = page.getByRole("dialog");
    await confirmation.getByRole("button", { name: "Regenerate temporary password" }).click();
    await expect(page.getByText("MZ-7KQ9-PL2R")).toBeVisible();
    await expect(page.getByText(/shown once only/i)).toBeVisible();
  });
});
