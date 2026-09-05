import { NextRequest, NextResponse } from "next/server";

interface DownloadRouteContext {
  params: Promise<{ fileId: string }>;
}

function backendApiBaseUrl() {
  const apiProxyTarget = process.env.API_PROXY_TARGET?.replace(/\/$/, "");
  if (apiProxyTarget) return apiProxyTarget;

  const publicApiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  return publicApiUrl?.startsWith("http") ? publicApiUrl : undefined;
}

export async function GET(
  request: NextRequest,
  context: DownloadRouteContext,
): Promise<Response> {
  const authorization = request.headers.get("authorization");
  if (!authorization) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiBaseUrl = backendApiBaseUrl();
  if (!apiBaseUrl) {
    return NextResponse.json({ error: "API URL is not configured" }, { status: 500 });
  }

  const { fileId } = await context.params;
  const backendResponse = await fetch(
    `${apiBaseUrl}/files/${encodeURIComponent(fileId)}/download`,
    {
      headers: { authorization },
      redirect: "follow",
      signal: request.signal,
    },
  );

  if (backendResponse.headers.get("content-type")?.includes("text/html")) {
    return NextResponse.json(
      { error: "The storage server returned HTML instead of file content" },
      { status: 502 },
    );
  }

  const responseHeaders = new Headers();
  for (const header of ["content-type", "content-disposition", "content-length"]) {
    const value = backendResponse.headers.get(header);
    if (value) responseHeaders.set(header, value);
  }

  return new Response(backendResponse.body, {
    status: backendResponse.status,
    headers: responseHeaders,
  });
}
