import { expect, it } from "vitest";
import type { AssignmentQuestion } from "@/features/academics/curriculum/services/curriculumService";
import { fixtureContext } from "@/features/academics/shared/excel-import/__tests__/excelImportFixtures";
import { batchMetadata } from "./homeworkImportBatchFixtures";
import { prepareHomeworkDraftQuestions, validateHomeworkQuestionDraft } from "../homeworkQuestionDraftValidation";
import { mapBuilderQuestionToHomeworkCreatePayload } from "../../services/homeworkMappers";

const question: AssignmentQuestion = {
  id: "local-7", assignmentId: "local-draft", createdAt: "", order: 9,
  questionType: "TRUE_FALSE", points: 2, questionTextAr: "", questionTextEn: "Is 3 even?",
  correctAnswer: false, isRequired: false, options: [],
};

it("retains false answers and optional questions while normalizing local order immutably", () => {
  expect(validateHomeworkQuestionDraft({ metadata: batchMetadata, questions: [question] }, fixtureContext).kind).toBe("valid");
  const prepared = prepareHomeworkDraftQuestions([question]);
  expect(prepared[0]).toMatchObject({ order: 1, correctAnswer: false, isRequired: false });
  expect(question.order).toBe(9);
  expect(mapBuilderQuestionToHomeworkCreatePayload(prepared[0])).toMatchObject({
    isRequired: false, sortOrder: 1,
    options: [{ text: "True", isCorrect: false, sortOrder: 0 }, { text: "False", isCorrect: true, sortOrder: 1 }],
  });
});

it.each([
  [0, "invalid"], [1, "valid"], [500, "valid"], [501, "invalid"],
] as const)("validates a collection of %i questions as %s", (count, kind) => {
  const questions = Array.from({ length: count }, (_, index) => ({ ...question, id: `local-${index}` }));
  expect(validateHomeworkQuestionDraft({ metadata: { ...batchMetadata, isGraded: false }, questions }, fixtureContext).kind).toBe(kind);
});

it.each([
  { points: 0 }, { points: 99999.99 }, { questionTextEn: "a".repeat(8000) },
  { instructions: "a".repeat(4000) },
  { questionType: "SHORT_ANSWER", correctAnswer: undefined, expectedAnswer: "a".repeat(8000) },
] satisfies Partial<AssignmentQuestion>[])("accepts a valid boundary %j", updates => {
  expect(validateHomeworkQuestionDraft({ metadata: batchMetadata, questions: [{ ...question, ...updates }] }, fixtureContext).kind).toBe("valid");
});

it.each([
  { points: -1 }, { points: NaN }, { points: Infinity }, { points: 100000 }, { points: 1.001 },
  { questionTextEn: "" }, { questionTextEn: "a".repeat(8001) }, { instructions: "a".repeat(4001) },
  { correctAnswer: undefined }, { expectedAnswer: "unexpected" }, { questionType: "MEDIA" },
  { questionType: "SHORT_ANSWER", correctAnswer: undefined, expectedAnswer: "a".repeat(8001) },
  { questionType: "ESSAY", correctAnswer: undefined, options: [{ id: "o", order: 1, textAr: "", textEn: "Text", isCorrect: true }] },
] satisfies Partial<AssignmentQuestion>[])("rejects an invalid local question %j", updates => {
  const checked = validateHomeworkQuestionDraft({ metadata: batchMetadata, questions: [{ ...question, ...updates }] }, fixtureContext);
  expect(checked).toMatchObject({ kind: "invalid", issues: expect.arrayContaining([expect.objectContaining({ scope: "question", questionId: question.id })]) });
});

it.each([
  ["MCQ_SINGLE", 2, 0, "invalid"], ["MCQ_SINGLE", 2, 1, "valid"], ["MCQ_SINGLE", 2, 2, "invalid"],
  ["MCQ_MULTI", 2, 0, "invalid"], ["MCQ_MULTI", 2, 1, "valid"], ["MCQ_MULTI", 2, 2, "valid"],
  ["MCQ_SINGLE", 1, 1, "invalid"], ["MCQ_MULTI", 50, 1, "valid"], ["MCQ_MULTI", 51, 1, "invalid"],
] as const)("validates %s with %i choices and %i correct choices as %s", (questionType, count, correct, kind) => {
  const options = Array.from({ length: count }, (_, index) => ({ id: `o-${index}`, order: index + 8, textAr: "", textEn: `Choice ${index}`, isCorrect: index < correct }));
  const draftQuestion = { ...question, questionType, correctAnswer: undefined, options };
  expect(validateHomeworkQuestionDraft({ metadata: batchMetadata, questions: [draftQuestion] }, fixtureContext).kind).toBe(kind);
  expect(prepareHomeworkDraftQuestions([draftQuestion])[0].options?.map(option => option.order)).toEqual(Array.from({ length: count }, (_, index) => index + 1));
  expect(options[0].order).toBe(8);
});

it.each([
  { totalMarks: 100000 }, { totalMarks: 1.001 }, { totalMarks: 0 }, { estimatedMinutes: 2147483648 },
  { estimatedMinutes: 0 }, { estimatedMinutes: 1.5 }, { title: "" }, { title: "a".repeat(181) },
  { description: "a".repeat(4001) }, { mode: "invalid" }, { dueAt: fixtureContext.now.toISOString() },
  { dueAt: "2000-01-01T12:00:00Z" },
])("rejects invalid metadata %j", updates => {
  expect(validateHomeworkQuestionDraft({ metadata: { ...batchMetadata, ...updates }, questions: [question] }, fixtureContext).kind).toBe("invalid");
});

it("warns about marks without rejecting questions and rejects due dates before publication", () => {
  expect(validateHomeworkQuestionDraft({ metadata: { ...batchMetadata, totalMarks: 10 }, questions: [question] }, fixtureContext)).toMatchObject({ kind: "valid", warnings: [expect.objectContaining({ values: { total: 2, maximum: 10 } })] });
  expect(validateHomeworkQuestionDraft({ metadata: batchMetadata, questions: [question] }, { ...fixtureContext, publishAt: "2099-01-03T12:00:00Z" }).kind).toBe("invalid");
});
