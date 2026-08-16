import { beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import type {
  BackendSubmissionDetailResponse,
  BackendSubmissionAnswerResponse,
  BackendSubmissionStatus,
} from "../../../gradebook/types/api.types";

const apiMocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  apiPatch: vi.fn(),
}));

vi.mock("@/lib/api", () => apiMocks);

import {
  fetchGradeSubmission,
  finalizeSubmissionReview,
  listAssessmentSubmissions,
  reviewSubmissionAnswer,
  reviewSubmissionAnswers,
  saveSubmissionAnswer,
  saveSubmissionAnswers,
  submitGradeSubmission,
  syncSubmissionGradeItem,
} from "../gradesSubmissionsService";
import { GradesSubmissionValidationError } from "../../utils/submissionContract";

const ASSESSMENT_ID = "123e4567-e89b-42d3-a456-426614174001";
const SUBMISSION_ID = "123e4567-e89b-42d3-a456-426614174002";
const QUESTION_ID = "123e4567-e89b-42d3-a456-426614174003";
const ANSWER_ID = "123e4567-e89b-42d3-a456-426614174004";
const OPTION_ID = "123e4567-e89b-42d3-a456-426614174005";
const CLASSROOM_ID = "123e4567-e89b-42d3-a456-426614174006";

describe("grades submission endpoint contracts", () => {
  beforeEach(() => {
    Object.values(apiMocks).forEach((mock) => mock.mockReset().mockResolvedValue({}));
  });

  it("models lowercase and nullable submission response fields", () => {
    expectTypeOf<BackendSubmissionStatus>().toEqualTypeOf<
      "in_progress" | "submitted" | "corrected"
    >();
    expectTypeOf<BackendSubmissionDetailResponse["maxScore"]>().toEqualTypeOf<
      number | null
    >();
    expectTypeOf<BackendSubmissionDetailResponse["assessment"]>().toMatchTypeOf<
      { id: string; maxScore: number | null } | null
    >();
    expectTypeOf<BackendSubmissionDetailResponse["questions"][number]>().toMatchTypeOf<{
      id: string;
      answer: unknown;
    }>();
    expectTypeOf<BackendSubmissionAnswerResponse["type"]>().toEqualTypeOf<string>();
    expectTypeOf<BackendSubmissionAnswerResponse["selectedOptions"]>().toEqualTypeOf<
      Array<{ optionId: string; label: string; labelAr: string | null; value: string | null }>
    >();
  });

  it("lists assessment submissions with supported filters", async () => {
    apiMocks.apiGet.mockResolvedValueOnce({ items: [] });

    await listAssessmentSubmissions(ASSESSMENT_ID, {
      status: "submitted",
      classroomId: CLASSROOM_ID,
      search: "Sara",
    });

    expect(apiMocks.apiGet).toHaveBeenCalledWith(
      `/grades/assessments/${ASSESSMENT_ID}/submissions`,
      { params: { status: "submitted", classroomId: CLASSROOM_ID, search: "Sara" } },
    );
  });

  it("fetches submission detail and saves single and bulk answers", async () => {
    apiMocks.apiGet.mockResolvedValueOnce({ id: "submission-1" });

    await fetchGradeSubmission(SUBMISSION_ID);
    await saveSubmissionAnswer(SUBMISSION_ID, QUESTION_ID, {
      answerText: "Answer",
      selectedOptionIds: [OPTION_ID],
    });
    await saveSubmissionAnswers(SUBMISSION_ID, [
      { questionId: QUESTION_ID, answerText: "Answer" },
    ]);

    expect(apiMocks.apiGet).toHaveBeenCalledWith(`/grades/submissions/${SUBMISSION_ID}`);
    expect(apiMocks.apiPut).toHaveBeenNthCalledWith(
      1,
      `/grades/submissions/${SUBMISSION_ID}/answers/${QUESTION_ID}`,
      { answerText: "Answer", selectedOptionIds: [OPTION_ID] },
    );
    expect(apiMocks.apiPut).toHaveBeenNthCalledWith(
      2,
      `/grades/submissions/${SUBMISSION_ID}/answers`,
      { answers: [{ questionId: QUESTION_ID, answerText: "Answer" }] },
    );
  });

  it("submits, reviews, finalizes, and syncs a submission", async () => {
    await submitGradeSubmission(SUBMISSION_ID);
    await reviewSubmissionAnswer(SUBMISSION_ID, ANSWER_ID, {
      awardedPoints: 4,
      reviewerComment: "Correct",
      reviewerCommentAr: null,
    });
    await finalizeSubmissionReview(SUBMISSION_ID);
    await syncSubmissionGradeItem(SUBMISSION_ID);

    expect(apiMocks.apiPost).toHaveBeenNthCalledWith(
      1,
      `/grades/submissions/${SUBMISSION_ID}/submit`,
    );
    expect(apiMocks.apiPatch).toHaveBeenCalledWith(
      `/grades/submissions/${SUBMISSION_ID}/answers/${ANSWER_ID}/review`,
      { awardedPoints: 4, reviewerComment: "Correct", reviewerCommentAr: null },
    );
    expect(apiMocks.apiPost).toHaveBeenNthCalledWith(
      2,
      `/grades/submissions/${SUBMISSION_ID}/review/finalize`,
    );
    expect(apiMocks.apiPost).toHaveBeenNthCalledWith(
      3,
      `/grades/submissions/${SUBMISSION_ID}/sync-grade-item`,
    );
  });

  it.each([
    ["route UUID", () => fetchGradeSubmission("not-a-uuid")],
    ["option UUID", () => saveSubmissionAnswer(SUBMISSION_ID, QUESTION_ID, { selectedOptionIds: ["bad"] })],
    ["bulk answers", () => saveSubmissionAnswers(SUBMISSION_ID, [])],
    ["single review", () => reviewSubmissionAnswer(SUBMISSION_ID, ANSWER_ID, { awardedPoints: -1 })],
    ["bulk reviews", () => reviewSubmissionAnswers(SUBMISSION_ID, [])],
  ])("rejects invalid %s before making an HTTP request", async (_name, request) => {
    await expect(request()).rejects.toBeInstanceOf(GradesSubmissionValidationError);
    expect(apiMocks.apiGet).not.toHaveBeenCalled();
    expect(apiMocks.apiPut).not.toHaveBeenCalled();
    expect(apiMocks.apiPatch).not.toHaveBeenCalled();
    expect(apiMocks.apiPost).not.toHaveBeenCalled();
  });
});
