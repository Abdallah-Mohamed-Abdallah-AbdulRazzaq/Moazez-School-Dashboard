import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { AssessmentQuestion } from "../../../shared/types";
import SubmissionQuestionAnswerField from "../SubmissionQuestionAnswerField";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

const matchingQuestion: AssessmentQuestion = {
  id: "question-1",
  assessmentId: "assessment-1",
  assignmentId: "",
  questionTextAr: "طابق العواصم",
  questionTextEn: "Match the capitals",
  questionType: "MATCHING",
  points: 2,
  order: 1,
  matchingPairs: [
    { id: "pair-1", promptAr: "مصر", promptEn: "Egypt", matchAr: "القاهرة", matchEn: "Cairo", order: 1 },
    { id: "pair-2", promptAr: "فرنسا", promptEn: "France", matchAr: "باريس", matchEn: "Paris", order: 2 },
  ],
  createdAt: "",
};

const choiceQuestion: AssessmentQuestion = {
  id: "question-2",
  assessmentId: "assessment-1",
  assignmentId: "",
  questionTextAr: "اختر الإجابة",
  questionTextEn: "Choose the answer",
  questionType: "MCQ_SINGLE",
  points: 2,
  order: 2,
  options: [
    { id: "correct", textAr: "صحيح", textEn: "Correct", isCorrect: true, order: 1 },
    { id: "wrong", textAr: "خطأ", textEn: "Wrong", isCorrect: false, order: 2 },
  ],
  createdAt: "",
};

describe("SubmissionQuestionAnswerField", () => {
  it("keeps used matching choices selectable so completed answers can be changed", async () => {
    const user = userEvent.setup();
    const onMatchingAnswerChange = vi.fn();

    render(
      <SubmissionQuestionAnswerField
        question={{
          id: "question-1",
          type: "matching",
          prompt: "Match the capitals",
          promptAr: "طابق العواصم",
          points: 2,
          sortOrder: 1,
          required: true,
          answer: null,
        }}
        definition={matchingQuestion}
        draft={{
          answerText: "",
          selectedOptionIds: [],
          matchingAnswers: { "pair-1": "pair-1", "pair-2": "pair-2" },
        }}
        canEnter
        answerCorrectness={null}
        onAnswerTextChange={vi.fn()}
        onSelectedOptionIdsChange={vi.fn()}
        onMatchingAnswerChange={onMatchingAnswerChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "matchingAnswer: Egypt" }));
    await user.click(screen.getByRole("button", { name: "Paris" }));

    expect(onMatchingAnswerChange).toHaveBeenCalledWith("pair-1", "pair-2");
  });

  it.each([
    ["correct", true, "correct", "Correct", "border-[var(--success-border)]"],
    ["incorrect", false, "wrong", "Wrong", "border-[var(--error-border)]"],
  ] as const)("highlights a submitted %s choice without revealing other options", (
    _scenario,
    answerCorrectness,
    selectedOptionId,
    selectedLabel,
    expectedClass,
  ) => {
    render(
      <SubmissionQuestionAnswerField
        question={{
          id: "question-2",
          type: "mcq_single",
          prompt: "Choose the answer",
          promptAr: "اختر الإجابة",
          points: 2,
          sortOrder: 2,
          required: true,
          answer: {
            id: "answer-1",
            questionId: "question-2",
            type: "mcq_single",
            answerText: null,
            answerJson: null,
            awardedPoints: null,
            maxPoints: 2,
            correctionStatus: "pending",
            reviewerComment: null,
            reviewerCommentAr: null,
            reviewedAt: null,
            selectedOptions: [{
              optionId: selectedOptionId,
              label: selectedLabel,
              labelAr: null,
              value: null,
            }],
            createdAt: "",
            updatedAt: "",
          },
        }}
        definition={choiceQuestion}
        draft={{ answerText: "", selectedOptionIds: [selectedOptionId], matchingAnswers: {} }}
        canEnter={false}
        answerCorrectness={answerCorrectness}
        onAnswerTextChange={vi.fn()}
        onSelectedOptionIdsChange={vi.fn()}
        onMatchingAnswerChange={vi.fn()}
      />,
    );

    expect(screen.getByText(selectedLabel)).toHaveClass(expectedClass);
    if (!answerCorrectness) expect(screen.queryByText("Correct")).not.toBeInTheDocument();
  });
});
