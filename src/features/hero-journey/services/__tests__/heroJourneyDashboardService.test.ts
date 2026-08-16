import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMocks = vi.hoisted(() => ({ apiGet: vi.fn() }));

vi.mock("@/lib/api", () => apiMocks);

import {
  getHeroJourneyBadgeSummary,
  getHeroJourneyClassroomSummary,
  getHeroJourneyOverview,
  getHeroJourneyStageSummary,
} from "../heroJourneyDashboardService";

describe("hero journey dashboard contracts", () => {
  beforeEach(() => {
    apiMocks.apiGet.mockReset().mockResolvedValue({ data: {} });
  });

  it("uses direct summary endpoints and omits unsupported overview gradeId", async () => {
    await getHeroJourneyOverview({ academicYearId: "year-1" });
    await getHeroJourneyStageSummary("stage-1", { termId: "term-1" });
    await getHeroJourneyClassroomSummary("classroom-1", { termId: "term-1" });
    await getHeroJourneyBadgeSummary({ termId: "term-1" });

    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(
      1,
      "/reinforcement/hero/overview?academicYearId=year-1",
    );
    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(
      2,
      "/reinforcement/hero/stages/stage-1/summary?termId=term-1",
    );
    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(
      3,
      "/reinforcement/hero/classrooms/classroom-1/summary?termId=term-1",
    );
    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(
      4,
      "/reinforcement/hero/badge-summary?termId=term-1",
    );
  });
});
