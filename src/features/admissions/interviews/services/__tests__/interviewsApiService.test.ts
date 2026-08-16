import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import {
  completeInterview,
  createInterview,
  fetchInterviews,
} from "@/features/admissions/interviews/services/interviewsApiService";

vi.mock("@/lib/api", () => ({
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  apiPost: vi.fn(),
}));

const postInterview = vi.mocked(apiPost);
const patchInterview = vi.mocked(apiPatch);
const getInterviews = vi.mocked(apiGet);

describe("createInterview", () => {
  beforeEach(() => {
    getInterviews.mockReset();
    postInterview.mockReset();
  });

  it("sends the selected interviewer ID and name", async () => {
    postInterview.mockResolvedValue({
      id: "interview-1",
      applicationId: "application-1",
      scheduledAt: "2026-06-30T16:08:00.000Z",
      interviewerUserId: "user-1",
      interviewerName: "Interview Teacher",
      status: "scheduled",
    });

    await createInterview({
      applicationId: "application-1",
      scheduledAt: "2026-06-30T16:08:00.000Z",
      interviewerUserId: "user-1",
      interviewerName: "Interview Teacher",
      notes: "Follow-up notes",
    });

    expect(postInterview).toHaveBeenCalledWith("/admissions/interviews", {
      applicationId: "application-1",
      scheduledAt: "2026-06-30T16:08:00.000Z",
      interviewerUserId: "user-1",
      interviewerName: "Interview Teacher",
      notes: "Follow-up notes",
    });
  });
});

describe("fetchInterviews", () => {
  it("returns pagination and sends all supported filters", async () => {
    getInterviews.mockResolvedValue({
      items: [
        {
          id: "interview-1",
          applicationId: "application-1",
          scheduledAt: "2026-07-08T09:03:00.000Z",
          status: "scheduled",
        },
      ],
      pagination: { page: 3, limit: 20, total: 45 },
    });

    const result = await fetchInterviews({
      search: "Student",
      status: "scheduled",
      dateFrom: "2026-07-01",
      dateTo: "2026-07-31",
      page: 3,
      limit: 20,
    });

    expect(getInterviews).toHaveBeenCalledWith(
      "/admissions/interviews?search=Student&status=scheduled&dateFrom=2026-07-01&dateTo=2026-07-31&page=3&limit=20",
    );
    expect(result.pagination).toEqual({ page: 3, limit: 20, total: 45 });
  });
});

describe("completeInterview", () => {
  beforeEach(() => {
    patchInterview.mockReset();
  });

  it("sends only completed status and notes", async () => {
    patchInterview.mockResolvedValue({
      id: "interview-1",
      applicationId: "application-1",
      scheduledAt: "2026-07-08T09:03:00.000Z",
      interviewerUserId: "user-1",
      status: "completed",
      notes: "Evaluation notes",
    });

    await completeInterview("interview-1", {
      status: "completed",
      notes: "Evaluation notes",
    });

    expect(patchInterview).toHaveBeenCalledWith(
      "/admissions/interviews/interview-1",
      { status: "completed", notes: "Evaluation notes" },
    );
  });
});
