import { test, expect, type Page } from "@playwright/test";
import {
  chooseSelectOption,
  expectNoPageErrors,
  expectSharedAttendanceContextBar,
  expandContextBar,
  makeRollCallDirty,
  setupEditableRollCallSession,
  sharedAttendanceRoutes,
  trackPageErrors,
  triggerInjectedInternalNavigation,
  withAttendanceQuery,
} from "./attendance-test-helpers";

test.describe("Attendance Migrated Smoke", () => {
  test.describe.configure({ mode: "serial" });
  test.use({ viewport: { width: 1700, height: 1100 } });
  const unsavedChangesDialog = (page: Page) =>
    page.getByRole("heading", { name: "Unsaved Changes" });

  test("shared-layout attendance pages render under one visible context bar", async ({
    page,
  }) => {
    const pageErrors = trackPageErrors(page);

    for (const route of sharedAttendanceRoutes) {
      await page.goto(withAttendanceQuery(route));
      await page.waitForLoadState("networkidle");
      await expectSharedAttendanceContextBar(page);
      await expect(page).toHaveURL(
        new RegExp(`${route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`),
      );
      await expect(page).toHaveURL(/year=year-1/);
      await expect(page).toHaveURL(/term=term-1-1/);
    }

    await expectNoPageErrors(pageErrors);
  });

  test("attendance page entry points render safely under the shared layout", async ({
    page,
  }) => {
    const pageErrors = trackPageErrors(page);

    await page.goto(withAttendanceQuery("/en/attendance/absences"));
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Filters").first()).toBeVisible();

    await page.goto(withAttendanceQuery("/en/attendance/late-early"));
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Filters").first()).toBeVisible();

    await page.goto(withAttendanceQuery("/en/attendance/excuses"));
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Create request" }).click();
    await expect(page.getByText("Student", { exact: true })).toBeVisible();
    await page.keyboard.press("Escape");

    await page.goto(
      withAttendanceQuery("/en/attendance/reports", {
        scope: "GRADE",
        stageId: "stage-1",
        gradeId: "grade-1",
        from: "2024-09-01",
        to: "2024-12-31",
        dataset: "risk",
        attendanceStatus: "LATE",
      }),
    );
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/scope=GRADE/);
    await expect(page).toHaveURL(/stageId=stage-1/);
    await expect(page).toHaveURL(/gradeId=grade-1/);
    await expect(page).toHaveURL(/dataset=risk/);
    await expect(page).toHaveURL(/attendanceStatus=LATE/);
    await page.reload();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/scope=GRADE/);
    await expect(page).toHaveURL(/dataset=risk/);
    const reportsExportButton = page.getByRole("button", { name: "Export" });
    await expect(reportsExportButton).toBeVisible();
    if (await reportsExportButton.isEnabled()) {
      await reportsExportButton.click();
      await expect(page.getByText("CSV", { exact: true })).toBeVisible();
    }

    await expectNoPageErrors(pageErrors);
  });

  test("roll-call preserves roster filter query state and renders shared-layout actions", async ({
    page,
  }) => {
    const pageErrors = trackPageErrors(page);

    await page.goto(
      withAttendanceQuery("/en/attendance/roll-call", {
        search: "ali",
        status: "LATE",
        excuseCompleteness: "MISSING",
        lateMin: "5",
        earlyLeaveMin: "3",
      }),
    );
    await page.waitForLoadState("networkidle");
    await expectSharedAttendanceContextBar(page);
    await expect(page).toHaveURL(/search=ali/);
    await expect(page).toHaveURL(/status=LATE/);
    await expect(page).toHaveURL(/excuseCompleteness=MISSING/);
    await expect(page).toHaveURL(/lateMin=5/);
    await expect(page).toHaveURL(/earlyLeaveMin=3/);
    await page.reload();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/search=ali/);
    await expect(page).toHaveURL(/status=LATE/);

    await setupEditableRollCallSession(page);
    await expect(page.getByRole("button", { name: "Export" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Save" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Submit" })).toBeVisible();

    await expectNoPageErrors(pageErrors);
  });

  test("roll-call dirty state guards year and term changes through the shared context bar", async ({
    page,
  }) => {
    const pageErrors = trackPageErrors(page);

    await setupEditableRollCallSession(page);
    await makeRollCallDirty(page);

    await expandContextBar(page);
    await chooseSelectOption(page, "Term", "Term 2");
    await expect(unsavedChangesDialog(page)).toBeVisible();
    await page.getByRole("button", { name: "Stay" }).click();
    await expect(page).toHaveURL(/term=term-1-1/);

    await expandContextBar(page);
    await chooseSelectOption(page, "Term", "Term 2");
    await expect(unsavedChangesDialog(page)).toBeVisible();
    await page.getByRole("button", { name: "Discard" }).click();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/term=term-1-2/);

    await expectNoPageErrors(pageErrors);
  });

  test("roll-call dirty state guards internal navigation", async ({
    page,
  }) => {
    const pageErrors = trackPageErrors(page);

    await page.goto(withAttendanceQuery("/en/attendance/policies"));
    await page.waitForLoadState("networkidle");
    await setupEditableRollCallSession(page);
    await makeRollCallDirty(page);

    await triggerInjectedInternalNavigation(
      page,
      withAttendanceQuery("/en/attendance/reports"),
    );
    await expect(unsavedChangesDialog(page)).toBeVisible();
    await page.getByRole("button", { name: "Stay" }).click();
    await expect(page).toHaveURL(/\/en\/attendance\/roll-call/);

    await triggerInjectedInternalNavigation(
      page,
      withAttendanceQuery("/en/attendance/reports"),
    );
    await expect(unsavedChangesDialog(page)).toBeVisible();
    await page.getByRole("button", { name: "Discard" }).click();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/en\/attendance\/reports/);

    await expectNoPageErrors(pageErrors);
  });
});
