import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet, apiPatch, apiPost, apiPut } from "@/lib/api";
import { collectHomeworkCorrectionTargets, runHomeworkAutomaticCorrectionBatch } from "../homeworkAutomaticCorrectionBatch";
import type { HomeworkCorrectionContext } from "../homeworkAutomaticCorrectionExecution";
vi.mock("@/lib/api", () => ({ apiGet: vi.fn(), apiPatch: vi.fn(), apiPost: vi.fn(), apiPut: vi.fn(), apiDelete: vi.fn() }));
beforeEach(() => vi.resetAllMocks());
describe("homework bulk target resolution", () => {
  it("keeps correction retries open when other students were explicitly chosen for finalization", async () => {
    const context: HomeworkCorrectionContext = {
      homeworkId: "hw", assignmentStatus: "published", isGraded: true, totalMarks: 2,
      canManage: true, canSync: true, canViewSyncStatus: true, reviewMode: "review_first",
      questions: [{ id: "q", assignmentId: "hw", questionTextAr: "", questionTextEn: "Q",
        questionType: "MCQ_SINGLE", points: 2, order: 0, createdAt: "today",
        options: [{ id: "correct", textAr: "", textEn: "A", isCorrect: true, order: 0 }] }],
    };
    vi.mocked(apiGet).mockImplementation(async path => {
      if (path.endsWith("/answers")) return { items: [{ answerId: "answer", questionId: "q", selectedOptionIds: ["correct"], awardedPoints: 2, reviewedAt: "today" }] } as never;
      if (path.endsWith("/grade-sync")) return { linked: true } as never;
      return { submission: { id: path.split("/").at(-1), status: "submitted" } } as never;
    });
    vi.mocked(apiPut).mockResolvedValue({ items: [] });
    vi.mocked(apiPatch).mockResolvedValue({ submission: { id: "finalizing", status: "reviewed" } });
    vi.mocked(apiPost).mockResolvedValue({ submissionSync: { synced: true } });

    const outcomes = await runHomeworkAutomaticCorrectionBatch({ context, submissionIds: ["finalizing", "correcting"],
      retryStages: { finalizing: "review", correcting: "answers" },
      reviewModes: { finalizing: "finalize", correcting: "review_first" } });

    expect(outcomes.map(outcome => ({ id: outcome.submissionId, outcome: outcome.outcome, gradeSynced: outcome.gradeSynced })))
      .toEqual([{ id: "finalizing", outcome: "complete", gradeSynced: true }, { id: "correcting", outcome: "review_pending", gradeSynced: false }]);
    expect(apiPatch).toHaveBeenCalledOnce();
    expect(apiPatch).toHaveBeenCalledWith("/homework/assignments/hw/submissions/finalizing/review", {});
  });
  it.each(["filtered", "all"] as const)("collects unique submitted and late students across pages (%s)", async scope => {
    vi.mocked(apiGet).mockResolvedValueOnce({ items: [{ id: "a", status: "submitted" }, { id: "draft", status: "draft" }], pagination: { page: 1, limit: 2, total: 4 } })
      .mockResolvedValueOnce({ items: [{ id: "a", status: "submitted" }, { id: "b", status: "late" }], pagination: { page: 2, limit: 2, total: 4 } });
    expect(await collectHomeworkCorrectionTargets("hw", "published", scope, { search: "Ali", status: "pending_review", page: 7 })).toEqual(["a", "b"]);
    const secondParams = vi.mocked(apiGet).mock.calls[1][1]?.params;
    expect(secondParams).toMatchObject({ page: 2, limit: 100 });
    expect(secondParams?.search).toBe(scope === "filtered" ? "Ali" : undefined);
  });
  it("continues after one student's detail request fails and deduplicates targets", async () => {
    vi.mocked(apiGet).mockRejectedValueOnce(new Error("offline")).mockResolvedValue({ submission: { id: "b", status: "draft" } });
    const onProgress = vi.fn();
    const outcomes = await runHomeworkAutomaticCorrectionBatch({ context: { homeworkId: "hw", assignmentStatus: "published", isGraded: true, totalMarks: 2, canManage: true, canSync: true, canViewSyncStatus: true, questions: [] }, submissionIds: ["a", "b", "a"], onProgress });
    expect(outcomes.map(outcome => outcome.outcome)).toEqual(["failed", "skipped"]);
    expect(onProgress).toHaveBeenLastCalledWith({ processed: 2, total: 2 });
  });
  it("limits detail requests to three students at a time", async () => {
    let activeRequests = 0;
    let peakRequests = 0;
    vi.mocked(apiGet).mockImplementation(async () => {
      peakRequests = Math.max(peakRequests, ++activeRequests);
      await Promise.resolve();
      activeRequests -= 1;
      return { submission: { id: "s", status: "draft" } } as never;
    });
    const outcomes = await runHomeworkAutomaticCorrectionBatch({ context: { homeworkId: "hw", assignmentStatus: "published", isGraded: true, totalMarks: 2, canManage: true, canSync: true, canViewSyncStatus: true, questions: [] }, submissionIds: ["a", "b", "c", "d", "e", "f"] });
    expect(peakRequests).toBe(3);
    expect(outcomes.map(outcome => outcome.outcome)).toEqual(Array(6).fill("skipped"));
  });
});
