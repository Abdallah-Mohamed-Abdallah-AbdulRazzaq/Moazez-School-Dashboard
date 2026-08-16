import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { apiPost, apiClientGet } = vi.hoisted(() => ({
  apiPost: vi.fn(),
  apiClientGet: vi.fn(),
}));

vi.mock("@/lib/api", () => ({ apiPost, apiClient: { get: apiClientGet } }));

import { downloadFile, isCrossOriginUrl, normalizeUploadUrl, uploadFile, uploadLearningMedia } from "../filesService";

describe("filesService", () => {
  beforeEach(() => {
    apiPost.mockReset();
    apiClientGet.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("normalizes http upload URLs to https when on https origin", () => {
    vi.stubGlobal("window", { location: { protocol: "https:" } });
    expect(normalizeUploadUrl("http://storage.moazez.sa:9000/bucket/file")).toBe(
      "https://storage.moazez.sa:9000/bucket/file"
    );
  });

  it("uploads the file to /files as multipart field file", async () => {
    const response = {
      id: "file-1",
      originalName: "lesson.pdf",
      mimeType: "application/pdf",
      sizeBytes: "123",
      visibility: "PRIVATE",
      createdAt: "2026-06-19T00:00:00.000Z",
    };
    apiPost.mockResolvedValue(response);
    const file = new File(["pdf"], "lesson.pdf", { type: "application/pdf" });

    await expect(uploadFile(file)).resolves.toEqual(response);

    expect(apiPost).toHaveBeenCalledWith("/files", expect.any(FormData), {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const body = apiPost.mock.calls[0][1] as FormData;
    expect(body.get("file")).toBe(file);
  });

  it("creates, uploads, and completes a signed learning-media session", async () => {
    const file = new File(["lesson"], "lesson.txt", { type: "text/plain" });
    apiPost
      .mockResolvedValueOnce({
        id: "upload-1",
        status: "UPLOADING",
        uploadUrl: "https://storage.example.test/upload-1",
      })
      .mockResolvedValueOnce({
        id: "upload-1",
        fileId: "file-1",
        status: "READY",
        mimeType: "text/plain",
        sizeBytes: String(file.size),
        durationSeconds: null,
        width: null,
        height: null,
      });
    const progressUpdates: number[] = [];
    const stageUpdates: string[] = [];
    class UploadRequestMock {
      status = 200;
      private readonly eventHandlers: Record<string, () => void> = {};
      private uploadProgressHandler: ((event: ProgressEvent) => void) | null = null;
      upload = {
        addEventListener: (eventName: string, handler: (event: ProgressEvent) => void) => {
          if (eventName === "progress") this.uploadProgressHandler = handler;
        },
      };

      open = vi.fn();
      setRequestHeader = vi.fn();

      addEventListener(eventName: string, handler: () => void) {
        this.eventHandlers[eventName] = handler;
      }

      send = vi.fn(() => {
        this.uploadProgressHandler?.({
          lengthComputable: true,
          loaded: 3,
          total: 6,
        } as ProgressEvent);
        this.eventHandlers.load?.();
      });
    }
    vi.stubGlobal("XMLHttpRequest", UploadRequestMock);

    await expect(uploadLearningMedia(
      file,
      (stage) => stageUpdates.push(stage),
      (progress) => progressUpdates.push(progress),
    )).resolves.toEqual({
      id: "file-1",
      filename: "lesson.txt",
      mimeType: "text/plain",
      sizeBytes: String(file.size),
    });

    expect(apiPost).toHaveBeenNthCalledWith(
      1,
      "/academics/learning-media/uploads",
      expect.objectContaining({
        originalName: "lesson.txt",
        expectedMimeType: "text/plain",
        expectedSizeBytes: String(file.size),
      }),
    );
    expect(stageUpdates).toEqual(["preparing", "uploading", "verifying"]);
    expect(progressUpdates).toEqual([50, 100]);
    expect(apiPost).toHaveBeenNthCalledWith(
      2,
      "/academics/learning-media/uploads/upload-1/complete",
      {},
    );
  });

  it("identifies cross-origin URLs correctly", () => {
    vi.stubGlobal("window", { location: { origin: "http://localhost:3000" } });
    expect(isCrossOriginUrl("http://storage.moazez.sa:9000/bucket/file")).toBe(true);
    expect(isCrossOriginUrl("http://localhost:3000/upload")).toBe(false);
    expect(isCrossOriginUrl("/api/media/upload-proxy")).toBe(false);
  });

  it("proxies cross-origin storage URLs directly to prevent CORS preflight redirect errors", async () => {
    vi.stubGlobal("window", { location: { origin: "http://localhost:3000" } });
    const file = new File(["lesson"], "lesson.txt", { type: "text/plain" });
    const directUrl = "http://storage.moazez.sa:9000/bucket/file";
    apiPost
      .mockResolvedValueOnce({
        id: "upload-1",
        status: "UPLOADING",
        uploadUrl: directUrl,
      })
      .mockResolvedValueOnce({
        id: "upload-1",
        fileId: "file-1",
        status: "READY",
        mimeType: "text/plain",
        sizeBytes: String(file.size),
      });

    const openedUrls: string[] = [];

    class DirectProxyUploadMock {
      status = 200;
      private readonly eventHandlers: Record<string, () => void> = {};
      upload = { addEventListener: vi.fn() };

      open = vi.fn((_method: string, url: string) => {
        openedUrls.push(url);
      });
      setRequestHeader = vi.fn();

      addEventListener(eventName: string, handler: () => void) {
        this.eventHandlers[eventName] = handler;
      }

      send = vi.fn(() => {
        this.eventHandlers.load?.();
      });
    }
    vi.stubGlobal("XMLHttpRequest", DirectProxyUploadMock);

    await expect(uploadLearningMedia(file)).resolves.toEqual({
      id: "file-1",
      filename: "lesson.txt",
      mimeType: "text/plain",
      sizeBytes: String(file.size),
    });

    expect(openedUrls).toEqual([
      `/api/media/upload-proxy?targetUrl=${encodeURIComponent(directUrl)}`,
    ]);
  });

  it("retries via upload-proxy if same-origin direct XHR upload fails with error event", async () => {
    vi.stubGlobal("window", { location: { origin: "http://localhost:3000" } });
    const file = new File(["lesson"], "lesson.txt", { type: "text/plain" });
    const directUrl = "http://localhost:3000/failing-upload";
    apiPost
      .mockResolvedValueOnce({
        id: "upload-1",
        status: "UPLOADING",
        uploadUrl: directUrl,
      })
      .mockResolvedValueOnce({
        id: "upload-1",
        fileId: "file-1",
        status: "READY",
        mimeType: "text/plain",
        sizeBytes: String(file.size),
      });

    let attemptCount = 0;
    const openedUrls: string[] = [];

    class FailingThenProxyUploadMock {
      status = 200;
      private readonly eventHandlers: Record<string, () => void> = {};
      upload = { addEventListener: vi.fn() };

      open = vi.fn((_method: string, url: string) => {
        openedUrls.push(url);
      });
      setRequestHeader = vi.fn();

      addEventListener(eventName: string, handler: () => void) {
        this.eventHandlers[eventName] = handler;
      }

      send = vi.fn(() => {
        attemptCount++;
        if (attemptCount === 1) {
          this.eventHandlers.error?.();
        } else {
          this.eventHandlers.load?.();
        }
      });
    }
    vi.stubGlobal("XMLHttpRequest", FailingThenProxyUploadMock);

    await expect(uploadLearningMedia(file)).resolves.toEqual({
      id: "file-1",
      filename: "lesson.txt",
      mimeType: "text/plain",
      sizeBytes: String(file.size),
    });

    expect(openedUrls).toEqual([
      directUrl,
      `/api/media/upload-proxy?targetUrl=${encodeURIComponent(directUrl)}`,
    ]);
  });

  it("downloads through the authenticated API client", async () => {
    const blob = new Blob(["file"], { type: "text/plain" });
    apiClientGet.mockResolvedValue({
      data: blob,
      headers: { "content-disposition": 'attachment; filename="lesson.txt"' },
    });

    await expect(downloadFile("file/1")).resolves.toEqual({
      blob,
      filename: "lesson.txt",
    });

    expect(apiClientGet).toHaveBeenCalledWith("/api/files/file%2F1/download", {
      baseURL: window.location.origin,
      responseType: "blob",
    });
  });
});
