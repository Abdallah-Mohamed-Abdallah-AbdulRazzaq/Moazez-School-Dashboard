import { describe, expect, it } from "vitest";
import {
  getHomeworkApiValidationErrors,
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

  it("maps backend assignment validation details to their form fields", () => {
    expect(
      getHomeworkApiValidationErrors(
        {
          response: {
            data: {
              error: {
                code: "homework.assignment.validation_failed",
                details: {
                  field: "totalMarks",
                  reason: "required_when_graded",
                },
              },
            },
          },
        },
        (key) => key,
      ),
    ).toEqual({ maxScore: "assignmentMarksRequired" });
  });

  it("maps due-date validation reasons to the due-date field", () => {
    expect(
      getHomeworkApiValidationErrors(
        {
          code: "homework.assignment.due_date_invalid",
          details: { field: "dueAt", reason: "must_be_in_future" },
        },
        (key) => key,
      ),
    ).toEqual({ dueDate: "assignmentDueAtFuture" });
  });

  it.each([
    ["homework.question.invalid_type_payload", undefined, "questionInvalidTypePayload"],
    ["homework.question.invalid_options", undefined, "questionInvalidOptions"],
    ["homework.question.invalid_reorder", undefined, "questionInvalidReorder"],
    ["homework.question.read_only", undefined, "questionReadOnly"],
    ["homework.assignment.invalid_question_structure", undefined, "invalidQuestionStructure"],
    ["homework.question.not_found", undefined, "questionNotFound"],
    ["homework.question.option_not_found", undefined, "questionOptionNotFound"],
    ["homework.attachment.file_not_found", undefined, "attachmentFileNotFound"],
    ["homework.submission.not_reviewable", undefined, "submissionNotReviewable"],
    ["homework.answer.invalid_option", undefined, "answerInvalidOption"],
    ["homework.answer_review.exceeds_question_points", undefined, "answerReviewExceedsQuestionPoints"],
    ["homework.grade_sync.assessment_locked", undefined, "gradeSyncAssessmentLocked"],
    ["not_found", { assessmentId: "assessment-1" }, "gradeSyncInvalidAssessment"],
  ])("maps %s to %s", (code, details, key) => {
    expect(mapHomeworkApiError({ code, details })).toBe(key);
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
