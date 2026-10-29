import { NextRequest } from "next/server";
import { ACCESS_COOKIE } from "@/lib/auth/constants";
import { backendApiBaseUrl, sessionError, streamedResponse } from "@/lib/auth/backend";

async function downloadStorageRedirect(upstream: Response, request: NextRequest, downloadUrl: string): Promise<Response> {
  const location = upstream.headers.get("location");
  if (!location) return sessionError("Missing storage redirect", 502);
  let storageUrl: URL;
  try {
    storageUrl = new URL(location, downloadUrl);
  } catch (error) {
    if (!(error instanceof TypeError)) throw error;
    return sessionError("Invalid storage redirect", 502);
  }
  if (!["http:", "https:"].includes(storageUrl.protocol)) return sessionError("Invalid storage redirect", 502);
  await upstream.body?.cancel();
  // Signed storage URLs authorize the download themselves; never forward session credentials.
  return fetch(storageUrl, { cache: "no-store", redirect: "follow", signal: request.signal });
}

export async function downloadFileResponse(request: NextRequest, fileId: string): Promise<Response> {
  const token = request.cookies.get(ACCESS_COOKIE)?.value;
  if (!token) return sessionError("Unauthorized", 401);
  const downloadUrl = `${backendApiBaseUrl()}/files/${encodeURIComponent(fileId)}/download${request.nextUrl.search}`;
  let upstream = await fetch(downloadUrl, {
    headers: { authorization: `Bearer ${token}` },
    cache: "no-store", redirect: "manual", signal: request.signal,
  });
  if (upstream.status >= 300 && upstream.status < 400) {
    upstream = await downloadStorageRedirect(upstream, request, downloadUrl);
  }
  if (upstream.headers.get("content-type")?.includes("text/html")) {
    return sessionError("The storage server returned HTML instead of file content", 502);
  }
  return streamedResponse(upstream);
}
