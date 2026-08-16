import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMocks = vi.hoisted(() => ({ apiGet: vi.fn(), apiPost: vi.fn() }));
vi.mock("@/lib/api", () => apiMocks);

import { completeHeroJourneyMission, completeHeroJourneyObjective, getHeroJourneyProgress, getStudentHeroJourneyProgress, startHeroJourneyMission } from "../heroJourneyProgressService";

describe("hero journey progress contracts", () => {
  beforeEach(() => { apiMocks.apiGet.mockReset().mockResolvedValue({ data: {} }); apiMocks.apiPost.mockReset().mockResolvedValue({ data: {} }); });
  it("uses direct progress endpoints", async () => {
    await getStudentHeroJourneyProgress("student-1", { termId: "term-1" });
    await getHeroJourneyProgress("progress-1");
    await startHeroJourneyMission("student-1", "mission-1", {});
    await completeHeroJourneyObjective("progress-1", "objective-1", {});
    await completeHeroJourneyMission("progress-1", {});
    expect(apiMocks.apiGet).toHaveBeenCalledWith("/reinforcement/hero/students/student-1/progress?termId=term-1");
    expect(apiMocks.apiPost).toHaveBeenCalledWith("/reinforcement/hero/progress/progress-1/complete", {});
  });
});
