import { render, waitFor } from "@testing-library/react";
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
import Avatar from "@/features/communication/conversations_redesign/components/Avatar";
import { clearAuthenticatedFileUrlCache } from "@/lib/files/authenticatedFileUrlCache";

const fileServiceMocks = vi.hoisted(() => ({
  downloadFileBlob: vi.fn(),
}));

vi.mock("@/services/filesService", () => ({
  downloadFileBlob: fileServiceMocks.downloadFileBlob,
}));

const createObjectUrlMock = vi.fn(() => "blob:cached-avatar");
const revokeObjectUrlMock = vi.fn();

describe("conversation Avatar", () => {
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
    createObjectUrlMock.mockClear();
    revokeObjectUrlMock.mockClear();
  });

  afterEach(() => {
    clearAuthenticatedFileUrlCache();
  });

  afterAll(() => {
    Reflect.deleteProperty(URL, "createObjectURL");
    Reflect.deleteProperty(URL, "revokeObjectURL");
  });

  it("reuses a downloaded avatar after the component is reopened", async () => {
    fileServiceMocks.downloadFileBlob.mockResolvedValue(
      new Blob(["avatar"], { type: "image/png" }),
    );

    const firstRender = render(
      <Avatar fileId="avatar-file-1" name="Teacher" />,
    );

    await waitFor(() => {
      expect(firstRender.container.firstChild).toHaveStyle({
        backgroundImage: 'url("blob:cached-avatar")',
      });
    });

    firstRender.unmount();
    const secondRender = render(
      <Avatar fileId="avatar-file-1" name="Teacher" />,
    );

    expect(secondRender.container.firstChild).toHaveStyle({
      backgroundImage: 'url("blob:cached-avatar")',
    });
    expect(fileServiceMocks.downloadFileBlob).toHaveBeenCalledTimes(1);
  });
});
