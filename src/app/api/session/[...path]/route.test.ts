import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";
import { ACCESS_COOKIE, CSRF_HEADER, REFRESH_COOKIE } from "@/lib/auth/constants";

const login = { accessToken: "secret-access", refreshToken: "secret-refresh", expiresIn: 900, user: { id: "user-1" } };
const fetchMock = vi.fn<typeof fetch>();
function request(path: string, options: { method?: string; cookie?: string; origin?: string; csrf?: string; body?: string } = {}) {
  return new NextRequest(`https://dashboard.test/api/session/${path}`, {
    method: options.method ?? "POST",
    headers: { origin: options.origin ?? "https://dashboard.test", [CSRF_HEADER]: options.csrf ?? "1",
      "content-type": "application/json", ...(options.cookie ? { cookie: options.cookie } : {}) },
    body: options.body,
  });
}
function context(path: string) { return { params: Promise.resolve({ path: path.split("/") }) }; }

describe("dashboard server session boundary", () => {
  beforeEach(() => {
    vi.stubEnv("API_PROXY_TARGET", "https://backend.test/api/v1");
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

  it.each(["login", "refresh"])("keeps %s credentials in host-only HttpOnly cookies", async endpoint => {
    fetchMock.mockResolvedValue(Response.json(login));
    const response = await POST(request(`auth/${endpoint}`, {
      cookie: `${REFRESH_COOKIE}=original-refresh`, body: JSON.stringify({ email: "qa@test", password: "test-only" }),
    }), context(`auth/${endpoint}`));
    expect(await response.json()).toEqual({ user: { id: "user-1" } });
    expect(response.headers.get("cache-control")).toBe("no-store");
    for (const [name, token] of [[ACCESS_COOKIE, login.accessToken], [REFRESH_COOKIE, login.refreshToken]]) {
      const cookie = response.cookies.get(name);
      expect(cookie).toMatchObject({ value: token, httpOnly: true, sameSite: "lax", path: "/" });
      expect(cookie?.domain).toBeUndefined();
    }
    if (endpoint === "refresh") {
      expect(JSON.parse(fetchMock.mock.calls[0][1]!.body as string)).toEqual({ refreshToken: "original-refresh" });
    }
  });

  it.each([
    { origin: "https://attacker.test" },
    { csrf: "" },
  ])("rejects untrusted mutations before contacting the backend: %j", async options => {
    const response = await POST(request("auth/login", options), context("auth/login"));
    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("uses only the server access cookie for authorization and streams the upstream response", async () => {
    fetchMock.mockResolvedValue(new Response("private-content", {
      headers: { "content-type": "text/plain", "set-cookie": "upstream=secret", "content-length": "15" },
    }));
    const incoming = request("files/file-1/download?inline=true", { method: "GET", cookie: `${ACCESS_COOKIE}=server-token` });
    incoming.headers.set("Authorization", "Bearer attacker-token");
    const response = await GET(incoming, context("files/file-1/download"));
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("https://backend.test/api/v1/files/file-1/download?inline=true");
    expect(new Headers(options?.headers).get("authorization")).toBe("Bearer server-token");
    expect(new Headers(options?.headers).has("cookie")).toBe(false);
    expect(response.headers.has("set-cookie")).toBe(false);
    expect(response.headers.has("content-length")).toBe(false);
    expect(response.headers.get("content-security-policy")).toContain("sandbox");
    expect(await response.text()).toBe("private-content");
  });

  it("does not accept a browser Bearer header in place of a session cookie", async () => {
    const incoming = request("auth/me", { method: "GET" });
    incoming.headers.set("authorization", "Bearer legacy-token");
    expect((await GET(incoming, context("auth/me"))).status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(["auth/login", "auth/refresh", "auth/logout", "auth/unknown"])("does not expose authentication endpoints through GET: %s", async path => {
    const response = await GET(request(path, { method: "GET", cookie: `${ACCESS_COOKIE}=secret` }), context(path));
    expect(response.status).toBe(405);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("uses the backend session to revoke logout and expires current and legacy cookies", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    const response = await POST(request("auth/logout", { cookie: `${ACCESS_COOKIE}=active-access` }), context("auth/logout"));
    expect(response.status).toBe(204);
    expect(new Headers(fetchMock.mock.calls[0][1]?.headers).get("authorization")).toBe("Bearer active-access");
    for (const name of [ACCESS_COOKIE, REFRESH_COOKIE, "moazez_access_token", "moazez_refresh_token"]) {
      expect(response.cookies.get(name)).toMatchObject({ value: "", maxAge: 0 });
    }
  });

  it("clears cookies when backend revocation is unreachable", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    try {
      const response = await POST(request("auth/logout", { cookie: `${ACCESS_COOKIE}=active-access` }), context("auth/logout"));
      expect(response.status).toBe(204);
      expect(response.cookies.get(REFRESH_COOKIE)?.maxAge).toBe(0);
    } finally { warning.mockRestore(); }
  });

  it("refreshes an expired access token only on the server before revoking logout", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(Response.json(login))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    const response = await POST(request("auth/logout", {
      cookie: `${ACCESS_COOKIE}=expired; ${REFRESH_COOKIE}=still-valid`,
    }), context("auth/logout"));
    expect(response.status).toBe(204);
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      "https://backend.test/api/v1/auth/logout", "https://backend.test/api/v1/auth/refresh", "https://backend.test/api/v1/auth/logout",
    ]);
    expect(new Headers(fetchMock.mock.calls[2][1]?.headers).get("authorization")).toBe("Bearer secret-access");
    expect(response.cookies.get(ACCESS_COOKIE)).toMatchObject({ value: "", maxAge: 0 });
  });

  it("clears a rejected refresh session so the page proxy can return to login", async () => {
    fetchMock.mockResolvedValue(Response.json({ message: "Invalid refresh token" }, { status: 401 }));
    const response = await POST(request("auth/refresh", { cookie: `${REFRESH_COOKIE}=revoked` }), context("auth/refresh"));
    expect(response.status).toBe(401);
    expect(response.cookies.get(REFRESH_COOKIE)?.maxAge).toBe(0);
  });

  it("does not forward backend redirects or their cookies", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 302, headers: { location: "https://attacker.test", "set-cookie": "leak=secret" } }));
    const response = await GET(request("auth/me", { method: "GET", cookie: `${ACCESS_COOKIE}=secret` }), context("auth/me"));
    expect(response.status).toBe(502);
    expect(response.headers.has("location")).toBe(false);
    expect(response.headers.has("set-cookie")).toBe(false);
    expect(fetchMock.mock.calls[0][1]?.redirect).toBe("manual");
  });

  it.each(["..", "%2e%2e", "https:%2f%2fattacker.test", "auth%2frefresh"])("rejects an escaping path segment: %s", async segment => {
    const response = await GET(request("resource", { method: "GET", cookie: `${ACCESS_COOKIE}=secret` }), { params: Promise.resolve({ path: [segment] }) });
    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("requires Secure and host-prefixed session cookies in production", async () => {
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "production");
    const productionRoute = await import("./route");
    fetchMock.mockResolvedValue(Response.json(login));
    const response = await productionRoute.POST(request("auth/login", { body: "{}" }), context("auth/login"));
    for (const name of ["__Host-moazez-access", "__Host-moazez-refresh"]) {
      expect(response.cookies.get(name)).toMatchObject({ secure: true, httpOnly: true, sameSite: "lax", path: "/" });
      expect(response.cookies.get(name)?.domain).toBeUndefined();
    }
  });
});
