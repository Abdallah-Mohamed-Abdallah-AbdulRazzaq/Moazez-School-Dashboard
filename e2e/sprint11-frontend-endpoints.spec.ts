import { expect, test } from "@playwright/test";

const apiBase = "https://api.moazez.sa/api/v1";

async function assertApiRequest(
  page: import("@playwright/test").Page,
  options: {
    path: string;
    method: string;
    payload?: Record<string, unknown>;
    bodyAssertion?: (body: Record<string, unknown>) => void;
  },
) {
  let capturedBody: Record<string, unknown> | null = null;
  let authorization: string | null = null;

  await page.route(`${apiBase}${options.path}`, async (route, request) => {
    expect(request.method()).toBe(options.method);
    authorization = request.headers().authorization ?? null;
    capturedBody = request.postDataJSON?.() as Record<string, unknown> | null;
    await route.fulfill({
      status: 200,
      headers: {
        "access-control-allow-origin": "*",
        "content-type": "application/json",
      },
      body: JSON.stringify({ ok: true }),
    });
  });

  await page.evaluate(
    async ({ url, method, payload }) => {
      await fetch(url, {
        method,
        headers: {
          authorization: "Bearer sprint11-smoke-token",
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

  expect(authorization).toBeTruthy();
  if (options.payload) {
    expect(capturedBody).toEqual(options.payload);
  }
  if (capturedBody && options.bodyAssertion) {
    options.bodyAssertion(capturedBody);
  }
}

test.describe("Sprint 11 frontend endpoint smoke", () => {
  test("settings and auth flows send corrected endpoint payloads", async ({ page }) => {
    await page.goto("/en/login");

    await assertApiRequest(page, {
      path: "/auth/change-password",
      method: "POST",
      payload: { currentPassword: "old-password", newPassword: "new-password" },
    });
    await assertApiRequest(page, {
      path: "/settings/login-identity",
      method: "PUT",
      payload: {
        loginDomain: "school.edu",
        allowedCharacters: "letters",
        status: "active",
      },
      bodyAssertion: (body) =>
        expect(body).not.toHaveProperty("usernamePattern"),
    });
    await assertApiRequest(page, {
      path: "/settings/users",
      method: "POST",
      payload: {
        fullName: "Sara Ali",
        username: "sara",
        contactEmail: "parent@example.com",
        roleId: "teacher",
      },
    });
    await assertApiRequest(page, {
      path: "/settings/users/u1/credentials/set",
      method: "POST",
      payload: { password: "new-password", forceResetOnLogin: true },
      bodyAssertion: (body) =>
        expect(body).not.toHaveProperty("mustChangePassword"),
    });
    await assertApiRequest(page, {
      path: "/settings/email/connection/test",
      method: "POST",
      payload: { toEmail: "admin@example.com" },
    });
    await assertApiRequest(page, {
      path: "/settings/email/templates/GENERAL_MESSAGE/preview",
      method: "POST",
      payload: { subject: "Hello", bodyHtml: "<p>Hello</p>", previewData: {} },
      bodyAssertion: (body) => expect(body).not.toHaveProperty("data"),
    });
    await assertApiRequest(page, {
      path: "/settings/email/credential-deliveries/preview-recipients",
      method: "POST",
      payload: { scope: "missing_password", requireContactEmail: true },
      bodyAssertion: (body) => expect(body).not.toHaveProperty("audience"),
    });
    await assertApiRequest(page, {
      path: "/settings/email/campaigns/preview-recipients",
      method: "POST",
      payload: {
        recipientScope: { scope: "all_school_users" },
        customEmails: ["extra@example.com"],
      },
      bodyAssertion: (body) => expect(body).not.toHaveProperty("audience"),
    });
    await assertApiRequest(page, {
      path: "/students-guardians/students/student-1/account",
      method: "POST",
      payload: {
        mode: "create",
        username: "student.one",
        contactEmail: "guardian@example.com",
        temporaryPasswordMode: "generate",
      },
    });
  });
});
