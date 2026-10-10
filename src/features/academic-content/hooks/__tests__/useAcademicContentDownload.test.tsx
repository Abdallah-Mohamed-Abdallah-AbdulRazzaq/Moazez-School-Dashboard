import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ApiRequestConfig } from "@/lib/api";
import { ApiError } from "@/lib/api-error";
import { Button } from "@/components/ui/button/Button";
import AcademicContentDownloadFeedback from "../../components/editor/AcademicContentDownloadFeedback";
import { useAcademicContentDownload } from "../useAcademicContentDownload";

const network = vi.hoisted(() => ({ downloadFileBlob: vi.fn() }));
vi.mock("@/services/filesService", () => network);

function DownloadHarness() {
  const { state, isDownloading, requestDownload } = useAcademicContentDownload();
  return <>
    <Button loading={isDownloading} onClick={() => void requestDownload({
      assetId: "asset-1", fileId: "file-1", originalName: "Coupon.pptx",
      mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      sizeBytes: "100", sortOrder: 0, createdAt: "2026-10-10T00:00:00Z",
    })}>Download</Button>
    <AcademicContentDownloadFeedback state={state} />
  </>;
}

describe("download waiting feedback", () => {
  let finish: (blob: Blob) => void;
  let fail: (error: Error) => void;
  let progress: NonNullable<ApiRequestConfig["onDownloadProgress"]>;
  beforeEach(() => {
    network.downloadFileBlob.mockReset().mockImplementation((_fileId: string, config: ApiRequestConfig) => {
      progress = config.onDownloadProgress!;
      return new Promise<Blob>((resolve, reject) => { finish = resolve; fail = reject; });
    });
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: vi.fn(() => "blob:download") });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
  });
  afterEach(() => {
    vi.restoreAllMocks();
    Reflect.deleteProperty(URL, "createObjectURL");
    Reflect.deleteProperty(URL, "revokeObjectURL");
  });

  it.each([100, undefined])("shows immediate waiting feedback and progress with total %s", async (total) => {
    render(<DownloadHarness />);
    const button = screen.getByRole("button", { name: "Download" });
    fireEvent.click(button);
    expect(screen.getByRole("status")).toHaveTextContent("Preparing download: Coupon.pptx");
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(network.downloadFileBlob).toHaveBeenCalledOnce();
    await act(async () => progress({ loaded: 25, total, bytes: 25, lengthComputable: total !== undefined }));
    expect(screen.getByRole("status")).toHaveTextContent("Fetching file: Coupon.pptx");
    const indicator = screen.getByRole("progressbar");
    if (total) expect(indicator).toHaveAttribute("value", "25");
    else expect(indicator).not.toHaveAttribute("value");
    await act(async () => finish(new Blob(["presentation"])));
    expect(screen.getByRole("status")).toHaveTextContent("Download started: Coupon.pptx");
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(button).toBeEnabled();
  });

  it("shows a localized failure and allows the user to retry", async () => {
    render(<DownloadHarness />);
    const button = screen.getByRole("button", { name: "Download" });
    fireEvent.click(button);
    await act(async () => fail(ApiError.network()));
    expect(screen.getByRole("alert")).toHaveTextContent("Could not connect");
    expect(button).toBeEnabled();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    fireEvent.click(button);
    expect(screen.getByRole("status")).toHaveTextContent("Preparing download");
    await act(async () => finish(new Blob(["presentation"])));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(network.downloadFileBlob).toHaveBeenCalledTimes(2);
  });
});
