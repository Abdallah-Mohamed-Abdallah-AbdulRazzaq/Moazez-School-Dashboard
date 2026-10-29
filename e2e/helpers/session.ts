import { test, type Page } from "@playwright/test";

export async function installSessionCookies(page: Page) {
  const url = test.info().project.use.baseURL ?? "http://localhost:3000";
  await page.context().addCookies([
    { name: "moazez_session_refresh", value: "test-session", url, httpOnly: true, sameSite: "Lax" },
    { name: "__Host-moazez-refresh", value: "test-session", url: url.replace(/^http:/, "https:"), httpOnly: true, secure: true, sameSite: "Lax" },
  ]);
}

export async function installLocalSessionNavigation(page: Page, baseURL: string) {
  const origin = new URL(baseURL).origin;
  await page.route("**/*", async route => {
    const request = route.request();
    const url = new URL(request.url());
    const headers = request.headers();
    if (url.origin !== origin || (!request.isNavigationRequest() && headers.rsc !== "1")) return route.fallback();
    // WebKit does not send Secure cookies over local HTTP. Supply only the fake
    // session marker to local page requests; API authentication is mocked separately.
    const response = await route.fetch({
      headers: { ...headers, cookie: [headers.cookie, "__Host-moazez-refresh=test-session", "moazez_session_refresh=test-session"].filter(Boolean).join("; ") },
    });
    return route.fulfill({ response });
  });
}
