import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "./constants";
import { backendApiBaseUrl, backendHeaders, privateResponse, safeUpstreamResponse, sessionError } from "./backend";
import { clearSessionCookies, setSessionCookies, type BackendLoginResponse } from "./session-cookies";

export async function exchangeTokens(request: NextRequest, endpoint: "login" | "refresh") {
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  if (endpoint === "refresh" && !refreshToken) {
    const response = sessionError("Unauthorized", 401);
    clearSessionCookies(response);
    return response;
  }
  const upstream = await fetch(`${backendApiBaseUrl()}/auth/${endpoint}`, {
    method: "POST", headers: { "Content-Type": "application/json", "User-Agent": request.headers.get("user-agent") ?? "" },
    body: endpoint === "refresh" ? JSON.stringify({ refreshToken }) : await request.text(),
    cache: "no-store", redirect: "manual", signal: request.signal,
  });
  if (!upstream.ok) {
    const response = safeUpstreamResponse(upstream);
    if (upstream.status === 401) clearSessionCookies(response);
    return response;
  }
  const login: BackendLoginResponse = await upstream.json();
  if (!login.accessToken || !login.refreshToken || !Number.isFinite(login.expiresIn) || login.expiresIn <= 0) {
    return sessionError("Invalid authentication response", 502);
  }
  const response = privateResponse(NextResponse.json({ user: login.user }));
  setSessionCookies(response, login);
  return response;
}

export async function logout(request: NextRequest) {
  const response = privateResponse(new NextResponse(null, { status: 204 }));
  clearSessionCookies(response);
  try {
    await revokeBackendSession(request);
  } catch (error) {
    if (!(error instanceof TypeError) && !(error instanceof DOMException)) throw error;
    console.warn("Backend logout unavailable; dashboard cookies cleared.");
  }
  return response;
}

async function revokeBackendSession(request: NextRequest) {
  const signal = AbortSignal.timeout(5000);
  const headers = backendHeaders(request);
  const revoke = () => fetch(`${backendApiBaseUrl()}/auth/logout`, {
    method: "POST", headers, cache: "no-store", redirect: "manual", signal,
  });
  if (request.cookies.has(ACCESS_COOKIE)) {
    const revoked = await revoke();
    if (revoked.status !== 401) return;
  }
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) return;
  const refreshed = await fetch(`${backendApiBaseUrl()}/auth/refresh`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refreshToken }),
    cache: "no-store", redirect: "manual", signal,
  });
  if (!refreshed.ok) return;
  const login: BackendLoginResponse = await refreshed.json();
  headers.set("Authorization", `Bearer ${login.accessToken}`);
  await revoke();
}
