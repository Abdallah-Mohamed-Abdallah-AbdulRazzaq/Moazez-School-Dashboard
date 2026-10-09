import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AcademicContentAsset } from "../../../types/contracts";
import FilesSection from "../FilesSection";

const mocks = vi.hoisted(() => ({
  selectedFile: null as File | null,
  getAcademicContentFilePolicy: vi.fn(),
  unlinkAcademicContentAsset: vi.fn(),
  uploadAcademicContentFile: vi.fn(),
}));

vi.mock("@/components/ui/drag-drop-upload/DragDropUploadArea", () => ({
  default: ({
    onFilesSelected,
    disabled,
  }: {
    onFilesSelected: (files: File[]) => void;
    disabled?: boolean;
  }) => (
    <button
      type="button"
      disabled={disabled}
      onClick={() =>
        mocks.selectedFile && onFilesSelected([mocks.selectedFile])
      }
    >
      Select files
    </button>
  ),
}));

vi.mock("@/components/ui/attachment-list-item/AttachmentListItem", () => ({
  default: ({
    title,
    subtitle,
    actions = [],
  }: {
    title: string;
    subtitle?: string;
    actions?: { label: string; onClick: () => void }[];
  }) => (
    <div>
      <span>{title}</span>
      <span>{subtitle}</span>
      {actions.map((action) => (
        <button key={action.label} type="button" onClick={action.onClick}>
          {action.label}
        </button>
      ))}
    </div>
  ),
}));

vi.mock("../../../services/academicContentApi", () => ({
  getAcademicContentFilePolicy: mocks.getAcademicContentFilePolicy,
  unlinkAcademicContentAsset: mocks.unlinkAcademicContentAsset,
}));

vi.mock("../../../services/academicContentUpload", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("../../../services/academicContentUpload")
    >();
  return {
    ...actual,
    uploadAcademicContentFile: mocks.uploadAcademicContentFile,
  };
});

const policy = {
  attachmentsEnabled: true,
  maximumFileSizeBytes: "536870912",
  documentsEnabled: true,
  imagesEnabled: true,
  videosEnabled: true,
  audioEnabled: true,
  archivesEnabled: false,
  otherFilesEnabled: false,
  allowStudentDownload: true,
  allowGuardianDownload: true,
  allowInlinePreview: true,
};

const attachedAsset: AcademicContentAsset = {
  assetId: "asset-1",
  fileId: "file-1",
  originalName: "lesson.pdf",
  mimeType: "application/pdf",
  sizeBytes: "1024",
  sortOrder: 0,
  createdAt: "2026-10-05T10:30:00.000Z",
};

describe("FilesSection", () => {
  beforeEach(() => {
    mocks.selectedFile = new File(["pdf"], "lesson.pdf", {
      type: "application/pdf",
    });
    mocks.getAcademicContentFilePolicy.mockReset().mockResolvedValue(policy);
    mocks.unlinkAcademicContentAsset.mockReset().mockResolvedValue({
      ok: true,
      assetId: "asset-1",
    });
    mocks.uploadAcademicContentFile
      .mockReset()
      .mockImplementation(async ({ onProgress }) => {
        onProgress?.({ uploadedBytes: "3", totalBytes: "3", percent: 100 });
        return {
          asset: {
            id: "asset-new",
            academicContentId: "content-1",
            fileId: "file-new",
            createdAt: "2026-09-30T00:00:00.000Z",
          },
          file: {
            id: "file-new",
            originalName: "lesson.pdf",
            mimeType: "application/pdf",
            sizeBytes: "3",
          },
        };
      });
  });

  it("uploads a policy-allowed file and refreshes the aggregate", async () => {
    const onFilesChanged = vi.fn(async () => undefined);
    render(
      <FilesSection
        contentId="content-1"
        assets={[]}
        disabled={false}
        onFilesChanged={onFilesChanged}
      />,
    );
    await screen.findByRole("button", { name: "Select files" });

    fireEvent.click(screen.getByRole("button", { name: "Select files" }));

    await waitFor(() =>
      expect(mocks.uploadAcademicContentFile).toHaveBeenCalledOnce(),
    );
    expect(mocks.uploadAcademicContentFile).toHaveBeenCalledWith(
      expect.objectContaining({
        contentId: "content-1",
        file: mocks.selectedFile,
        signal: expect.any(AbortSignal),
        onProgress: expect.any(Function),
      }),
    );
    await waitFor(() => expect(onFilesChanged).toHaveBeenCalledOnce());
  });

  it("rejects a disabled file category before creating an upload", async () => {
    mocks.selectedFile = new File(["zip"], "pack.zip", {
      type: "application/zip",
    });
    render(
      <FilesSection
        contentId="content-1"
        assets={[]}
        disabled={false}
        onFilesChanged={vi.fn()}
      />,
    );
    await screen.findByRole("button", { name: "Select files" });

    fireEvent.click(screen.getByRole("button", { name: "Select files" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This file category is disabled in the current school settings.",
    );
    expect(mocks.uploadAcademicContentFile).not.toHaveBeenCalled();
  });

  it("unlinks by asset id and refreshes without claiming physical deletion", async () => {
    const onFilesChanged = vi.fn(async () => undefined);
    render(
      <FilesSection
        contentId="content-1"
        assets={[
          {
            assetId: "asset-1",
            fileId: "file-1",
            originalName: "lesson.pdf",
            mimeType: "application/pdf",
            sizeBytes: "3",
            sortOrder: 0,
            createdAt: "2026-09-30T00:00:00.000Z",
          },
        ]}
        disabled={false}
        onFilesChanged={onFilesChanged}
      />,
    );

    await screen.findByText("lesson.pdf");
    fireEvent.click(screen.getByRole("button", { name: "Unlink" }));

    await waitFor(() =>
      expect(mocks.unlinkAcademicContentAsset).toHaveBeenCalledWith(
        "content-1",
        "asset-1",
      ),
    );
    expect(await screen.findByRole("status")).toHaveTextContent(
      "removed from this content",
    );
    expect(onFilesChanged).toHaveBeenCalledOnce();
  });

  it("supports an embedded presentation without duplicating file behavior", async () => {
    const { container } = render(
      <FilesSection
        contentId="content-1"
        assets={[]}
        disabled
        variant="embedded"
        onFilesChanged={vi.fn()}
      />,
    );

    expect(
      await screen.findByRole("heading", { name: "Files", level: 2 }),
    ).toBeVisible();
    expect(container.querySelector("section")).toHaveClass("pt-5");
    expect(
      screen.queryByRole("button", { name: "Select files" }),
    ).not.toBeInTheDocument();
  });

  it("uses injected policy state and presents asset and recipient-access details", () => {
    render(
      <FilesSection
        contentId="content-1"
        assets={[attachedAsset]}
        disabled
        policyState={{
          policy: { ...policy, allowGuardianDownload: false },
          isLoading: false,
          error: null,
          reload: vi.fn(),
        }}
        showRecipientAccessPolicy
        onFilesChanged={vi.fn()}
      />,
    );

    expect(mocks.getAcademicContentFilePolicy).not.toHaveBeenCalled();
    expect(
      screen.getByText(/application\/pdf.*1 KiB.*Oct 5, 2026/i),
    ).toBeVisible();
    expect(screen.getByText("Student downloads enabled")).toBeVisible();
    expect(screen.getByText("Guardian downloads disabled")).toBeVisible();
    expect(screen.getByText("Inline preview enabled")).toBeVisible();
  });
});
