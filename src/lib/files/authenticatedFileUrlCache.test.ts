import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  clearAuthenticatedFileUrlCache,
  getCachedAuthenticatedFile,
  loadAuthenticatedFileUrl,
} from "@/lib/files/authenticatedFileUrlCache";

const fileServiceMocks = vi.hoisted(() => ({
  downloadFileBlob: vi.fn(),
}));

vi.mock("@/services/filesService", () => ({
  downloadFileBlob: fileServiceMocks.downloadFileBlob,
}));

const createObjectUrlMock = vi.fn(() => "blob:cached-file");
const revokeObjectUrlMock = vi.fn();

describe("authenticatedFileUrlCache", () => {
  beforeAll(() => {
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectUrlMock,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectUrlMock,
    });
  });

  beforeEach(() => {
    fileServiceMocks.downloadFileBlob.mockReset();
    createObjectUrlMock.mockReset().mockReturnValue("blob:cached-file");
    revokeObjectUrlMock.mockReset();
  });

  afterEach(() => {
    clearAuthenticatedFileUrlCache();
  });

  afterAll(() => {
    Reflect.deleteProperty(URL, "createObjectURL");
    Reflect.deleteProperty(URL, "revokeObjectURL");
  });

  it("reuses one authenticated download for repeated and concurrent requests", async () => {
    const blob = new Blob(["image"], { type: "image/png" });
    fileServiceMocks.downloadFileBlob.mockResolvedValue(blob);

    const [firstFile, concurrentFile] = await Promise.all([
      loadAuthenticatedFileUrl("file-1"),
      loadAuthenticatedFileUrl("file-1"),
    ]);
    const repeatedFile = await loadAuthenticatedFileUrl("file-1");

    expect(fileServiceMocks.downloadFileBlob).toHaveBeenCalledTimes(1);
    expect(fileServiceMocks.downloadFileBlob).toHaveBeenCalledWith("file-1");
    expect(concurrentFile).toBe(firstFile);
    expect(repeatedFile).toBe(firstFile);
    expect(getCachedAuthenticatedFile("file-1")).toBe(firstFile);
  });

  it("revokes cached URLs and downloads again after the cache is cleared", async () => {
    fileServiceMocks.downloadFileBlob.mockResolvedValue(
      new Blob(["image"], { type: "image/png" }),
    );

    await loadAuthenticatedFileUrl("file-1");
    clearAuthenticatedFileUrlCache();
    await loadAuthenticatedFileUrl("file-1");

    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:cached-file");
    expect(fileServiceMocks.downloadFileBlob).toHaveBeenCalledTimes(2);
  });

  it("evicts the least recently used file when the session cache reaches its limit", async () => {
    createObjectUrlMock.mockImplementation(
      () => `blob:cached-file-${createObjectUrlMock.mock.calls.length}`,
    );
    fileServiceMocks.downloadFileBlob.mockResolvedValue(
      new Blob(["image"], { type: "image/png" }),
    );

    for (let index = 0; index <= 100; index += 1) {
      await loadAuthenticatedFileUrl(`file-${index}`);
    }

    expect(getCachedAuthenticatedFile("file-0")).toBeUndefined();
    expect(getCachedAuthenticatedFile("file-100")).toBeDefined();
    expect(revokeObjectUrlMock).toHaveBeenCalledWith("blob:cached-file-1");
  });

  it("does not retain a download that finishes after the session cache is cleared", async () => {
    let finishDownload: ((blob: Blob) => void) | undefined;
    fileServiceMocks.downloadFileBlob.mockReturnValue(
      new Promise<Blob>((resolve) => {
        finishDownload = resolve;
      }),
    );

    const pendingFile = loadAuthenticatedFileUrl("file-pending");
    clearAuthenticatedFileUrlCache();
    finishDownload?.(new Blob(["image"], { type: "image/png" }));

    await expect(pendingFile).rejects.toThrow(
      "Authenticated file request was invalidated.",
    );
    expect(getCachedAuthenticatedFile("file-pending")).toBeUndefined();
    expect(revokeObjectUrlMock).toHaveBeenCalledWith("blob:cached-file");
  });
});
