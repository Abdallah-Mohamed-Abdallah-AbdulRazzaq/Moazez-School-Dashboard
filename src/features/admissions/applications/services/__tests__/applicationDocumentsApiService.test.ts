import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMocks = vi.hoisted(() => ({
  apiPost: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  apiClient: {
    post: vi.fn(),
  },
  apiGet: vi.fn(),
  apiPost: apiMocks.apiPost,
}));

import {
  acceptApplicationDocument,
  rejectApplicationDocument,
  requestApplicationDocumentReplacement,
} from "@/features/admissions/applications/services/applicationDocumentsApiService";

describe("application document review endpoint contracts", () => {
  beforeEach(() => {
    apiMocks.apiPost.mockReset().mockResolvedValue({});
  });

  it("posts document review actions to school-side admissions endpoints", async () => {
    await acceptApplicationDocument("app-1", "doc-1");
    await acceptApplicationDocument("app-1", "doc-2", "Looks good");
    await rejectApplicationDocument("app-1", "doc-3", "Unreadable scan");
    await requestApplicationDocumentReplacement("app-1", "doc-4", "Expired copy");

    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/admissions/applications/app-1/documents/doc-1/accept",
      {},
    );
    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/admissions/applications/app-1/documents/doc-2/accept",
      { note: "Looks good" },
    );
    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/admissions/applications/app-1/documents/doc-3/reject",
      { note: "Unreadable scan" },
    );
    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/admissions/applications/app-1/documents/doc-4/request-replacement",
      { note: "Expired copy" },
    );
  });
});
