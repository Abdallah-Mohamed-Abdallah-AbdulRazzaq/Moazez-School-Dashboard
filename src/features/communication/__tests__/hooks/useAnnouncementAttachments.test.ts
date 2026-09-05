import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  attachFileToAnnouncement,
  useAnnouncementAttachments,
} from "@/features/communication/hooks/useAnnouncementAttachments";
import {
  deleteAnnouncementAttachment,
  linkAnnouncementAttachment,
} from "@/features/communication/api/communication.service";
import { uploadFile } from "@/features/communication/api/files.service";
import { ApiError } from "@/lib/api-error";

vi.mock("@/features/communication/api/communication.service", () => ({
  deleteAnnouncementAttachment: vi.fn(),
  getAnnouncementAttachments: vi.fn(),
  linkAnnouncementAttachment: vi.fn(),
}));

vi.mock("@/features/communication/api/files.service", () => ({
  uploadFile: vi.fn(),
}));

describe("attachFileToAnnouncement", () => {
  it("uploads a selected file and links it to the new announcement", async () => {
    const attachment = new File(["notice"], "notice.pdf", {
      type: "application/pdf",
    });
    vi.mocked(uploadFile).mockResolvedValue({ id: "file-1" });
    vi.mocked(linkAnnouncementAttachment).mockResolvedValue({ id: "attachment-1" });

    await attachFileToAnnouncement("announcement-1", attachment);

    expect(linkAnnouncementAttachment).toHaveBeenCalledWith("announcement-1", {
      fileId: "file-1",
    });
  });

  it("keeps the attachment list stable and exposes a deletion failure", async () => {
    const deletionError = new ApiError(
      "Attachment not found",
      404,
      "not_found",
    );
    vi.mocked(deleteAnnouncementAttachment).mockRejectedValue(deletionError);

    const { result } = renderHook(() =>
      useAnnouncementAttachments("announcement-1"),
    );

    await act(async () => {
      await result.current.removeAttachment("attachment-1");
    });

    await waitFor(() => {
      expect(result.current.error).toBe(deletionError);
    });
  });
});
