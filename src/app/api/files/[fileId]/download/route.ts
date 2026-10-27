import { NextRequest } from "next/server";
import { ACCESS_COOKIE } from "@/lib/auth/constants";
import { backendApiBaseUrl, streamedResponse, sessionError } from "@/lib/auth/backend";

interface DownloadRouteContext {
  params: Promise<{ fileId: string }>;
}

export async function GET(
  request: NextRequest,
  context: DownloadRouteContext,
): Promise<Response> {
  const token = request.cookies.get(ACCESS_COOKIE)?.value;
  const authorization = token ? "Bearer " + token : null;
  if (!authorization) {
    return sessionError("Unauthorized", 401);
  }

  const apiBaseUrl = backendApiBaseUrl();

  const { fileId } = await context.params;
  const backendResponse = await fetch(
    `${apiBaseUrl}/files/${encodeURIComponent(fileId)}/download`,
    {
      headers: { authorization },
      cache: "no-store",
      redirect: "manual",
      signal: request.signal,
    },
  );

  if (backendResponse.headers.get("content-type")?.includes("text/html")) {
    return sessionError("The storage server returned HTML instead of file content", 502);
  }

  if (backendResponse.status >= 300 && backendResponse.status < 400) {
    return sessionError("Unexpected backend redirect", 502);
  }
  return streamedResponse(backendResponse);
}
