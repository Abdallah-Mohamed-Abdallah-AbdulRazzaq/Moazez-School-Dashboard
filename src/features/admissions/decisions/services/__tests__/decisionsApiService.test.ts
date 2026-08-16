import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}));

vi.mock("@/lib/api", () => api);

import {
  createDecision,
  fetchDecisionById,
  fetchDecisions,
} from "@/features/admissions/decisions/services/decisionsApiService";

const decisionDto = {
  id: "decision-1",
  applicationId: "app-1",
  decision: "accept",
  reason: "Eligible applicant",
  decidedByUserId: "user-1",
  decidedByName: "Admissions Officer",
  decidedAt: "2026-06-30T10:00:00.000Z",
};

describe("decisions API service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.apiGet.mockResolvedValue({
      items: [decisionDto],
      pagination: { page: 1, limit: 20, total: 1 },
    });
    api.apiPost.mockResolvedValue(decisionDto);
  });

  it("uses documented decision read routes and supported query params", async () => {
    const result = await fetchDecisions({
      search: "Omar",
      decision: "accept",
      dateFrom: "2026-06-01",
      dateTo: "2026-06-30",
      page: 1,
      limit: 20,
    });
    expect(api.apiGet).toHaveBeenCalledWith(
      "/admissions/decisions?search=Omar&decision=accept&dateFrom=2026-06-01&dateTo=2026-06-30&page=1&limit=20",
    );
    expect(result.pagination).toEqual({ page: 1, limit: 20, total: 1 });

    api.apiGet.mockResolvedValue(decisionDto);
    await fetchDecisionById("decision-1");
    expect(api.apiGet).toHaveBeenCalledWith("/admissions/decisions/decision-1");
  });

  it("posts only documented create fields and trims reason", async () => {
    await createDecision({
      applicationId: "app-1",
      decision: "waitlist",
      reason: "  Needs capacity review  ",
    });

    expect(api.apiPost).toHaveBeenCalledWith("/admissions/decisions", {
      applicationId: "app-1",
      decision: "waitlist",
      reason: "Needs capacity review",
    });
  });

  it("normalizes decidedAt and decidedByUserId from backend response", async () => {
    const decision = await createDecision({
      applicationId: "app-1",
      decision: "accept",
      reason: "Eligible applicant",
    });

    expect(decision.decisionDate).toBe("2026-06-30T10:00:00.000Z");
    expect(decision.decidedBy).toBe("Admissions Officer");
  });
});
