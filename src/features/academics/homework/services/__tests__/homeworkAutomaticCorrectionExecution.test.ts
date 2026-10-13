import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet, apiPatch, apiPost, apiPut } from "@/lib/api";
import type { AssignmentQuestion } from "@/features/academics/curriculum/services/curriculumService";
import { executeHomeworkAutomaticCorrection, type HomeworkCorrectionContext } from "../homeworkAutomaticCorrectionExecution";

vi.mock("@/lib/api", () => ({ apiGet: vi.fn(), apiPatch: vi.fn(), apiPost: vi.fn(), apiPut: vi.fn(), apiDelete: vi.fn() }));
const question: AssignmentQuestion = {
  id: "q", assignmentId: "hw", questionTextAr: "", questionTextEn: "Q", questionType: "MCQ_SINGLE",
  points: 2, order: 0, createdAt: "today", options: [{ id: "correct", textAr: "", textEn: "A", order: 0, isCorrect: true }],
};
const context: HomeworkCorrectionContext = { homeworkId: "hw", assignmentStatus: "published", isGraded: true, totalMarks: 2, canManage: true, canViewSyncStatus: true, canSync: true, questions: [question] };
let status: string;
let reviewed: boolean;
let awardedPoints: number;
let linked: boolean;
beforeEach(() => {
  vi.resetAllMocks(); status = "submitted"; reviewed = false; awardedPoints = 0; linked = true;
  vi.mocked(apiGet).mockImplementation(async path => {
    if (path.endsWith("/answers")) return { items: [{ answerId: "answer", questionId: "q", selectedOptionIds: ["correct"], awardedPoints, teacherComment: "Keep comment", reviewedAt: reviewed ? "today" : null }] } as never;
    if (path.endsWith("/grade-sync")) return { linked } as never;
    return { submission: { id: "s", status, reviewNote: "Keep note" } } as never;
  });
  vi.mocked(apiPut).mockImplementation(async () => { reviewed = true; awardedPoints = 2; return { items: [] } as never; });
  vi.mocked(apiPatch).mockImplementation(async () => { status = "reviewed"; return { submission: { id: "s", status } } as never; });
  vi.mocked(apiPost).mockResolvedValue({ submissionSync: { synced: true } });
});

describe("homework correction API execution", () => {
  it("saves scores for review first and finalizes later without rewriting them", async () => {
    const corrected = await executeHomeworkAutomaticCorrection({ ...context, reviewMode: "review_first" }, "s");
    expect(corrected).toMatchObject({ outcome: "review_pending", reviewCompleted: false, gradeSynced: false });
    expect(awardedPoints).toBe(2); expect(status).toBe("submitted");
    expect(apiPatch).not.toHaveBeenCalled(); expect(apiPost).not.toHaveBeenCalled();

    const finalized = await executeHomeworkAutomaticCorrection({ ...context, reviewMode: "finalize" }, "s", "review");
    expect(finalized).toMatchObject({ outcome: "complete", reviewCompleted: true, gradeSynced: true });
    expect(apiPut).toHaveBeenCalledOnce();
  });
  it("rechecks saved scores before honoring a later finalization request", async () => {
    await executeHomeworkAutomaticCorrection({ ...context, reviewMode: "review_first" }, "s");
    awardedPoints = 0;
    const finalized = await executeHomeworkAutomaticCorrection({ ...context, reviewMode: "finalize" }, "s", "review");
    expect(finalized).toMatchObject({ outcome: "manual_pending", reviewCompleted: false, gradeSynced: false });
    expect(apiPatch).not.toHaveBeenCalled(); expect(apiPost).not.toHaveBeenCalled();
  });
  it("writes objective scores, preserves feedback and note, finishes review and syncs", async () => {
    const outcome = await executeHomeworkAutomaticCorrection(context, "s");
    expect(outcome).toMatchObject({ outcome: "complete", reviewCompleted: true, gradeSynced: true });
    expect(apiPut).toHaveBeenCalledWith("/homework/assignments/hw/submissions/s/answers/review", { answers: [{ answerId: "answer", awardedPoints: 2, teacherComment: "Keep comment" }] });
    expect(apiPatch).toHaveBeenCalledWith("/homework/assignments/hw/submissions/s/review", { reviewNote: "Keep note" });
  });
  it.each(["unlinked", "permission", "ungraded", "locked"])("retains completed review when sync is %s", async reason => {
    linked = reason !== "unlinked";
    if (reason === "locked") vi.mocked(apiGet).mockImplementation(async path => {
      if (path.endsWith("/grade-sync")) return { linked: true, gradeAssessment: { isLocked: true } } as never;
      if (path.endsWith("/answers")) return { items: [{ answerId: "answer", questionId: "q", selectedOptionIds: ["correct"], awardedPoints: 2, reviewedAt: "today" }] } as never;
      return { submission: { id: "s", status } } as never;
    });
    const outcome = await executeHomeworkAutomaticCorrection({ ...context, canSync: reason !== "permission", isGraded: reason !== "ungraded" }, "s");
    expect(outcome.reviewCompleted).toBe(true);
    expect(outcome.gradeSynced).toBe(false);
    expect(outcome.syncUnavailableReason).toBe(reason);
    expect(apiPost).not.toHaveBeenCalled();
  });
  it("retries sync after finalization without rewriting or re-reviewing", async () => {
    vi.mocked(apiPost).mockRejectedValueOnce(new Error("sync offline"));
    const failed = await executeHomeworkAutomaticCorrection(context, "s");
    expect(failed).toMatchObject({ outcome: "failed", failedStage: "sync", reviewCompleted: true });
    vi.mocked(apiPut).mockClear(); vi.mocked(apiPatch).mockClear();
    expect(await executeHomeworkAutomaticCorrection(context, "s", failed.failedStage)).toMatchObject({ gradeSynced: true });
    expect(apiPut).not.toHaveBeenCalled(); expect(apiPatch).not.toHaveBeenCalled();
  });
  it("requires server-reviewed scores before finalizing", async () => {
    vi.mocked(apiPut).mockResolvedValue({ items: [] });
    expect(await executeHomeworkAutomaticCorrection(context, "s")).toMatchObject({ outcome: "manual_pending", reviewCompleted: false });
    expect(apiPatch).not.toHaveBeenCalled(); expect(apiPost).not.toHaveBeenCalled();
  });
  it("does not finalize after a partially applied chunk", async () => {
    const manyQuestions = Array.from({ length: 101 }, (_, index) => ({ ...question, id: `q${index}`, points: 1 }));
    vi.mocked(apiGet).mockImplementation(async path => path.endsWith("/answers")
      ? { items: manyQuestions.map(question => ({ answerId: `answer-${question.id}`, questionId: question.id, selectedOptionIds: ["correct"] })) } as never
      : { submission: { id: "s", status: "submitted" } } as never);
    vi.mocked(apiPut).mockResolvedValueOnce({ items: [] }).mockRejectedValueOnce(new Error("partial write"));
    expect(await executeHomeworkAutomaticCorrection({ ...context, totalMarks: 101, questions: manyQuestions }, "s")).toMatchObject({ outcome: "failed", failedStage: "answers" });
    expect(vi.mocked(apiPut).mock.calls.map(call => (call[1] as { answers: unknown[] }).answers.length)).toEqual([100, 1]);
    expect(apiPatch).not.toHaveBeenCalled(); expect(apiPost).not.toHaveBeenCalled();
  });
  it.each(["draft", "reviewed"])("skips a %s submission", async nextStatus => {
    status = nextStatus;
    expect(await executeHomeworkAutomaticCorrection(context, "s")).toMatchObject({ outcome: "skipped" });
    expect(apiPut).not.toHaveBeenCalled(); expect(apiPost).not.toHaveBeenCalled();
  });
  it("does not claim synchronization when the server reports failure", async () => {
    vi.mocked(apiPost).mockResolvedValue({ submissionSync: { synced: false } });
    expect(await executeHomeworkAutomaticCorrection(context, "s")).toMatchObject({ outcome: "failed", failedStage: "sync", reviewCompleted: true, gradeSynced: false });
  });
  it("leaves a missing optional answer pending after correcting other questions", async () => {
    const outcome = await executeHomeworkAutomaticCorrection({ ...context, questions: [question, { ...question, id: "optional", isRequired: false }] }, "s");
    expect(outcome).toMatchObject({ outcome: "manual_pending", reviewCompleted: false });
    expect(outcome.plan?.unresolved).toEqual([{ questionId: "optional", reason: "missing_answer_record" }]);
    expect(apiPatch).not.toHaveBeenCalled(); expect(apiPost).not.toHaveBeenCalled();
  });
});
