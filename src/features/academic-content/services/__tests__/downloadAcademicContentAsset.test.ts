import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AcademicContentAsset } from "../../types/contracts";
import { downloadAcademicContentAsset } from "../downloadAcademicContentAsset";

const fileBoundary = vi.hoisted(() => ({ downloadFileBlob: vi.fn() }));

vi.mock("@/services/filesService", () => ({
  downloadFileBlob: fileBoundary.downloadFileBlob,
}));

const asset: AcademicContentAsset = {
  assetId: "asset-1",
  fileId: "file-1",
  originalName: "fractions.pdf",
  mimeType: "application/pdf",
  sizeBytes: "1024",
  sortOrder: 0,
  createdAt: "2026-10-01T08:00:00.000Z",
};

describe("academic content asset download", () => {
  beforeEach(() => {
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Reflect.deleteProperty(URL, "createObjectURL");
    Reflect.deleteProperty(URL, "revokeObjectURL");
  });

  it("downloads the authenticated blob with its original filename and releases the URL", async () => {
    const blob = new Blob(["worksheet"], { type: "application/pdf" });
    fileBoundary.downloadFileBlob.mockResolvedValue(blob);
    const createObjectUrl = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:worksheet");
    const revokeObjectUrl = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => undefined);
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);

    await downloadAcademicContentAsset(asset);

    expect(createObjectUrl).toHaveBeenCalledWith(blob);
    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:worksheet");
    expect(document.querySelector('a[download="fractions.pdf"]')).toBeNull();
  });
});
