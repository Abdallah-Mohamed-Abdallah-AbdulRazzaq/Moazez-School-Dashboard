import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest): Promise<Response> {
  const targetUrl = request.nextUrl.searchParams.get("targetUrl");
  if (!targetUrl) {
    return NextResponse.json(
      { error: "Missing targetUrl parameter" },
      { status: 400 },
    );
  }

  try {
    const contentType =
      request.headers.get("content-type") || "application/octet-stream";
    const body = await request.arrayBuffer();

    const response = await fetch(targetUrl, {
      method: "PUT",
      headers: {
        "Content-Type": contentType,
      },
      body,
      redirect: "follow",
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      return NextResponse.json(
        { error: `Storage server returned status ${response.status}: ${text}` },
        { status: response.status },
      );
    }

    return new Response(null, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to proxy upload";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
