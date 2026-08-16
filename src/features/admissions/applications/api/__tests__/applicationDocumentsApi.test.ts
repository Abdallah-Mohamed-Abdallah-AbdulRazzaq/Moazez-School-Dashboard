import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  apiDelete: vi.fn(),
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}));
vi.mock("@/lib/api", () => api);

import {
  acceptApplicationDocument,
  deleteApplicationDocument,
  linkApplicationDocument,
  listApplicationDocuments,
  rejectApplicationDocument,
  requestApplicationDocumentReplacement,
} from "../applicationDocumentsApi";

const documentDto = {
  id: "doc-1",
  applicationId: "app-1",
  fileId: "file-1",
  documentType: "Birth Certificate",
  status: "pending_review",
  notes: null,
  createdAt: "2026-06-30T09:00:00.000Z",
  updatedAt: "2026-06-30T09:00:00.000Z",
};

describe("application documents API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.apiGet.mockResolvedValue([documentDto]);
    api.apiPost.mockResolvedValue(documentDto);
    api.apiDelete.mockResolvedValue({ ok: true });
  });

  it("lists and links documents through the application route", async () => {
    await listApplicationDocuments("app-1");
    await linkApplicationDocument("app-1", {
      fileId: "file-1",
      documentType: "Birth Certificate",
      status: "pending_review",
    });

    expect(api.apiGet).toHaveBeenCalledWith(
      "/admissions/applications/app-1/documents",
    );
    expect(api.apiPost).toHaveBeenCalledWith(
      "/admissions/applications/app-1/documents",
      {
        fileId: "file-1",
        documentType: "Birth Certificate",
        status: "pending_review",
      },
    );
  });

  it("covers accept, reject, replacement, and delete routes", async () => {
    await acceptApplicationDocument("app-1", "doc-1", " Verified ");
    await rejectApplicationDocument("app-1", "doc-2", " Unreadable ");
    await requestApplicationDocumentReplacement("app-1", "doc-3", " Clearer copy ");
    await deleteApplicationDocument("app-1", "doc-4");

    expect(api.apiPost).toHaveBeenCalledWith(
      "/admissions/applications/app-1/documents/doc-1/accept",
      { note: "Verified" },
    );
    expect(api.apiPost).toHaveBeenCalledWith(
      "/admissions/applications/app-1/documents/doc-2/reject",
      { note: "Unreadable" },
    );
    expect(api.apiPost).toHaveBeenCalledWith(
      "/admissions/applications/app-1/documents/doc-3/request-replacement",
      { note: "Clearer copy" },
    );
    expect(api.apiDelete).toHaveBeenCalledWith(
      "/admissions/applications/app-1/documents/doc-4",
    );
  });
});

