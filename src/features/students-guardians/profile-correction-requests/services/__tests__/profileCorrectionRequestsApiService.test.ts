import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}));

vi.mock("@/lib/api", () => apiMocks);

import {
  approveProfileCorrectionRequest,
  fetchProfileCorrectionRequests,
  rejectProfileCorrectionRequest,
} from "@/features/students-guardians/profile-correction-requests/services/profileCorrectionRequestsApiService";

describe("profileCorrectionRequestsApiService", () => {
  beforeEach(() => {
    apiMocks.apiGet.mockReset().mockResolvedValue([]);
    apiMocks.apiPost.mockReset().mockResolvedValue({
      id: "request-1",
      status: "APPROVED",
      changes: [],
    });
  });

  it("sends only supported status and studentId query params", async () => {
    await fetchProfileCorrectionRequests({
      status: "PENDING",
      studentId: "student-1",
    });

    expect(apiMocks.apiGet).toHaveBeenCalledWith(
      "/students-guardians/profile-correction-requests?status=PENDING&studentId=student-1",
    );
  });

  it("does not send all status as an unsupported query value", async () => {
    await fetchProfileCorrectionRequests({
      status: "all",
      studentId: "student-1",
    });

    expect(apiMocks.apiGet).toHaveBeenCalledWith(
      "/students-guardians/profile-correction-requests?studentId=student-1",
    );
  });

  it("sends reviewer note only when provided", async () => {
    await approveProfileCorrectionRequest("request-1", {
      reviewerNote: "Looks valid.",
    });
    await rejectProfileCorrectionRequest("request-2");

    expect(apiMocks.apiPost).toHaveBeenNthCalledWith(
      1,
      "/students-guardians/profile-correction-requests/request-1/approve",
      { reviewerNote: "Looks valid." },
    );
    expect(apiMocks.apiPost).toHaveBeenNthCalledWith(
      2,
      "/students-guardians/profile-correction-requests/request-2/reject",
      {},
    );
  });
});
