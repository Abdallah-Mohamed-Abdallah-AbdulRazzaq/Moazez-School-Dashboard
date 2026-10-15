import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

describe("file download proxy", () => {
  beforeEach(() => {
    vi.stubEnv("API_PROXY_TARGET", "https://api.test/api/v1");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "/api/backend");
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("forwards authorization and streams the backend download", async () => {
    const backendResponse = new Response("pdf-data", {
      status: 200,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": 'attachment; filename="lesson.pdf"',
      },
    });
    const fetchMock = vi.fn().mockResolvedValue(backendResponse);
    vi.stubGlobal("fetch", fetchMock);
    const request = new NextRequest("https://dashboard.test/api/files/file-1/download", {
      headers: { authorization: "Bearer token-1" },
    });

    const response = await GET(request, { params: Promise.resolve({ fileId: "file-1" }) });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.test/api/v1/files/file-1/download",
      expect.objectContaining({
        headers: { authorization: "Bearer token-1" },
        cache: "no-store",
        redirect: "follow",
      }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("content-disposition")).toBe(
      'attachment; filename="lesson.pdf"',
    );
    expect(await response.text()).toBe("pdf-data");
  });

  it("rejects requests without authorization", async () => {
    const request = new NextRequest("https://dashboard.test/api/files/file-1/download");

    const response = await GET(request, { params: Promise.resolve({ fileId: "file-1" }) });

    expect(response.status).toBe(401);
  });

  it("streams a 35 MiB download without forwarding the fixed content length", async () => {
    const chunkSize = 1024 * 1024;
    const chunkCount = 35;
    let producedChunks = 0;
    const fileStream = new ReadableStream<Uint8Array>({
      pull(controller) {
        controller.enqueue(new Uint8Array(chunkSize).fill(producedChunks));
        producedChunks += 1;
        if (producedChunks === chunkCount) controller.close();
      },
    }, { highWaterMark: 0 });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(fileStream, {
      headers: {
        "content-type": "application/octet-stream",
        "content-disposition": 'attachment; filename="large.zip"',
        "content-length": String(chunkSize * chunkCount),
      },
    })));
    const request = new NextRequest("https://dashboard.test/api/files/file-1/download", {
      headers: { authorization: "Bearer token-1" },
    });

    const response = await GET(request, { params: Promise.resolve({ fileId: "file-1" }) });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-length")).toBeNull();
    expect(response.headers.get("content-disposition")).toBe('attachment; filename="large.zip"');
    expect(producedChunks).toBe(0);
    const reader = response.body!.getReader();
    let receivedBytes = 0;
    for (let chunkIndex = 0; chunkIndex < chunkCount; chunkIndex += 1) {
      const chunk = await reader.read();
      expect(chunk.done).toBe(false);
      expect(chunk.value?.byteLength).toBe(chunkSize);
      expect(chunk.value?.every((byte) => byte === chunkIndex)).toBe(true);
      receivedBytes += chunk.value!.byteLength;
    }
    expect((await reader.read()).done).toBe(true);
    expect(receivedBytes).toBe(35 * 1024 * 1024);
  });

  it("does not return an upstream HTML error as a downloadable file", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("<html>Error</html>", {
          status: 200,
          headers: { "content-type": "text/html" },
        }),
      ),
    );
    const request = new NextRequest("https://dashboard.test/api/files/file-1/download", {
      headers: { authorization: "Bearer token-1" },
    });

    const response = await GET(request, { params: Promise.resolve({ fileId: "file-1" }) });

    expect(response.status).toBe(502);
  });
});
