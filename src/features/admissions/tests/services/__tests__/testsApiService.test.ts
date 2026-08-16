import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import {
  completePlacementTest,
  createPlacementTest,
  fetchPlacementTests,
} from "@/features/admissions/tests/services/testsApiService";

vi.mock("@/lib/api", () => ({
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  apiPost: vi.fn(),
}));

const postTest = vi.mocked(apiPost);
const patchTest = vi.mocked(apiPatch);
const getTests = vi.mocked(apiGet);
const response = {
  id: "test-1",
  applicationId: "application-1",
  studentName: "Student",
  subjectId: "subject-1",
  subjectName: "Mathematics",
  type: "Placement Test",
  scheduledAt: "2026-07-03T11:14:00.000Z",
  score: null,
  result: null,
  status: "scheduled",
};

describe("placement test request mapping", () => {
  beforeEach(() => {
    getTests.mockReset().mockResolvedValue({
      items: [response],
      pagination: { page: 2, limit: 20, total: 25 },
    });
    postTest.mockReset().mockResolvedValue(response);
    patchTest.mockReset().mockResolvedValue({
      ...response,
      score: 85,
      result: "Passed",
      status: "completed",
    });
  });

  it("returns pagination and sends all supported filters", async () => {
    const result = await fetchPlacementTests({
      search: "Student",
      status: "scheduled",
      type: "Placement Test",
      dateFrom: "2026-07-01",
      dateTo: "2026-07-31",
      page: 2,
      limit: 20,
    });

    expect(getTests).toHaveBeenCalledWith(
      "/admissions/tests?search=Student&status=scheduled&type=Placement+Test&dateFrom=2026-07-01&dateTo=2026-07-31&page=2&limit=20",
    );
    expect(result.pagination).toEqual({ page: 2, limit: 20, total: 25 });
    expect(result.items).toHaveLength(1);
  });

  it("sends the selected subject identity when scheduling", async () => {
    await createPlacementTest({
      applicationId: "application-1",
      subjectId: "subject-1",
      type: "Placement Test",
      scheduledAt: "2026-07-03T11:14:00.000Z",
    });

    expect(postTest).toHaveBeenCalledWith("/admissions/tests", {
      applicationId: "application-1",
      subjectId: "subject-1",
      type: "Placement Test",
      scheduledAt: "2026-07-03T11:14:00.000Z",
    });
  });

  it("sends only score, result, and completed status when scoring", async () => {
    await completePlacementTest("test-1", { score: 85, result: "Passed" });

    expect(patchTest).toHaveBeenCalledWith("/admissions/tests/test-1", {
      status: "completed",
      score: 85,
      result: "Passed",
    });
  });
});
