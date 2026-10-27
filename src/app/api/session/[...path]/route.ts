import { NextRequest } from "next/server";
import { ACCESS_COOKIE } from "@/lib/auth/constants";
import { backendApiBaseUrl, backendHeaders, isTrustedMutation, safeUpstreamResponse, sessionError } from "@/lib/auth/backend";
import { exchangeTokens, logout } from "@/lib/auth/server-session";

interface RouteContext { params: Promise<{ path: string[] }> }
const AUTH_METHODS: Record<string, string> = {
  "auth/login": "POST", "auth/refresh": "POST", "auth/logout": "POST",
  "auth/me": "GET", "auth/change-password": "POST",
};

function isValidBackendPath(path: string[]) {
  return path.every(segment => segment && segment !== "." && segment !== ".." && !/[\\/%?#]/.test(segment));
}

async function forwardRequest(request: NextRequest, endpoint: string) {
  const upstream = await fetch(backendApiBaseUrl() + "/" + endpoint + request.nextUrl.search, {
    method: request.method, headers: backendHeaders(request),
    body: ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer(),
    cache: "no-store", redirect: "manual", signal: request.signal,
  });
  return safeUpstreamResponse(upstream);
}

async function route(request: NextRequest, context: RouteContext): Promise<Response> {
  const { path } = await context.params;
  if (!isValidBackendPath(path)) return sessionError("Invalid API path", 400);
  if (!["GET", "HEAD"].includes(request.method) && !isTrustedMutation(request)) {
    return sessionError("Invalid request origin", 403);
  }
  const endpoint = path.join("/");
  if (path[0] === "auth" && AUTH_METHODS[endpoint] !== request.method) return sessionError("Method not allowed", 405);
  if (endpoint === "auth/logout") return logout(request);
  if (endpoint === "auth/login" || endpoint === "auth/refresh") {
    return exchangeTokens(request, endpoint === "auth/login" ? "login" : "refresh");
  }
  if (!request.cookies.has(ACCESS_COOKIE)) return sessionError("Unauthorized", 401);
  return forwardRequest(request, endpoint);
}

export { route as GET, route as HEAD, route as POST, route as PUT, route as PATCH, route as DELETE };
