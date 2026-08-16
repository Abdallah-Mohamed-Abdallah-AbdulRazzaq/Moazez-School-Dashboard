import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AssessmentQuestion, CreateAssessmentPayload } from "../../types";

vi.mock("@/lib/api", () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  apiPatch: vi.fn(),
  apiDelete: vi.fn(),
}));

import { apiGet, apiPatch, apiPost } from "@/lib/api";
import {
  AssessmentQuestionsCreationError,
  createAssessmentWithQuestions,
  fetchAssessmentQuestions,
  updateAssessmentQuestion,
} from "../gradesAssessmentsService";

const mockedApiGet = vi.mocked(apiGet);
const mockedApiPost = vi.mocked(apiPost);
const mockedApiPatch = vi.mocked(apiPatch);

const assessmentPayload: CreateAssessmentPayload = {
  termId: "term-1",
  subjectId: "subject-1",
  scopeType: "school",
  scopeId: "school-1",
  title: "Assessment",
  titleAr: "اختبار",
  type: "QUIZ",
  deliveryMode: "QUESTION_BASED",
  date: "2026-07-11",
  weight: 10,
  maxScore: 1,
};

const question: AssessmentQuestion = {
  id: "temp-question-1",
  assessmentId: "draft-assessment",
  assignmentId: "draft-assessment",
  questionTextAr: "سؤال",
  questionTextEn: "Question",
  questionType: "SHORT_ANSWER",
  points: 1,
  order: 1,
  createdAt: "",
};

describe("grades assessments contract adapter", () => {
  beforeEach(() => {
    mockedApiGet.mockReset();
    mockedApiPost.mockReset();
    mockedApiPatch.mockReset();
  });

  it("preserves backend question fields", async () => {
    mockedApiGet.mockResolvedValueOnce({
      assessmentId: "assessment-1",
      totalQuestions: 1,
      totalPoints: 1,
      pointsMatchMaxScore: true,
      questions: [{
        id: "question-1",
        assessmentId: "assessment-1",
        promptAr: "سؤال",
        prompt: "Question",
        explanationAr: "شرح",
        explanation: "Explanation",
        required: false,
        type: "short_answer",
        points: 1,
        sortOrder: 1,
        options: [{ id: "option-1", labelAr: "خيار", label: "Option", value: "A" }],
        createdAt: "2026-07-11T00:00:00.000Z",
        updatedAt: "2026-07-12T00:00:00.000Z",
      }],
    });

    const [mappedQuestion] = await fetchAssessmentQuestions("year-1", "term-1", "assessment-1");

    expect(mappedQuestion).toEqual(expect.objectContaining({
      explanationAr: "شرح",
      explanation: "Explanation",
      required: false,
      updatedAt: "2026-07-12T00:00:00.000Z",
    }));
    expect(mappedQuestion.options?.[0]).toEqual(expect.objectContaining({ value: "A" }));
  });

  it("exposes the created assessment id when question creation fails", async () => {
    mockedApiPost
      .mockResolvedValueOnce({ id: "assessment-1" })
      .mockRejectedValueOnce(new Error("question rejected"));

    await expect(createAssessmentWithQuestions("year-1", {
      assessment: assessmentPayload,
      questions: [question],
    })).rejects.toEqual(expect.objectContaining<Partial<AssessmentQuestionsCreationError>>({
      assessmentId: "assessment-1",
      failedQuestionIndex: 0,
    }));
  });

  it("round-trips backend-supported question fields on update", async () => {
    mockedApiPatch.mockResolvedValueOnce({
      id: "question-1",
      assessmentId: "assessment-1",
      type: "short_answer",
      points: 1,
    });

    await updateAssessmentQuestion("year-1", "term-1", "question-1", {
      ...question,
      explanationAr: "شرح",
      explanation: "Explanation",
      required: false,
      options: [{
        id: "option-1",
        textAr: "خيار",
        textEn: "Option",
        value: "A",
        isCorrect: false,
        order: 1,
      }],
    });

    expect(mockedApiPatch).toHaveBeenCalledWith(
      "/grades/questions/question-1",
      expect.objectContaining({
        explanationAr: "شرح",
        explanation: "Explanation",
        required: false,
        options: [expect.objectContaining({ value: "A" })],
      }),
    );
  });
});
