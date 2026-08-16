import { describe, expect, it } from "vitest";
import {
  getHomeworkErrorMessage,
  mapHomeworkApiError,
} from "@/features/academics/homework/services/homeworkErrors";

const messages: Record<string, string> = {
  generic: "Something went wrong.",
  notPublishable: "This homework cannot be published now.",
  invalidQuestionStructureTrueFalse:
    "True/false questions must have exactly two options and one correct answer.",
  invalidQuestionStructureSingleChoice:
    "Single-choice questions need at least two options and exactly one correct answer.",
  invalidQuestionStructureMultipleChoice:
    "Multiple-choice questions need at least two options and at least one correct answer.",
  invalidQuestionStructure:
    "One homework question has an invalid answer setup. Review the question options.",
  gradeSyncAssessmentLocked:
    "The linked grade assessment is locked. Unlock it before syncing homework grades.",
  answerReviewExceedsQuestionPoints:
    "The answer score cannot exceed the question points.",
};

const t = (key: string) => messages[key] ?? key;

describe("homeworkErrors", () => {
  it("maps backend homework error envelopes to UI keys", () => {
    expect(
      mapHomeworkApiError({
        response: {
          data: {
            error: {
              code: "homework.assignment.not_publishable",
            },
          },
        },
      }),
    ).toBe("notPublishable");
  });

  it("falls back for unknown errors", () => {
    expect(mapHomeworkApiError(new Error("Network failed"))).toBe("generic");
  });

  it.each([
    ["homework.question.invalid_type_payload", "questionInvalidTypePayload"],
    ["homework.question.invalid_options", "questionInvalidOptions"],
    ["homework.question.invalid_reorder", "questionInvalidReorder"],
    ["homework.question.read_only", "questionReadOnly"],
    ["homework.assignment.invalid_question_structure", "invalidQuestionStructure"],
    ["homework.question.not_found", "questionNotFound"],
    ["homework.question.option_not_found", "questionOptionNotFound"],
    ["homework.attachment.file_not_found", "attachmentFileNotFound"],
    ["homework.submission.not_reviewable", "submissionNotReviewable"],
    ["homework.answer.invalid_option", "answerInvalidOption"],
    ["homework.answer_review.exceeds_question_points", "answerReviewExceedsQuestionPoints"],
    ["homework.grade_sync.assessment_locked", "gradeSyncAssessmentLocked"],
  ])("maps %s to %s", (code, key) => {
    expect(mapHomeworkApiError({ code })).toBe(key);
  });

  it("explains true false publish validation errors from backend details", () => {
    expect(
      getHomeworkErrorMessage(
        {
          response: {
            data: {
              error: {
                code: "homework.assignment.invalid_question_structure",
                details: {
                  type: "TRUE_FALSE",
                  optionCount: 3,
                  correctCount: 1,
                },
              },
            },
          },
        },
        t,
      ),
    ).toBe(
      "True/false questions must have exactly two options and one correct answer.",
    );
  });

  it.each([
    [
      "SINGLE_CHOICE",
      "Single-choice questions need at least two options and exactly one correct answer.",
    ],
    [
      "MULTIPLE_CHOICE",
      "Multiple-choice questions need at least two options and at least one correct answer.",
    ],
  ])("explains %s question structure errors", (type, expected) => {
    expect(
      getHomeworkErrorMessage(
        {
          code: "homework.assignment.invalid_question_structure",
          details: { type },
        },
        t,
      ),
    ).toBe(expected);
  });

  it("returns a translated generic message for unknown errors", () => {
    expect(getHomeworkErrorMessage(new Error("Network failed"), t)).toBe(
      "Something went wrong.",
    );
  });
});
