import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const intlMiddleware = vi.hoisted(() => vi.fn(() => new Response(null)));

vi.mock("next-intl/middleware", () => ({
  default: vi.fn(() => intlMiddleware),
}));

function requestFor(path: string, cookie?: string) {
  return new NextRequest(`https://dashboard.test${path}`, {
    headers: cookie ? { cookie } : undefined,
  });
}

async function loadProxy() {
  const proxyModule = await import("../proxy");
  return proxyModule.default;
}

async function loadProxyConfig() {
  const proxyModule = await import("../proxy");
  return proxyModule.config;
}

function redirectLocation(response: Response) {
  return response.headers.get("location");
}

describe("proxy route protection", () => {
  beforeEach(() => {
    intlMiddleware.mockClear();
  });

  it("redirects unauthenticated English dashboard requests to English login", async () => {
    const proxy = await loadProxy();

    const response = proxy(requestFor("/en/dashboard"));

    expect(redirectLocation(response)).toBe(
      "https://dashboard.test/en/login?next=%2Fen%2Fdashboard",
    );
  });

  it("redirects unauthenticated Arabic dashboard requests to Arabic login", async () => {
    const proxy = await loadProxy();

    const response = proxy(requestFor("/ar/dashboard"));

    expect(redirectLocation(response)).toBe(
      "https://dashboard.test/ar/login?next=%2Far%2Fdashboard",
    );
  });

  it("redirects authenticated English login requests to English dashboard", async () => {
    const proxy = await loadProxy();

    const response = proxy(
      requestFor("/en/login", "moazez_session=session-token"),
    );

    expect(redirectLocation(response)).toBe("https://dashboard.test/en/dashboard");
  });

  it("redirects authenticated Arabic login requests to Arabic dashboard", async () => {
    const proxy = await loadProxy();

    const response = proxy(
      requestFor("/ar/login", "refreshToken=refresh-token"),
    );

    expect(redirectLocation(response)).toBe("https://dashboard.test/ar/dashboard");
  });

  it("routes root and locale-only paths by authentication state", async () => {
    const proxy = await loadProxy();

    expect(redirectLocation(proxy(requestFor("/")))).toBe(
      "https://dashboard.test/ar/login",
    );
    expect(
      redirectLocation(proxy(requestFor("/en", "moazez_refresh_token=token"))),
    ).toBe("https://dashboard.test/en/dashboard");
  });

  it("lets public unauthenticated routes continue to next-intl", async () => {
    const proxy = await loadProxy();

    proxy(requestFor("/en/forgot-password"));

    expect(intlMiddleware).toHaveBeenCalled();
  });

  it("excludes api, next internals, static files, images, and assets through the matcher", async () => {
    const config = await loadProxyConfig();

    expect(config.matcher).toEqual([
      "/((?!api|_next|images|assets|favicon.ico|.*\\..*).*)",
    ]);
  });
});
