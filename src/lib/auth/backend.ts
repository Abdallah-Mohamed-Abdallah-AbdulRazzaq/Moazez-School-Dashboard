import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE, CSRF_HEADER } from "./constants";

export function backendApiBaseUrl(): string {
  const configured = process.env.API_PROXY_TARGET || process.env.NEXT_PUBLIC_API_URL;
  if (!configured || !/^https?:\/\//.test(configured)) {
    throw new Error("Configure API_PROXY_TARGET or an absolute NEXT_PUBLIC_API_URL on the server.");
  }
  return configured.replace(/\/$/, "");
}

export function isTrustedMutation(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  return request.headers.get(CSRF_HEADER) === "1" &&
    request.headers.get("sec-fetch-site") !== "cross-site" &&
    (!origin || origin === request.nextUrl.origin);
}

export function privateResponse(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Vary", "Cookie");
  response.headers.set("Content-Security-Policy", "default-src 'none'; sandbox");
  return response;
}

export function sessionError(message: string, status: number): NextResponse {
  return privateResponse(NextResponse.json({ message }, { status }));
}

export function backendHeaders(request: NextRequest): Headers {
  const headers = new Headers();
  for (const name of ["content-type", "accept", "accept-language", "user-agent"]) {
    const header = request.headers.get(name);
    if (header) headers.set(name, header);
  }
  const token = request.cookies.get(ACCESS_COOKIE)?.value;
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return headers;
}

export function streamedResponse(upstream: Response): NextResponse {
  const headers = new Headers();
  for (const name of ["content-type", "content-disposition", "retry-after"]) {
    const header = upstream.headers.get(name);
    if (header) headers.set(name, header);
  }
  return privateResponse(new NextResponse(upstream.body, { status: upstream.status, headers }));
}

export function safeUpstreamResponse(upstream: Response): NextResponse {
  if (upstream.status >= 300 && upstream.status < 400) {
    return sessionError("Unexpected backend redirect", 502);
  }
  return streamedResponse(upstream);
}
