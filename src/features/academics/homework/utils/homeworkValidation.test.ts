import { describe, expect, it } from "vitest";
import {
  validateHomeworkAssignmentContract,
  validateHomeworkQuestion,
} from "./homeworkValidation";

const t = (key: string) => key;

function question(overrides = {}) {
  return {
    id: "question-1", assignmentId: "homework-1", questionTextAr: "Question",
    questionTextEn: "Question", questionType: "SHORT_ANSWER" as const,
    points: 1, order: 0, createdAt: "", ...overrides,
  };
}

describe("validateHomeworkQuestion", () => {
  it("accepts either localized prompt", () => {
    expect(validateHomeworkQuestion(question({ questionTextEn: "" }), t)).toEqual({});
  });

  it("accepts the builder boolean for true false", () => {
    expect(validateHomeworkQuestion(question({
      questionType: "TRUE_FALSE",
      correctAnswer: false,
    }), t)).toEqual({});
  });

  it("enforces backend question DTO boundaries", () => {
    expect(validateHomeworkQuestion(question({ questionTextEn: "x".repeat(8001) }), t))
      .toEqual(expect.objectContaining({ textEn: "questionTextTooLong" }));
    expect(validateHomeworkQuestion(question({ points: Number.NaN }), t))
      .toEqual(expect.objectContaining({ points: "invalid_points" }));
  });

  it("enforces backend option DTO boundaries", () => {
    const options = Array.from({ length: 51 }, (_, index) => ({
      id: `option-${index}`, textAr: "Option", textEn: "Option",
      isCorrect: index === 0, order: index,
    }));
    expect(validateHomeworkQuestion(question({ questionType: "MCQ_SINGLE", options }), t))
      .toEqual(expect.objectContaining({ options: "tooManyOptions" }));
    expect(validateHomeworkQuestion(question({ questionType: "MCQ_SINGLE", options: [
      { ...options[0], textEn: "x".repeat(1001) }, options[1],
    ] }), t)).toEqual(expect.objectContaining({ options: "optionTextTooLong" }));
  });

  it("forbids options on text questions", () => {
    expect(validateHomeworkQuestion(question({ options: [
      { id: "one", textAr: "Option", textEn: "Option", isCorrect: false, order: 0 },
    ] }), t)).toEqual(expect.objectContaining({ options: "textQuestionOptionsForbidden" }));
  });

  it("enforces backend instructions and expected answer limits", () => {
    expect(validateHomeworkQuestion(question({ instructions: "x".repeat(4001) }), t))
      .toEqual(expect.objectContaining({ instructions: "instructionsTooLong" }));
    expect(validateHomeworkQuestion(question({ expectedAnswer: "x".repeat(8001) }), t))
      .toEqual(expect.objectContaining({ expectedAnswer: "expectedAnswerTooLong" }));
  });

  it("rejects question types unsupported by homework", () => {
    expect(validateHomeworkQuestion(question({ questionType: "MATCHING" }), t))
      .toEqual(expect.objectContaining({ general: "unsupportedQuestionType" }));
  });
});

describe("validateHomeworkAssignmentContract", () => {
  const now = new Date("2026-08-01T10:00:00.000Z");
  const validInput = {
    title: "Practice",
    description: "Review chapter one",
    dueAt: "2026-08-02T10:00:00.000Z",
    publishAt: null,
    isGraded: true,
    totalMarks: 10,
    estimatedMinutes: 30,
  };

  it.each([
    [{ title: "" }, "titleEn", "assignmentTitleRequired"],
    [{ title: "x".repeat(181) }, "titleEn", "assignmentTitleTooLong"],
    [{ description: "x".repeat(4001) }, "descriptionEn", "assignmentDescriptionTooLong"],
    [{ dueAt: "not-a-date" }, "dueDate", "assignmentDueAtInvalid"],
    [{ publishAt: "not-a-date" }, "dueDate", "assignmentPublishAtInvalid"],
    [{ dueAt: now.toISOString() }, "dueDate", "assignmentDueAtFuture"],
    [{ dueAt: "2026-08-01T09:59:59.000Z" }, "dueDate", "assignmentDueAtFuture"],
    [{ publishAt: "2026-08-03T10:00:00.000Z" }, "dueDate", "assignmentDueAtAfterPublish"],
    [{ totalMarks: null }, "maxScore", "assignmentMarksRequired"],
    [{ totalMarks: 0 }, "maxScore", "assignmentMarksMin"],
    [{ totalMarks: 1.001 }, "maxScore", "assignmentMarksDecimals"],
    [{ totalMarks: Number.POSITIVE_INFINITY }, "maxScore", "assignmentMarksMin"],
    [{ estimatedMinutes: 0 }, "expectedTimeMinutes", "assignmentMinutesMin"],
    [{ estimatedMinutes: 1.5 }, "expectedTimeMinutes", "assignmentMinutesInteger"],
    [{ estimatedMinutes: Number.POSITIVE_INFINITY }, "expectedTimeMinutes", "assignmentMinutesInteger"],
  ])("rejects invalid assignment contract field %#", (overrides, field, errorKey) => {
    expect(validateHomeworkAssignmentContract(
      { ...validInput, ...overrides },
      t,
      now,
    )).toEqual(expect.objectContaining({ [field]: errorKey }));
  });

  it("accepts nullable marks for ungraded homework and nullable duration", () => {
    expect(validateHomeworkAssignmentContract({
      ...validInput,
      isGraded: false,
      totalMarks: null,
      estimatedMinutes: null,
    }, t, now)).toEqual({});
  });

  it("accepts the minimum marks and one minute boundaries", () => {
    expect(validateHomeworkAssignmentContract({
      ...validInput,
      totalMarks: 0.01,
      estimatedMinutes: 1,
    }, t, now)).toEqual({});
  });
});
