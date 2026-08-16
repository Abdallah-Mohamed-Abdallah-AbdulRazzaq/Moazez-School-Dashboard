import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  apiPost: vi.fn(),
}));

vi.mock("@/lib/api", () => api);

import {
  listApplications,
  patchApplication,
  postApplication,
  postApplicationSubmission,
} from "../applicationsApi";

const application = {
  id: "app-1",
  leadId: null,
  studentName: "Omar Ahmed",
  requestedAcademicYearId: "year-1",
  requestedGradeId: "grade-1",
  source: "referral",
  status: "documents_pending",
  submittedAt: null,
  createdAt: "2026-06-30T09:00:00.000Z",
  updatedAt: "2026-06-30T09:00:00.000Z",
};

describe("applications API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.apiGet.mockResolvedValue([application]);
    api.apiPost.mockResolvedValue(application);
    api.apiPatch.mockResolvedValue(application);
  });

  it("uses only the documented status list filter", async () => {
    await listApplications("documents_pending");
    expect(api.apiGet).toHaveBeenCalledWith(
      "/admissions/applications?status=documents_pending",
    );
  });

  it("uses exact create, patch, and submit routes", async () => {
    const createPayload = {
      studentName: "Omar Ahmed",
      requestedAcademicYearId: "year-1",
      requestedGradeId: "grade-1",
      source: "referral" as const,
    };
    await postApplication(createPayload);
    await patchApplication("app-1", { studentName: "Omar A." });
    await postApplicationSubmission("app-1");

    expect(api.apiPost).toHaveBeenCalledWith("/admissions/applications", createPayload);
    expect(api.apiPatch).toHaveBeenCalledWith("/admissions/applications/app-1", {
      studentName: "Omar A.",
    });
    expect(api.apiPost).toHaveBeenCalledWith(
      "/admissions/applications/app-1/submit",
      {},
    );
  });
});

