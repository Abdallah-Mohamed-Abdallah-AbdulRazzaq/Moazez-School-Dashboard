import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AssessmentQuestion } from "../../../shared/types";
import type { GradeSubmissionAnswer, GradeSubmissionDetail } from "../../types";

const api = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPut: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
}));

vi.mock("@/lib/api", () => api);

import { runAutomaticCorrectionBatch } from "../automaticCorrectionBatch";

const questionId = "123e4567-e89b-42d3-a456-426614174010";
const answerId = "123e4567-e89b-42d3-a456-426614174011";
const submissionIds = [
  "123e4567-e89b-42d3-a456-426614174001",
  "123e4567-e89b-42d3-a456-426614174002",
  "123e4567-e89b-42d3-a456-426614174003",
  "123e4567-e89b-42d3-a456-426614174004",
];

function answer(overrides: Partial<GradeSubmissionAnswer> = {}): GradeSubmissionAnswer {
  return {
    id: answerId,
    questionId,
    type: "mcq_single",
    answerText: null,
    answerJson: null,
    awardedPoints: null,
    maxPoints: 4,
    correctionStatus: "pending",
    reviewerComment: null,
    reviewerCommentAr: null,
    reviewedAt: null,
    selectedOptions: [{ optionId: "correct", label: "Correct", labelAr: null, value: null }],
    createdAt: "",
    updatedAt: "",
    ...overrides,
  };
}

function submission(
  submissionId: string,
  questionType = "mcq_single",
  submissionAnswer: GradeSubmissionAnswer | null = answer(),
): GradeSubmissionDetail {
  return {
    id: submissionId,
    termId: "term-1",
    assessmentId: "assessment-1",
    studentId: "student-1",
    enrollmentId: "enrollment-1",
    status: "submitted",
    startedAt: "",
    submittedAt: "",
    correctedAt: null,
    totalScore: null,
    maxScore: 4,
    assessment: null,
    student: null,
    enrollment: null,
    progress: {
      totalQuestions: 1,
      answeredCount: submissionAnswer ? 1 : 0,
      requiredAnsweredCount: submissionAnswer ? 1 : 0,
      requiredQuestionCount: 1,
      pendingCorrectionCount: 1,
    },
    answers: submissionAnswer ? [submissionAnswer] : [],
    questions: [{
      id: questionId,
      type: questionType,
      prompt: "Question",
      promptAr: "سؤال",
      points: 4,
      sortOrder: 1,
      required: true,
      answer: submissionAnswer,
    }],
  };
}

function definition(questionType: AssessmentQuestion["questionType"]): AssessmentQuestion {
  return {
    id: questionId,
    assessmentId: "assessment-1",
    assignmentId: "",
    questionTextAr: "سؤال",
    questionTextEn: "Question",
    questionType,
    points: 4,
    order: 1,
    createdAt: "",
    options: questionType === "MCQ_SINGLE"
      ? [{ id: "correct", textAr: "صحيح", textEn: "Correct", isCorrect: true, order: 1 }]
      : undefined,
  };
}

function submissionIdFromUrl(url: string): string {
  return url.split("/").at(-1) ?? "";
}

beforeEach(() => {
  vi.clearAllMocks();
  api.apiPut.mockResolvedValue({});
  api.apiPost.mockResolvedValue({});
});

describe("runAutomaticCorrectionBatch", () => {
  it("limits concurrency, preserves order, continues after failure, and reports progress", async () => {
    let activeRequests = 0;
    let maximumConcurrency = 0;
    api.apiGet.mockImplementation(async (url: string) => {
      const submissionId = submissionIdFromUrl(url);
      activeRequests += 1;
      maximumConcurrency = Math.max(maximumConcurrency, activeRequests);
      await new Promise((resolve) => setTimeout(resolve, submissionId.endsWith("1") ? 15 : 5));
      activeRequests -= 1;
      if (submissionId === submissionIds[2]) throw new Error("Unavailable");
      if (submissionId === submissionIds[1]) return submission(submissionId, "mcq_single", null);
      if (submissionId === submissionIds[3]) {
        return submission(submissionId, "mcq_single", answer({ awardedPoints: 2 }));
      }
      return submission(submissionId);
    });
    const progress = vi.fn();

    const batch = await runAutomaticCorrectionBatch({
      submissionIds,
      definitionsByQuestionId: { [questionId]: definition("MCQ_SINGLE") },
      concurrency: 2,
      onProgress: progress,
    });

    expect(maximumConcurrency).toBe(2);
    expect(batch.results.map(({ submissionId }) => submissionId)).toEqual(submissionIds);
    expect(batch.results.map(({ status }) => status)).toEqual([
      "corrected",
      "manual_only",
      "failed",
      "corrected",
    ]);
    expect(api.apiPut).toHaveBeenCalledTimes(2);
    expect(api.apiPost).toHaveBeenCalledTimes(2);
    expect(api.apiPost).toHaveBeenCalledWith(
      `/grades/submissions/${submissionIds[0]}/review/finalize`,
    );
    expect(api.apiPost).toHaveBeenCalledWith(
      `/grades/submissions/${submissionIds[3]}/review/finalize`,
    );
    expect(api.apiPost).not.toHaveBeenCalledWith(
      `/grades/submissions/${submissionIds[1]}/review/finalize`,
    );
    expect(batch.failedSubmissionIds).toEqual([submissionIds[2]]);
    expect(batch.totals).toMatchObject({
      correctedCount: 2,
      missingAnswerCount: 1,
      studentsProcessed: 4,
      studentsFailed: 1,
      studentsFinalized: 2,
    });
    expect(progress).toHaveBeenCalledTimes(4);
    expect(progress).toHaveBeenLastCalledWith(expect.objectContaining({
      processed: 4,
      total: 4,
    }));
  });

  it("retries only the failed submission IDs supplied by the caller", async () => {
    api.apiGet.mockImplementation((url: string) =>
      Promise.resolve(submission(submissionIdFromUrl(url))));

    await runAutomaticCorrectionBatch({
      submissionIds: [submissionIds[2]],
      definitionsByQuestionId: { [questionId]: definition("MCQ_SINGLE") },
    });

    expect(api.apiGet).toHaveBeenCalledTimes(1);
    expect(api.apiGet).toHaveBeenCalledWith(`/grades/submissions/${submissionIds[2]}`);
    expect(api.apiPut).toHaveBeenCalledTimes(1);
    expect(api.apiPost).toHaveBeenCalledWith(
      `/grades/submissions/${submissionIds[2]}/review/finalize`,
    );
  });

  it("keeps saved scores retryable when finalization fails and continues the batch", async () => {
    const ids = submissionIds.slice(0, 2);
    api.apiGet.mockImplementation((url: string) =>
      Promise.resolve(submission(submissionIdFromUrl(url))));
    api.apiPost.mockImplementation((url: string) => {
      if (url.includes(ids[0])) return Promise.reject(new Error("Finalize failed"));
      return Promise.resolve({});
    });

    const batch = await runAutomaticCorrectionBatch({
      submissionIds: ids,
      definitionsByQuestionId: { [questionId]: definition("MCQ_SINGLE") },
      concurrency: 1,
    });

    expect(api.apiPut).toHaveBeenCalledTimes(2);
    expect(api.apiPost).toHaveBeenCalledTimes(2);
    expect(batch.results.map(({ status }) => status)).toEqual(["failed", "corrected"]);
    expect(batch.failedSubmissionIds).toEqual([ids[0]]);
    expect(batch.totals.studentsFinalized).toBe(1);
  });
});
