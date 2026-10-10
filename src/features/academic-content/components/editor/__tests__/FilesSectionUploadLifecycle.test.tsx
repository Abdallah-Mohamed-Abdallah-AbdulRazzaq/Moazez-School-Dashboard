import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api-error";
import FilesSection from "../FilesSection";

const http = vi.hoisted(() => ({ apiPost: vi.fn() }));
vi.mock("@/lib/api", () => ({
  ...http,
  apiGet: vi.fn(),
  apiDelete: vi.fn(),
  apiPatch: vi.fn(),
  apiPut: vi.fn(),
}));

class StorageRequest {
  static transfers = 0;
  static pending: StorageRequest | null = null;
  static holdTransfer = false;
  status = 200;
  upload = {};
  onload?: () => void;
  onabort?: () => void;
  open() {}
  setRequestHeader() {}
  getResponseHeader() { return null; }
  send() {
    StorageRequest.transfers += 1;
    if (StorageRequest.holdTransfer) {
      StorageRequest.pending = this;
      return;
    }
    this.onload?.();
  }
  abort() { this.onabort?.(); }
}

function closeTabWouldWarn() {
  const event = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
}

const completed = {
  file: { id: "file-1", originalName: "lesson.pdf", mimeType: "application/pdf", sizeBytes: "3" },
  asset: { id: "asset-1", academicContentId: "content-1", fileId: "file-1", createdAt: "2026-10-10T00:00:00Z" },
};
const completePath = "/academics/academic-content/content-1/uploads/upload-1/complete";

function selectFile(onFilesChanged = vi.fn(async () => undefined)) {
  const { container } = render(
    <FilesSection
      contentId="content-1"
      assets={[]}
      disabled={false}
      onFilesChanged={onFilesChanged}
      policyState={{
        policy: {
          attachmentsEnabled: true, maximumFileSizeBytes: "536870912",
          documentsEnabled: true, imagesEnabled: true, videosEnabled: true,
          audioEnabled: true, archivesEnabled: false, otherFilesEnabled: false,
          allowStudentDownload: true, allowGuardianDownload: true, allowInlinePreview: true,
        },
        isLoading: false, error: null, reload: vi.fn(),
      }}
    />,
  );
  fireEvent.change(container.querySelector('input[type="file"]')!, {
    target: { files: [new File(["pdf"], "lesson.pdf", { type: "application/pdf" })] },
  });
  return onFilesChanged;
}

describe("file upload completion recovery", () => {
  beforeEach(() => {
    StorageRequest.transfers = 0;
    StorageRequest.pending = null;
    StorageRequest.holdTransfer = false;
    vi.stubGlobal("XMLHttpRequest", StorageRequest);
    let uploadSequence = 0;
    http.apiPost.mockReset().mockImplementation(async (path: string) => {
      if (path.endsWith("/uploads")) return {
        uploadId: `upload-${++uploadSequence}`, status: "UPLOADING", sessionUrl: "https://storage.example/session",
        expectedMimeType: "application/pdf", expectedSizeBytes: "3", uploadMode: "resumable",
        expiresAt: "2026-10-11T00:00:00Z", capabilityExpiresAt: "2026-10-11T00:00:00Z",
      };
      return completed;
    });
  });

  it.each(["NETWORK_ERROR", "academic_content.file.verification_retryable", "academic_content.file.verification_in_progress"])(
    "retries the same completion after %s without duplicating the attachment",
    async (code) => {
      const post = http.apiPost.getMockImplementation()!;
      let completionAttempts = 0;
      http.apiPost.mockImplementation(async (path: string) => {
        if (path === completePath && completionAttempts++ === 0) throw new ApiError("Verification failed", 409, code);
        return post(path);
      });
      const onFilesChanged = selectFile();
      fireEvent.click(await screen.findByRole("button", { name: "Retry file verification" }));
      expect(await screen.findByRole("status")).toHaveTextContent("uploaded");
      expect(StorageRequest.transfers).toBe(1);
      expect(completionAttempts).toBe(2);
      expect(onFilesChanged).toHaveBeenCalledOnce();
      expect(http.apiPost.mock.calls.filter(([path]) => path.endsWith("/uploads"))).toHaveLength(1);
    },
  );

  it("shows verification and removes Cancel until the backend confirms the attachment", async () => {
    const post = http.apiPost.getMockImplementation()!;
    let confirm!: (response: typeof completed) => void;
    http.apiPost.mockImplementation((path: string) => path === completePath
      ? new Promise((resolve) => { confirm = resolve; }) : post(path));
    const onFilesChanged = selectFile();
    expect(await screen.findByText("File transferred. Verifying the file…")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Cancel upload" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Retry/ })).not.toBeInTheDocument();
    expect(onFilesChanged).not.toHaveBeenCalled();
    expect(closeTabWouldWarn()).toBe(true);
    await act(async () => confirm(completed));
    expect(await screen.findByRole("status")).toHaveTextContent("uploaded");
    expect(closeTabWouldWarn()).toBe(false);
  });

  it("warns during transfer and stops warning after the user cancels", async () => {
    expect(closeTabWouldWarn()).toBe(false);
    StorageRequest.holdTransfer = true;
    selectFile();
    await waitFor(() => expect(StorageRequest.pending).not.toBeNull());
    expect(closeTabWouldWarn()).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Cancel upload" }));
    await screen.findByRole("button", { name: "Retry upload" });
    expect(closeTabWouldWarn()).toBe(false);
  });

  it("starts a fresh upload only when the backend says the previous session expired", async () => {
    const post = http.apiPost.getMockImplementation()!;
    let expired = true;
    http.apiPost.mockImplementation(async (path: string) => {
      if (path === completePath && expired) {
        expired = false;
        throw new ApiError("Expired", 409, "academic_content.file.upload_expired");
      }
      return post(path);
    });
    selectFile();
    fireEvent.click(await screen.findByRole("button", { name: "Retry upload" }));
    expect(await screen.findByRole("status")).toHaveTextContent("uploaded");
    expect(StorageRequest.transfers).toBe(2);
    expect(http.apiPost.mock.calls.some(([path]) => path.endsWith("/upload-2/complete"))).toBe(true);
  });

  it("does not re-upload when refreshing the attachment list fails after completion", async () => {
    const onFilesChanged = vi.fn().mockRejectedValueOnce(ApiError.network()).mockResolvedValue(undefined);
    selectFile(onFilesChanged);
    fireEvent.click(await screen.findByRole("button", { name: "Retry file verification" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("uploaded"));
    expect(StorageRequest.transfers).toBe(1);
    expect(onFilesChanged).toHaveBeenCalledTimes(2);
  });
});
