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
        onAnswerTextChange={vi.fn()}
        onSelectedOptionIdsChange={vi.fn()}
        onMatchingAnswerChange={onMatchingAnswerChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "matchingAnswer: Egypt" }));
    await user.click(screen.getByRole("button", { name: "Paris" }));

    expect(onMatchingAnswerChange).toHaveBeenCalledWith("pair-1", "pair-2");
  });
});
