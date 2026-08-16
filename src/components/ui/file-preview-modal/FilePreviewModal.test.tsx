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
});
