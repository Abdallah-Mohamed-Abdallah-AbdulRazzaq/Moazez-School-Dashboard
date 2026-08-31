import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { apiClient } from "@/lib/api";
import { downloadBackendAttachment } from "../downloadBackendAttachment";

vi.mock("@/lib/api", () => ({
  apiClient: { get: vi.fn() },
}));

const mockedGet = vi.mocked(apiClient.get);
const createObjectUrlMock = vi.fn(() => "blob:attachment");
const revokeObjectUrlMock = vi.fn();
const clickedFilenames: string[] = [];

function blobResponse(contentDisposition?: string): AxiosResponse<Blob> {
  return {
    config: {} as InternalAxiosRequestConfig,
    data: new Blob(["unmodified attachment bytes"], { type: "text/csv" }),
    headers: contentDisposition ? { "content-disposition": contentDisposition } : {},
    status: 200,
    statusText: "OK",
  };
}

describe("downloadBackendAttachment", () => {
  beforeAll(() => {
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectUrlMock,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectUrlMock,
    });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function () {
      clickedFilenames.push(this.download);
    });
  });

  beforeEach(() => {
    mockedGet.mockReset();
    createObjectUrlMock.mockReset().mockReturnValue("blob:attachment");
    revokeObjectUrlMock.mockReset();
    clickedFilenames.length = 0;
  });

  afterAll(() => {
    Reflect.deleteProperty(URL, "createObjectURL");
    Reflect.deleteProperty(URL, "revokeObjectURL");
    vi.restoreAllMocks();
  });

  it.each([
    [
      'attachment; filename="student credentials.csv"',
      "fallback.csv",
      "student credentials.csv",
    ],
    [
      "attachment; filename*=UTF-8''student%20cr%C3%A9dentials.csv",
      "fallback.csv",
      "student crédentials.csv",
    ],
    [undefined, "fallback.csv", "fallback.csv"],
  ])(
    "downloads the backend blob with filename %s",
    async (contentDisposition, fallbackFilename, expectedFilename) => {
      const response = blobResponse(contentDisposition);
      mockedGet.mockResolvedValue(response);

      await downloadBackendAttachment("/batches/batch-1/attachment", fallbackFilename);

      expect(mockedGet).toHaveBeenCalledWith("/batches/batch-1/attachment", {
        responseType: "blob",
      });
      expect(createObjectUrlMock).toHaveBeenCalledTimes(1);
      expect(createObjectUrlMock).toHaveBeenCalledWith(response.data);
      expect(clickedFilenames).toEqual([expectedFilename]);
      expect(revokeObjectUrlMock).toHaveBeenCalledWith("blob:attachment");

      const temporaryAnchor = document.querySelector('a[href="blob:attachment"]');
      expect(temporaryAnchor).not.toBeInTheDocument();
    },
  );
});
