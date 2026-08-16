import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

describe("file download proxy", () => {
  beforeEach(() => vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.test/api/v1"));
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
