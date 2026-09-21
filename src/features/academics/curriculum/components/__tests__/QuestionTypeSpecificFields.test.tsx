import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import QuestionTypeSpecificFields from "../QuestionTypeSpecificFields";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

const mediaQuestionProps = {
  questionId: "question-1",
  questionType: "MEDIA" as const,
  isReadOnly: false,
  correctAnswer: false,
  sampleAnswerAr: "",
  sampleAnswerEn: "",
  acceptedAnswersAr: [],
  acceptedAnswersEn: [],
  matchingPairs: [],
  mediaMode: "LINK" as const,
  mediaTitle: "",
  mediaUrl: "",
  mediaFileName: "",
  mediaMimeType: "",
  setTrueFalseAnswer: vi.fn(),
  setSampleAnswerArValue: vi.fn(),
  setSampleAnswerEnValue: vi.fn(),
  setAcceptedAnswersArValue: vi.fn(),
  setAcceptedAnswersEnValue: vi.fn(),
  addMatchingPair: vi.fn(),
  updateMatchingPair: vi.fn(),
  removeMatchingPair: vi.fn(),
  moveMatchingPairUp: vi.fn(),
  moveMatchingPairDown: vi.fn(),
  setMediaModeValue: vi.fn(),
  setMediaTitleValue: vi.fn(),
  setMediaUrlValue: vi.fn(),
  setMediaFileValue: vi.fn(),
  clearMedia: vi.fn(),
};

describe("QuestionTypeSpecificFields", () => {
  it("requires an external link for a media question", () => {
    render(<QuestionTypeSpecificFields {...mediaQuestionProps} />);

    expect(screen.getByLabelText("media_url")).toBeInTheDocument();
    expect(screen.queryByText("media_mode")).not.toBeInTheDocument();
  });
});
