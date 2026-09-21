import { describe, expect, it } from "vitest";
import type { AssessmentQuestion } from "../../../shared/types";
import {
  changeMatchingAnswer,
  createSubmissionAnswerDraft,
  createSubmissionAnswerPayload,
} from "../submissionAnswerPayload";

const matchingQuestion: AssessmentQuestion = {
  id: "question-1",
  assessmentId: "assessment-1",
  assignmentId: "",
  questionTextAr: "طابق العواصم",
  questionTextEn: "Match the capitals",
  questionType: "MATCHING",
  points: 4,
  order: 1,
  matchingPairs: [
    { id: "pair-1", promptAr: "مصر", promptEn: "Egypt", matchAr: "القاهرة", matchEn: "Cairo", order: 1 },
    { id: "pair-2", promptAr: "فرنسا", promptEn: "France", matchAr: "باريس", matchEn: "Paris", order: 2 },
  ],
  createdAt: "",
};

describe("submission answer payloads", () => {
  it("serializes matching selections as the answerJson required by the backend", () => {
    const draft = {
      ...createSubmissionAnswerDraft(null, matchingQuestion),
      matchingAnswers: { "pair-1": "pair-2", "pair-2": "pair-1" },
    };

    expect(createSubmissionAnswerPayload("matching", matchingQuestion, draft)).toEqual({
      answerText: null,
      answerJson: { "pair-1": "Paris", "pair-2": "Cairo" },
      selectedOptionIds: null,
    });
  });

  it("swaps completed matching selections so every row remains editable", () => {
    expect(changeMatchingAnswer(
      { "pair-1": "pair-1", "pair-2": "pair-2" },
      "pair-1",
      "pair-2",
    )).toEqual({
      "pair-1": "pair-2",
      "pair-2": "pair-1",
    });
  });

  it("moves a used selection when the current row was empty", () => {
    expect(changeMatchingAnswer(
      { "pair-1": "pair-1" },
      "pair-2",
      "pair-1",
    )).toEqual({
      "pair-2": "pair-1",
    });
  });
});
