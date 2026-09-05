import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api-error";
import FilePreviewModal from "./FilePreviewModal";

const fileCacheMocks = vi.hoisted(() => ({
  loadAuthenticatedFileUrl: vi.fn(),
}));

vi.mock("@/lib/files/authenticatedFileUrlCache", () => ({
  loadAuthenticatedFileUrl: fileCacheMocks.loadAuthenticatedFileUrl,
}));

describe("FilePreviewModal", () => {
  beforeEach(() => {
    fileCacheMocks.loadAuthenticatedFileUrl.mockReset();
  });

  it("shows an access-denied message inside the modal when the preview is forbidden", async () => {
    fileCacheMocks.loadAuthenticatedFileUrl.mockRejectedValue(
      new ApiError("Forbidden", 403, "FORBIDDEN"),
    );

    render(
      <FilePreviewModal
        attachment={{
          id: "file-1",
          name: "medical-note.pdf",
          size: 1024,
          type: "application/pdf",
          url: "/api/files/file-1/download",
        }}
        isOpen
        onClose={vi.fn()}
      />,
    );

    await waitFor(() => expect(screen.getByText("accessDenied")).toBeInTheDocument());
    expect(screen.queryByText("unavailable")).not.toBeInTheDocument();
  });

  it("previews a local file without requesting an authenticated file URL", () => {
    render(
      <FilePreviewModal
        attachment={{
          id: "local-file-1",
          name: "notice.png",
          size: 1024,
          type: "image/png",
          url: "blob:notice-preview",
          isLocal: true,
        }}
        isOpen
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole("img", { name: "notice.png" })).toHaveAttribute(
      "src",
      "blob:notice-preview",
    );
    expect(fileCacheMocks.loadAuthenticatedFileUrl).not.toHaveBeenCalled();
  });
});
