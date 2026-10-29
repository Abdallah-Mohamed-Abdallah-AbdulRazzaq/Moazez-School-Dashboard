import { NextRequest } from "next/server";
import { ACCESS_COOKIE, REALTIME_TOKEN_HEADER } from "@/lib/auth/constants";
import { backendApiBaseUrl, backendHeaders, isTrustedMutation, safeUpstreamResponse, sessionError } from "@/lib/auth/backend";
import { exchangeTokens, logout } from "@/lib/auth/server-session";
import { downloadFileResponse } from "@/lib/files/server-download";

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
  const response = safeUpstreamResponse(upstream);
  // The existing Socket.IO backend requires a browser-supplied access token.
  if (upstream.ok && endpoint === "auth/me") {
    response.headers.set(REALTIME_TOKEN_HEADER, request.cookies.get(ACCESS_COOKIE)!.value);
  }
  return response;
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
  if (request.method === "GET" && path.length === 3 && path[0] === "files" && path[2] === "download") {
    return downloadFileResponse(request, path[1]);
  }
  return forwardRequest(request, endpoint);
}

export { route as GET, route as HEAD, route as POST, route as PUT, route as PATCH, route as DELETE };
