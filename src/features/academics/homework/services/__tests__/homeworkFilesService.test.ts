import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/lib/api";
import { uploadHomeworkFile } from "../homeworkFilesService";

vi.mock("@/lib/api", () => ({ apiClient: { post: vi.fn() } }));

describe("uploadHomeworkFile", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uploads multipart file data and returns the backend file id", async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { id: "file-1" } });
    const file = new File(["content"], "worksheet.pdf", { type: "application/pdf" });

    await expect(uploadHomeworkFile(file)).resolves.toBe("file-1");
    expect(apiClient.post).toHaveBeenCalledWith("/files", expect.any(FormData), {
      headers: { "Content-Type": undefined },
    });
  });
});
