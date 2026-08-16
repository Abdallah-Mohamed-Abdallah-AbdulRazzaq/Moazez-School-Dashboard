import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMocks = vi.hoisted(() => ({ apiGet: vi.fn(), apiPost: vi.fn() }));
vi.mock("@/lib/api", () => apiMocks);

import { awardHeroJourneyBadge, getStudentHeroJourneyRewards, grantHeroJourneyXp } from "../heroJourneyRewardsService";

describe("hero journey rewards contracts", () => {
  beforeEach(() => { apiMocks.apiGet.mockReset().mockResolvedValue({ data: {} }); apiMocks.apiPost.mockReset().mockResolvedValue({ data: {} }); });
  it("uses direct rewards and mutation endpoints", async () => {
    await getStudentHeroJourneyRewards("student-1", { termId: "term-1" });
    await grantHeroJourneyXp("progress-1", { amount: 25, reason: "Great work" });
    await awardHeroJourneyBadge("progress-1", {});
    expect(apiMocks.apiGet).toHaveBeenCalledWith("/reinforcement/hero/students/student-1/rewards?termId=term-1");
    expect(apiMocks.apiPost).toHaveBeenCalledWith("/reinforcement/hero/progress/progress-1/grant-xp", { amount: 25, reason: "Great work" });
    expect(apiMocks.apiPost).toHaveBeenCalledWith("/reinforcement/hero/progress/progress-1/award-badge", {});
  });
});
