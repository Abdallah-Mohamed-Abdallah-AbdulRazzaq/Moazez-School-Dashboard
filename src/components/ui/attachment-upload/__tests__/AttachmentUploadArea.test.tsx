import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AttachmentUploadArea from "@/components/ui/attachment-upload/AttachmentUploadArea";

describe("AttachmentUploadArea", () => {
  it("rejects files that exceed its configured size limit", () => {
    const onFilesChange = vi.fn();

    const { container } = render(
      <AttachmentUploadArea
        files={[]}
        labels={{
          title: "Attachments",
          addFiles: "Add attachments",
          removeFile: "Remove attachment",
        }}
        maxSizeBytes={4}
        onFilesChange={onFilesChange}
      />,
    );
    const input = container.querySelector<HTMLInputElement>('input[type="file"]');

    fireEvent.change(input!, {
      target: {
        files: [new File(["large"], "large.pdf", { type: "application/pdf" })],
      },
    });

    expect(onFilesChange).not.toHaveBeenCalled();
    expect(screen.queryByText("large.pdf")).not.toBeInTheDocument();
  });

  it("rejects file types outside its configured allow-list", () => {
    const onFilesChange = vi.fn();

    const { container } = render(
      <AttachmentUploadArea
        allowedMimeTypes={["application/pdf"]}
        files={[]}
        labels={{
          title: "Attachments",
          addFiles: "Add attachments",
          removeFile: "Remove attachment",
        }}
        onFilesChange={onFilesChange}
      />,
    );
    const input = container.querySelector<HTMLInputElement>('input[type="file"]');

    fireEvent.change(input!, {
      target: {
        files: [new File(["image"], "image.png", { type: "image/png" })],
      },
    });

    expect(onFilesChange).not.toHaveBeenCalled();
  });

  it("shows the configured upload restrictions before a file is selected", () => {
    render(
      <AttachmentUploadArea
        allowedMimeTypes={["application/pdf", "image/png"]}
        files={[]}
        labels={{
          title: "Attachments",
          addFiles: "Add attachments",
          removeFile: "Remove attachment",
        }}
        maxSizeBytes={10 * 1024 * 1024}
        onFilesChange={vi.fn()}
      />,
    );

    expect(
      screen.getByText(
        "Maximum file size: 10.0 MB. Allowed types: application/pdf, image/png.",
      ),
    ).toBeInTheDocument();
  });
});
