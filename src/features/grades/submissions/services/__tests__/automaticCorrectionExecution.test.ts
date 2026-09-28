import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AutomaticCorrectionPlan } from "../../utils/automaticCorrection";

const api = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPut: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
}));

vi.mock("@/lib/api", () => api);

import { executeAutomaticCorrectionPlan } from "../automaticCorrectionExecution";

const submissionId = "123e4567-e89b-42d3-a456-426614174001";
const answerId = "123e4567-e89b-42d3-a456-426614174002";
const questionId = "123e4567-e89b-42d3-a456-426614174003";

const completePlan: AutomaticCorrectionPlan = {
  reviews: [{ answerId, questionId, awardedPoints: 4 }],
  skipped: [],
  summary: {
    correctedCount: 1,
    manualCount: 0,
    missingAnswerCount: 0,
    invalidKeyCount: 0,
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  api.apiPut.mockResolvedValue({});
  api.apiPost.mockResolvedValue({});
});

describe("executeAutomaticCorrectionPlan", () => {
  it("saves objective scores, finalizes, then syncs a complete submission", async () => {
    await expect(executeAutomaticCorrectionPlan(submissionId, completePlan))
      .resolves.toEqual({ finalized: true });

    expect(api.apiPut).toHaveBeenCalledWith(
      `/grades/submissions/${submissionId}/answers/review`,
      { reviews: [{ answerId, awardedPoints: 4 }] },
    );
    expect(api.apiPost).toHaveBeenCalledWith(
      `/grades/submissions/${submissionId}/review/finalize`,
    );
    expect(api.apiPost).toHaveBeenCalledWith(
      `/grades/submissions/${submissionId}/sync-grade-item`,
    );
    expect(api.apiPut.mock.invocationCallOrder[0])
      .toBeLessThan(api.apiPost.mock.invocationCallOrder[0]);
    expect(api.apiPost.mock.invocationCallOrder[0])
      .toBeLessThan(api.apiPost.mock.invocationCallOrder[1]);
  });

  it.each([
    ["manual question", { manualCount: 1, missingAnswerCount: 0, invalidKeyCount: 0 }],
    ["missing answer", { manualCount: 0, missingAnswerCount: 1, invalidKeyCount: 0 }],
    ["invalid key", { manualCount: 0, missingAnswerCount: 0, invalidKeyCount: 1 }],
  ])("does not finalize when %s remains", async (_scenario, unresolved) => {
    const plan: AutomaticCorrectionPlan = {
      ...completePlan,
      summary: { correctedCount: 1, ...unresolved },
    };

    await expect(executeAutomaticCorrectionPlan(submissionId, plan))
      .resolves.toEqual({ finalized: false });
    expect(api.apiPut).toHaveBeenCalledTimes(1);
    expect(api.apiPost).not.toHaveBeenCalled();
  });

  it("finalizes a complete submission without review payloads", async () => {
    const plan: AutomaticCorrectionPlan = {
      ...completePlan,
      reviews: [],
      summary: { ...completePlan.summary, correctedCount: 0 },
    };

    await expect(executeAutomaticCorrectionPlan(submissionId, plan))
      .resolves.toEqual({ finalized: true });
    expect(api.apiPut).not.toHaveBeenCalled();
    expect(api.apiPost).toHaveBeenCalledTimes(2);
  });

  it("keeps saved scores when finalization fails", async () => {
    api.apiPost.mockRejectedValueOnce(new Error("Finalize failed"));

    await expect(executeAutomaticCorrectionPlan(submissionId, completePlan))
      .rejects.toThrow("Finalize failed");
    expect(api.apiPut).toHaveBeenCalledTimes(1);
    expect(api.apiPost).toHaveBeenCalledTimes(1);
  });

  it("keeps the finalized submission when grade synchronization fails", async () => {
    api.apiPost
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error("Sync failed"));

    await expect(executeAutomaticCorrectionPlan(submissionId, completePlan))
      .rejects.toThrow("Sync failed");
    expect(api.apiPut).toHaveBeenCalledTimes(1);
    expect(api.apiPost).toHaveBeenNthCalledWith(
      1,
      `/grades/submissions/${submissionId}/review/finalize`,
    );
    expect(api.apiPost).toHaveBeenNthCalledWith(
      2,
      `/grades/submissions/${submissionId}/sync-grade-item`,
    );
  });
});
