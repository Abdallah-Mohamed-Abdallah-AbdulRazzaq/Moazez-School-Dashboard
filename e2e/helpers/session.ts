import { test, type Page } from "@playwright/test";

export async function installSessionCookies(page: Page) {
  const url = test.info().project.use.baseURL ?? "http://localhost:3000";
  await page.context().addCookies([
    { name: "moazez_session_refresh", value: "test-session", url, httpOnly: true, sameSite: "Lax" },
    { name: "__Host-moazez-refresh", value: "test-session", url: url.replace(/^http:/, "https:"), httpOnly: true, secure: true, sameSite: "Lax" },
  ]);
}
