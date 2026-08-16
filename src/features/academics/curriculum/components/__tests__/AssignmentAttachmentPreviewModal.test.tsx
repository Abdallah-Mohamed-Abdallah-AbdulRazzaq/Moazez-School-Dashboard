import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AssignmentAttachmentPreviewModal from "../AssignmentAttachmentPreviewModal";

const fileServiceMocks = vi.hoisted(() => ({
  downloadFile: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/components/ui/modal/Modal", () => ({
  default: ({ isOpen, title, children }: { isOpen: boolean; title?: string; children: React.ReactNode }) =>
    isOpen ? (
      <div role="dialog" aria-label={title}>
        {children}
      </div>
    ) : null,
}));

vi.mock("@/features/academics/curriculum/services/filesService", () => ({
  downloadFile: fileServiceMocks.downloadFile,
}));

describe("AssignmentAttachmentPreviewModal", () => {
  function mockObjectUrl(objectUrl: string) {
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => objectUrl),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
  }

  it("loads preview content through the authenticated file download service", async () => {
    const objectUrl = "blob:preview-url";
    mockObjectUrl(objectUrl);
    fileServiceMocks.downloadFile.mockResolvedValueOnce({
      blob: new Blob(["pdf"], { type: "application/pdf" }),
      filename: "worksheet.pdf",
    });

    render(
      <AssignmentAttachmentPreviewModal
        isOpen
        onClose={vi.fn()}
        attachment={{
          id: "attachment-1",
          assignmentId: "homework-1",
          fileId: "file-1",
          type: "FILE",
          title: "Worksheet",
          url: "/api/files/file-1/download",
          fileName: "worksheet.pdf",
          mimeType: "application/pdf",
          size: 1200,
          createdAt: "2026-07-09T00:00:00.000Z",
        }}
      />,
    );

    await waitFor(() => expect(fileServiceMocks.downloadFile).toHaveBeenCalledWith("file-1"));
    expect(screen.getByTitle("worksheet.pdf")).toHaveAttribute("src", objectUrl);
  });

  it("previews downloaded images using the blob mime type when attachment metadata is missing", async () => {
    const objectUrl = "blob:image-preview-url";
    mockObjectUrl(objectUrl);
    fileServiceMocks.downloadFile.mockResolvedValueOnce({
      blob: new Blob(["image"], { type: "image/png" }),
      filename: "diagram.png",
    });

    render(
      <AssignmentAttachmentPreviewModal
        isOpen
        onClose={vi.fn()}
        attachment={{
          id: "attachment-2",
          assignmentId: "homework-1",
          fileId: "file-2",
          type: "FILE",
          title: "Diagram",
          url: "/api/files/file-2/download",
          fileName: "diagram.png",
          createdAt: "2026-07-09T00:00:00.000Z",
        }}
      />,
    );

    await waitFor(() => expect(fileServiceMocks.downloadFile).toHaveBeenCalledWith("file-2"));
    const preview = await screen.findByTitle("diagram.png");
    expect(preview.tagName).toBe("IMG");
    expect(preview).toHaveAttribute("src", objectUrl);
  });
});
