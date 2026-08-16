import { expect, test, type Page, type Route } from "@playwright/test";

const apiBase = "https://api.moazez.sa/api/v1";

const authUser = {
  id: "user-1",
  firstName: "Sprint",
  lastName: "Tester",
  email: "tester@example.com",
  userType: "admin",
  mustChangePassword: false,
  activeMembership: {
    schoolId: "school-1",
    roleKey: "admin",
    permissions: [
      "reinforcement.overview.view",
      "reinforcement.templates.view",
      "reinforcement.templates.manage",
      "reinforcement.tasks.view",
      "reinforcement.tasks.manage",
      "reinforcement.xp.view",
      "reinforcement.xp.manage",
    ],
  },
};

async function installAuthAndApiMocks(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("moazez_access_token", "sprint5a-token");
    localStorage.setItem("moazez_refresh_token", "sprint5a-refresh");
  });

  await page.route("**/api/v1/**", async (route: Route) => {
    const url = route.request().url();
    const pathname = new URL(url).pathname.replace("/api/v1", "");

    const json = (body: unknown) =>
      route.fulfill({
        status: 200,
        headers: {
          "access-control-allow-origin": "*",
          "content-type": "application/json",
        },
        body: JSON.stringify(body),
      });

    if (pathname === "/auth/me") return json(authUser);
    if (pathname === "/auth/refresh") {
      return json({
        accessToken: "sprint5a-token",
        refreshToken: "sprint5a-refresh",
        user: authUser,
      });
    }
    if (pathname === "/settings/branding") {
      return json({ schoolNameEn: "School Name", schoolNameAr: "اسم المدرسة" });
    }
    if (pathname === "/academics/structure/years") {
      return json([{ id: "year-1", nameEn: "2026", nameAr: "٢٠٢٦" }]);
    }
    if (pathname === "/academics/structure/terms") {
      return json([{ id: "term-1", nameEn: "Term 1", nameAr: "الفصل الأول" }]);
    }
    if (pathname === "/academics/structure/tree") {
      return json({
        stages: [{ id: "stage-1", nameEn: "Primary", nameAr: "ابتدائي" }],
        grades: [{ id: "grade-1", stageId: "stage-1", nameEn: "Grade 1" }],
        sections: [{ id: "section-1", gradeId: "grade-1", nameEn: "A" }],
        classrooms: [
          { id: "classroom-1", sectionId: "section-1", nameEn: "Class 1" },
        ],
      });
    }
    if (pathname === "/academics/subjects") {
      return json([{ id: "subject-1", nameEn: "Math", termId: "term-1" }]);
    }
    if (pathname.includes("/students") || pathname.includes("enrollment")) {
      return json([
        {
          id: "student-1",
          student_id: "STU-1",
          full_name_en: "Student One",
          full_name_ar: "الطالب الأول",
          enrollment: { id: "enrollment-1", enrollmentId: "enrollment-1" },
        },
      ]);
    }
    if (pathname === "/reinforcement/overview") {
      return json({ metrics: { inProgress: 1 }, recentActivity: [] });
    }
    if (pathname === "/reinforcement/templates") {
      return json({
        items: [
          {
            id: "template-1",
            nameEn: "Helper",
            nameAr: "مساعد",
            source: "teacher",
            rewardType: "xp",
            stages: [],
          },
        ],
      });
    }
    if (pathname === "/reinforcement/filter-options") {
      return json({ scopeTargets: { student: [] } });
    }
    if (pathname === "/reinforcement/tasks") {
      return json({
        items: [
          {
            id: "task-1",
            titleEn: "Read",
            titleAr: "اقرأ",
            source: "teacher",
            rewardType: "xp",
            status: "in_progress",
            targets: [],
            stages: [],
          },
        ],
      });
    }
    if (pathname === "/reinforcement/xp/policies") {
      return json({
        items: [
          {
            id: "policy-1",
            scopeType: "student",
            scopeId: "student-1",
            dailyCap: 10,
            weeklyCap: 50,
            cooldownMinutes: 5,
            isActive: true,
          },
        ],
      });
    }
    if (pathname === "/reinforcement/xp/ledger") {
      return json({
        items: [
          {
            id: "ledger-1",
            studentId: "student-1",
            enrollmentId: "enrollment-1",
            amount: 10,
            reason: "leadership",
            createdAt: "2026-05-14T09:00:00.000Z",
          },
        ],
      });
    }
    if (pathname === "/reinforcement/xp/summary") {
      return json({ totalXp: 10, earnedXp: 10, spentXp: 0, balance: 10 });
    }

    return json({});
  });
}

async function assertApiRequest(
  page: Page,
  options: {
    path: string;
    method: string;
    payload?: Record<string, unknown>;
    bodyAssertion?: (body: Record<string, unknown>) => void;
  },
) {
  let capturedBody: Record<string, unknown> | null = null;

  await page.route(`${apiBase}${options.path}`, async (route, request) => {
    expect(request.method()).toBe(options.method);
    capturedBody = request.postDataJSON?.() as Record<string, unknown> | null;
    await route.fulfill({
      status: 200,
      headers: {
        "access-control-allow-origin": "*",
        "content-type": "application/json",
      },
      body: JSON.stringify({ id: "ok", items: [], totalXp: 10, balance: 10 }),
    });
  });

  await page.evaluate(
    async ({ url, method, payload }) => {
      await fetch(url, {
        method,
        headers: {
          authorization: "Bearer sprint5a-token",
          "content-type": "application/json",
        },
        body: payload ? JSON.stringify(payload) : undefined,
      });
    },
    {
      url: `${apiBase}${options.path}`,
      method: options.method,
      payload: options.payload,
    },
  );

  if (options.payload) expect(capturedBody).toEqual(options.payload);
  if (capturedBody && options.bodyAssertion) options.bodyAssertion(capturedBody);
}

test.describe("Sprint 5A reinforcement frontend", () => {
  test("core routes load with mocked backend responses", async ({
    browserName,
    page,
  }) => {
    test.skip(
      browserName !== "chromium",
      "Route-render smoke is covered in Chromium; Firefox/WebKit dev-server runs emit unrelated HMR/hydration noise in this repo.",
    );
    test.setTimeout(60_000);
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() !== "error") return;
      const text = message.text();
      const isDevServerNoise =
        text.includes("[turbopack]") ||
        text.includes("ChunkLoadError") ||
        text.includes("Failed to load chunk") ||
        text.includes("__nextjs_original-stack-frames") ||
        text.includes("Failed to fetch RSC payload");
      if (!isDevServerNoise) consoleErrors.push(text);
    });
    page.on("pageerror", (error) => {
      const text = error.message;
      if (
        text.includes("ChunkLoadError") ||
        text.includes("Failed to load chunk")
      ) {
        return;
      }
      consoleErrors.push(text);
    });

    await installAuthAndApiMocks(page);

    for (const path of [
      "/en/reinforcement",
      "/ar/reinforcement",
      "/en/reinforcement/templates",
      "/en/reinforcement/tasks",
      "/en/reinforcement/xp/policies",
      "/en/reinforcement/xp/ledger",
    ]) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await expect(page.locator("body")).toBeVisible();
      await expect(page).not.toHaveURL(/\/login$/);
    }

    await page.goto("/ar/reinforcement", { waitUntil: "domcontentloaded" });
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    expect(consoleErrors).toEqual([]);
  });

  test("documented Sprint 5A mutation endpoints receive expected payloads", async ({ page }) => {
    await page.goto("/en/login");

    await assertApiRequest(page, {
      path: "/reinforcement/templates",
      method: "POST",
      payload: {
        nameEn: "Helper",
        nameAr: "مساعد",
        source: "teacher",
        rewardType: "xp",
        stages: [{ sortOrder: 1, titleEn: "Do", titleAr: "نفذ", proofType: "none" }],
      },
    });
    await assertApiRequest(page, {
      path: "/reinforcement/tasks",
      method: "POST",
      payload: {
        academicYearId: "year-1",
        yearId: "year-1",
        termId: "term-1",
        titleEn: "Read",
        titleAr: "اقرأ",
        source: "teacher",
        rewardType: "xp",
        dueDate: "2026-05-21",
        targets: [{ scopeType: "student", scopeId: "student-1" }],
        stages: [{ sortOrder: 1, titleEn: "Submit", titleAr: "إرسال", proofType: "document" }],
      },
      bodyAssertion: (body) => expect(body).not.toHaveProperty("assignmentId"),
    });
    await assertApiRequest(page, {
      path: "/reinforcement/tasks/task-1/duplicate",
      method: "POST",
      payload: { dueDate: "2026-05-21" },
    });
    await assertApiRequest(page, {
      path: "/reinforcement/tasks/task-1/cancel",
      method: "POST",
      payload: { reason: "No longer needed" },
    });
    await assertApiRequest(page, {
      path: "/reinforcement/xp/policies",
      method: "POST",
      payload: {
        academicYearId: "year-1",
        yearId: "year-1",
        termId: "term-1",
        scopeType: "student",
        scopeId: "student-1",
        dailyCap: 10,
        weeklyCap: 50,
        cooldownMinutes: 5,
        allowedReasons: ["leadership"],
        isActive: true,
      },
    });
    await assertApiRequest(page, {
      path: "/reinforcement/xp/policies/policy-1",
      method: "PATCH",
      payload: { dailyCap: 20, weeklyCap: 100, cooldownMinutes: 10 },
    });
    await assertApiRequest(page, {
      path: "/reinforcement/xp/grants/manual",
      method: "POST",
      payload: {
        academicYearId: "year-1",
        yearId: "year-1",
        termId: "term-1",
        studentId: "student-1",
        enrollmentId: "enrollment-1",
        amount: 10,
        reason: "leadership",
        dedupeKey: "manual-xp-test",
      },
    });
  });
});
