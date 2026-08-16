import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}));

vi.mock("@/lib/api", () => apiMocks);

import {
  getSchoolSupportConversation,
  getSchoolSupportMessages,
  markSchoolSupportRead,
  sendSchoolSupportMessage,
} from "./schoolSupport.service";

describe("school support service", () => {
  beforeEach(() => {
    apiMocks.apiGet.mockReset().mockResolvedValue({});
    apiMocks.apiPost.mockReset().mockResolvedValue({});
  });

  it("uses the school support contract endpoints", async () => {
    await getSchoolSupportConversation();
    await getSchoolSupportMessages({
      before: "2026-07-08T12:00:00.000Z",
      limit: 50,
    });
    await sendSchoolSupportMessage({
      body: "Need help",
      clientMessageId: "client-1",
    });
    await markSchoolSupportRead({
      readAt: "2026-07-08T12:05:00.000Z",
    });

    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(
      1,
      "/school-support/conversation",
    );
    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(
      2,
      "/school-support/messages",
      {
        params: {
          before: "2026-07-08T12:00:00.000Z",
          limit: 50,
        },
      },
    );
    expect(apiMocks.apiPost).toHaveBeenNthCalledWith(
      1,
      "/school-support/messages",
      {
        body: "Need help",
        clientMessageId: "client-1",
      },
    );
    expect(apiMocks.apiPost).toHaveBeenNthCalledWith(
      2,
      "/school-support/read",
      {
        readAt: "2026-07-08T12:05:00.000Z",
      },
    );
  });

});
