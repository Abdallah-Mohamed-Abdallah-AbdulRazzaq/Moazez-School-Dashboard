import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearAuthenticatedFileUrlCache } from "@/lib/files/authenticatedFileUrlCache";
import AcademicContentAssetAccess from "../AcademicContentAssetAccess";
import type { AcademicContentAsset } from "../../../types/contracts";

const network = vi.hoisted(() => ({ downloadFileBlob: vi.fn() }));
vi.mock("@/services/filesService", () => network);

const pdf: AcademicContentAsset = {
  assetId: "asset-1", fileId: "file-1", originalName: "lesson.pdf",
  mimeType: "application/pdf", sizeBytes: String(25 * 1024 * 1024),
  sortOrder: 0, createdAt: "2026-10-10T00:00:00Z",
};

describe("academic content attachment actions", () => {
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 0, 40, 40));
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: vi.fn(() => "blob:preview") });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
    network.downloadFileBlob.mockReset().mockResolvedValue(new Blob(["pdf"], { type: "application/pdf" }));
  });
  afterEach(() => {
    vi.restoreAllMocks();
    clearAuthenticatedFileUrlCache();
    Reflect.deleteProperty(URL, "createObjectURL");
    Reflect.deleteProperty(URL, "revokeObjectURL");
  });

  it("opens the existing preview modal only after the user requests a preview", async () => {
    render(<AcademicContentAssetAccess asset={pdf} allowInlinePreview isDownloading={false} onDownload={vi.fn()} />);
    expect(network.downloadFileBlob).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /^lesson.pdf/ }));
    const frame = await screen.findByTitle("lesson.pdf");
    expect(frame).toHaveAttribute("src", "blob:preview");
    expect(screen.getByRole("dialog")).toBeVisible();
  });

  it.each([
    { asset: { ...pdf, sizeBytes: String(25 * 1024 * 1024 + 1) }, allowed: true, large: true },
    { asset: { ...pdf, originalName: "lesson.zip", mimeType: "application/zip", sizeBytes: "1024" }, allowed: true, large: false },
    { asset: pdf, allowed: false, large: false },
  ])("keeps download available without fetching blocked previews: $asset.originalName / $allowed / $large", ({ asset, allowed, large }) => {
    const onDownload = vi.fn();
    render(<AcademicContentAssetAccess asset={asset} allowInlinePreview={allowed} isDownloading={false} onDownload={onDownload} />);
    expect(screen.getByRole("button", { name: new RegExp(`^${asset.originalName}`) })).toHaveAttribute("aria-disabled", "true");
    if (large) expect(screen.getByText(/Files larger than 25 MiB/)).toBeVisible();
    expect(screen.queryByRole("button", { name: "Download" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: `Actions for ${asset.originalName}` }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Download" }));
    expect(onDownload).toHaveBeenCalledWith(asset);
    expect(network.downloadFileBlob).not.toHaveBeenCalled();
  });
  it("opening the download menu does not preview the file, and disables another download while busy", () => {
    const onDownload = vi.fn();
    render(<AcademicContentAssetAccess asset={pdf} allowInlinePreview isDownloading onDownload={onDownload} />);
    fireEvent.click(screen.getByRole("button", { name: "Actions for lesson.pdf" }));
    const download = screen.getByRole("menuitem", { name: "Preparing download…" });
    expect(download).toHaveAttribute("aria-disabled", "true");
    fireEvent.click(download);
    expect(onDownload).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(network.downloadFileBlob).not.toHaveBeenCalled();
  });
});
