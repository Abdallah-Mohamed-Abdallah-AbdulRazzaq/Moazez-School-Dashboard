import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AttachmentPreview from "@/features/communication/components/conversations/AttachmentPreview";

vi.mock("@/lib/files/authenticatedFileUrlCache", () => ({
  loadAuthenticatedFileUrl: vi.fn().mockResolvedValue({
    mimeType: "application/pdf",
    url: "blob:report-preview",
  }),
}));

describe("AttachmentPreview", () => {
  it("opens the shared file preview when an attachment is selected", async () => {
    render(
      <AttachmentPreview
        attachment={{
          id: "attachment-1",
          fileId: "file-1",
          name: "report.pdf",
          mimeType: "application/pdf",
          size: 1024,
        }}
        labels={{ download: "Download", removeAttachment: "Remove" }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "report.pdf" }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });
});
