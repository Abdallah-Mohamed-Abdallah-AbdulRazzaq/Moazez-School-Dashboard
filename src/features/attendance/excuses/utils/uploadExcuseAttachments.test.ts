import { describe, expect, it, vi } from "vitest";
import { uploadExcuseAttachments } from "./uploadExcuseAttachments";

describe("uploadExcuseAttachments", () => {
  it("maps backend file UUIDs into excuse attachment metadata", async () => {
    const file = new File(["medical"], "medical.pdf", {
      type: "application/pdf",
    });
    const upload = vi.fn().mockResolvedValue({
      id: "b8e9a2ac-a9b4-4dc1-b02a-fdbcf2ab73fd",
      originalName: "medical.pdf",
      mimeType: "application/pdf",
      sizeBytes: "7",
      visibility: "PRIVATE",
      createdAt: "2026-07-11T00:00:00.000Z",
    });

    await expect(uploadExcuseAttachments([file], upload)).resolves.toEqual([
      {
        id: "b8e9a2ac-a9b4-4dc1-b02a-fdbcf2ab73fd",
        name: "medical.pdf",
        size: 7,
        type: "application/pdf",
        url: "/api/files/b8e9a2ac-a9b4-4dc1-b02a-fdbcf2ab73fd/download",
      },
    ]);
  });
});
