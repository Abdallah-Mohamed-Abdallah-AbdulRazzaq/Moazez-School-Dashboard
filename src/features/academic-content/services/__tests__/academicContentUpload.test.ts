import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  AcademicContentUploadRestartRequiredError,
  AcademicContentUploadValidationError,
  uploadAcademicContentFile,
} from "../academicContentUpload";

const api = vi.hoisted(() => ({
  cancelAcademicContentUpload: vi.fn(),
  completeAcademicContentUpload: vi.fn(),
  createAcademicContentUpload: vi.fn(),
}));

vi.mock("../academicContentApi", () => api);

interface FakeResponse {
  event: "load" | "error" | "pending";
  status?: number;
  range?: string;
}

class FakeXMLHttpRequest {
  static responses: FakeResponse[] = [];
  static requests: FakeXMLHttpRequest[] = [];

  method = "";
  url = "";
  status = 0;
  requestHeaders: Record<string, string> = {};
  body: XMLHttpRequestBodyInit | null = null;
  responseRange: string | null = null;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;
  upload = { onprogress: null as ((event: ProgressEvent) => void) | null };

  constructor() {
    FakeXMLHttpRequest.requests.push(this);
  }

  open(method: string, url: string) {
    this.method = method;
    this.url = url;
  }

  setRequestHeader(name: string, value: string) {
    this.requestHeaders[name] = value;
  }

  getResponseHeader(name: string) {
    return name.toLowerCase() === "range" ? this.responseRange : null;
  }

  send(body: XMLHttpRequestBodyInit | null) {
    this.body = body;
    const response = FakeXMLHttpRequest.responses.shift();
    if (!response) throw new Error("Missing fake XMLHttpRequest response");
    if (response.event === "pending") return;
    if (response.event === "error") {
      this.onerror?.();
      return;
    }
    this.status = response.status ?? 200;
    this.responseRange = response.range ?? null;
    this.upload.onprogress?.({ loaded: (body as Blob | null)?.size ?? 0 } as ProgressEvent);
    this.onload?.();
  }

  abort() {
    this.onabort?.();
  }
}

const intent = {
  uploadId: "upload-1",
  status: "PENDING" as const,
  sessionUrl: "https://storage.example/upload-capability",
  capabilityExpiresAt: "2026-10-01T00:00:00.000Z",
  expiresAt: "2026-10-01T00:00:00.000Z",
  expectedMimeType: "application/pdf",
  expectedSizeBytes: "8388609",
  uploadMode: "resumable" as const,
};

describe("uploadAcademicContentFile", () => {
  beforeEach(() => {
    FakeXMLHttpRequest.responses = [];
    FakeXMLHttpRequest.requests = [];
    vi.stubGlobal("XMLHttpRequest", FakeXMLHttpRequest);
    vi.spyOn(crypto, "randomUUID").mockReturnValue(
      "11111111-1111-4111-8111-111111111111",
    );
    api.createAcademicContentUpload.mockReset().mockResolvedValue(intent);
    api.completeAcademicContentUpload.mockReset().mockResolvedValue({
      asset: {
        id: "asset-1",
        academicContentId: "content-1",
        fileId: "file-1",
        createdAt: "2026-09-30T00:00:00.000Z",
      },
      file: {
        id: "file-1",
        originalName: "lesson.pdf",
        mimeType: "application/pdf",
        sizeBytes: "8388609",
      },
    });
    api.cancelAcademicContentUpload.mockReset().mockResolvedValue({
      uploadId: "upload-1",
      status: "CANCELLED",
      cancelledAt: "2026-09-30T00:00:00.000Z",
    });
  });

  it("uploads 8 MiB chunks directly and completes after provider success", async () => {
    FakeXMLHttpRequest.responses = [
      { event: "load", status: 308, range: "bytes=0-8388607" },
      { event: "load", status: 200 },
    ];
    const file = new File([new Uint8Array(8 * 1024 * 1024 + 1)], "lesson.pdf", {
      type: "application/pdf",
    });
    const onProgress = vi.fn();

    await uploadAcademicContentFile({ contentId: "content-1", file, onProgress });

    expect(api.createAcademicContentUpload).toHaveBeenCalledWith("content-1", {
      clientRequestId: "11111111-1111-4111-8111-111111111111",
      originalName: "lesson.pdf",
      expectedMimeType: "application/pdf",
      expectedSizeBytes: "8388609",
    });
    expect(FakeXMLHttpRequest.requests).toHaveLength(2);
    expect(FakeXMLHttpRequest.requests[0]).toMatchObject({
      method: "PUT",
      url: intent.sessionUrl,
      requestHeaders: {
        "Content-Type": "application/pdf",
        "Content-Range": "bytes 0-8388607/8388609",
      },
    });
    expect(FakeXMLHttpRequest.requests[1].requestHeaders["Content-Range"]).toBe(
      "bytes 8388608-8388608/8388609",
    );
    expect(api.completeAcademicContentUpload).toHaveBeenCalledWith(
      "content-1",
      "upload-1",
    );
    expect(onProgress).toHaveBeenLastCalledWith({
      uploadedBytes: "8388609",
      totalBytes: "8388609",
      percent: 100,
    });
  });

  it("probes the acknowledged offset after a retryable interruption", async () => {
    api.createAcademicContentUpload.mockResolvedValue({
      ...intent,
      expectedSizeBytes: "3",
    });
    FakeXMLHttpRequest.responses = [
      { event: "error" },
      { event: "load", status: 308 },
      { event: "load", status: 201 },
    ];
    const file = new File(["pdf"], "lesson.pdf", { type: "application/pdf" });

    await uploadAcademicContentFile({ contentId: "content-1", file });

    expect(FakeXMLHttpRequest.requests[1].requestHeaders["Content-Range"]).toBe(
      "bytes */3",
    );
    expect((FakeXMLHttpRequest.requests[1].body as Blob).size).toBe(0);
    expect(FakeXMLHttpRequest.requests[2].requestHeaders["Content-Range"]).toBe(
      "bytes 0-2/3",
    );
  });

  it("cancels the backend upload when the caller aborts", async () => {
    api.createAcademicContentUpload.mockResolvedValue({
      ...intent,
      expectedSizeBytes: "3",
    });
    FakeXMLHttpRequest.responses = [{ event: "pending" }];
    const controller = new AbortController();
    const promise = uploadAcademicContentFile({
      contentId: "content-1",
      file: new File(["pdf"], "lesson.pdf", { type: "application/pdf" }),
      signal: controller.signal,
    });

    await Promise.resolve();
    controller.abort();

    await expect(promise).rejects.toMatchObject({ name: "AbortError" });
    expect(api.cancelAcademicContentUpload).toHaveBeenCalledWith(
      "content-1",
      "upload-1",
    );
  });

  it("requires explicit restart after an expired provider capability", async () => {
    api.createAcademicContentUpload.mockResolvedValue({
      ...intent,
      expectedSizeBytes: "3",
    });
    FakeXMLHttpRequest.responses = [{ event: "load", status: 410 }];

    await expect(
      uploadAcademicContentFile({
        contentId: "content-1",
        file: new File(["pdf"], "lesson.pdf", { type: "application/pdf" }),
      }),
    ).rejects.toBeInstanceOf(AcademicContentUploadRestartRequiredError);
    expect(api.completeAcademicContentUpload).not.toHaveBeenCalled();
  });

  it("rejects MIME and extension mismatches before creating an intent", async () => {
    await expect(
      uploadAcademicContentFile({
        contentId: "content-1",
        file: new File(["not a png"], "lesson.png", { type: "application/pdf" }),
      }),
    ).rejects.toBeInstanceOf(AcademicContentUploadValidationError);
    expect(api.createAcademicContentUpload).not.toHaveBeenCalled();
  });
});
