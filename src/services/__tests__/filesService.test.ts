import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiPost, apiClientGet } = vi.hoisted(() => ({
  apiPost: vi.fn(),
  apiClientGet: vi.fn(),
}));

vi.mock("@/lib/api", () => ({ apiPost, apiClient: { get: apiClientGet } }));

import { downloadFileBlob, uploadFile } from "../filesService";

describe("shared filesService", () => {
  beforeEach(() => {
    apiPost.mockReset();
    apiClientGet.mockReset();
  });

  it("uploads a multipart file and returns its record", async () => {
    const response = {
      id: "file-1",
      originalName: "reward.png",
      mimeType: "image/png",
      sizeBytes: "5",
      visibility: "private",
      createdAt: "2026-06-30T00:00:00.000Z",
    };
    apiPost.mockResolvedValue(response);
    const file = new File(["image"], "reward.png", { type: "image/png" });

    await expect(uploadFile(file)).resolves.toEqual(response);

    expect(apiPost).toHaveBeenCalledWith("/files", expect.any(FormData), {
      headers: { "Content-Type": "multipart/form-data" },
    });
    expect((apiPost.mock.calls[0][1] as FormData).get("file")).toBe(file);
  });

  it("downloads through the authenticated file proxy", async () => {
    const blob = new Blob(["image"], { type: "image/png" });
    apiClientGet.mockResolvedValue({
      data: blob,
      headers: { "content-type": "image/png" },
    });

    await expect(downloadFileBlob("file/1")).resolves.toBe(blob);
    expect(apiClientGet).toHaveBeenCalledWith(
      "/api/files/file%2F1/download",
      { baseURL: "", responseType: "blob" },
    );
  });
});
