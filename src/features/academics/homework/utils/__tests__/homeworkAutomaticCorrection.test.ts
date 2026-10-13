import { describe, expect, it } from "vitest";
import type { AssignmentQuestion } from "@/features/academics/curriculum/services/curriculumService";
import type { HomeworkSubmissionAnswerUiModel } from "../../services/homeworkApi.types";
import { buildHomeworkAutomaticCorrectionPlan, isHomeworkCorrectionComplete } from "../homeworkAutomaticCorrection";

const question: AssignmentQuestion = {
  id: "q1", assignmentId: "hw1", questionTextAr: "سؤال", questionTextEn: "Question",
  questionType: "MCQ_SINGLE", points: 2, isRequired: true, order: 0, createdAt: "2026-10-13",
  options: [
    { id: "a", textAr: "أ", textEn: "A", order: 0, isCorrect: true },
    { id: "b", textAr: "ب", textEn: "B", order: 1, isCorrect: false },
  ],
};
const answer: HomeworkSubmissionAnswerUiModel = {
  id: "answer1", questionId: "q1", prompt: "Question", answerText: "",
  selectedOptionIds: ["a"], feedback: "Keep this comment",
};

describe("homework objective correction", () => {
  it.each([
    [["a"], 2], [["b"], 0], [[], 0], [["a", "b"], 0],
  ])("awards full or zero points for selection %j", (selectedOptionIds, score) => {
    expect(buildHomeworkAutomaticCorrectionPlan([question], [{ ...answer, selectedOptionIds }]).reviews)
      .toEqual([{ answerId: "answer1", questionId: "q1", score }]);
  });
  it("keeps an absent optional answer unresolved", () => {
    expect(buildHomeworkAutomaticCorrectionPlan([{ ...question, isRequired: false }], []).unresolved)
      .toEqual([{ questionId: "q1", reason: "missing_answer_record" }]);
    expect(isHomeworkCorrectionComplete([{ ...question, isRequired: false }], [])).toBe(false);
  });
  it.each([["a", "b"], ["b", "a"]])("ignores multiple-choice selection order %j", (...selectedOptionIds) => {
    const multi = { ...question, questionType: "MCQ_MULTI" as const, options: question.options!.map(option => ({ ...option, isCorrect: true })) };
    expect(buildHomeworkAutomaticCorrectionPlan([multi], [{ ...answer, selectedOptionIds }]).reviews[0].score).toBe(2);
  });
  it.each(["duplicate selection", "unknown selection", "duplicate records", "invalid points", "invalid key"])("does not guess scores for %s", scenario => {
    const questions = [{ ...question, points: scenario === "invalid points" ? NaN : 2,
      options: scenario === "invalid key" ? [] : question.options }];
    const answers = scenario === "duplicate records" ? [answer, { ...answer, id: "other" }] : [{ ...answer,
      selectedOptionIds: scenario === "duplicate selection" ? ["a", "a"] : scenario === "unknown selection" ? ["unknown"] : ["a"] }];
    expect(buildHomeworkAutomaticCorrectionPlan(questions, answers).unresolved[0].reason).toBe("invalid_definition");
    expect(isHomeworkCorrectionComplete(questions, answers)).toBe(false);
  });
  it.each([true, false])("grades true/false from validated option keys (%s)", correctAnswer => {
    const booleanQuestion = { ...question, questionType: "TRUE_FALSE" as const, correctAnswer,
      options: question.options!.map((option, index) => ({ ...option, textEn: index === 0 ? "True" : "False", textAr: "", isCorrect: index === 0 ? correctAnswer : !correctAnswer })) };
    expect(buildHomeworkAutomaticCorrectionPlan([booleanQuestion], [answer]).reviews[0].score).toBe(correctAnswer ? 2 : 0);
    const conflicting = { ...booleanQuestion, correctAnswer: !correctAnswer };
    expect(buildHomeworkAutomaticCorrectionPlan([conflicting], [answer]).unresolved[0].reason).toBe("invalid_definition");
  });
  it("recalculates objective scores and preserves reviewed manual work without mutating comments", () => {
    const manual = { ...question, id: "manual", questionType: "ESSAY" as const };
    const answers = [{ ...answer, score: 0, reviewedAt: "yesterday" }, { ...answer, id: "manualAnswer", questionId: "manual", score: 1, reviewedAt: "yesterday" }];
    const before = structuredClone(answers);
    expect(buildHomeworkAutomaticCorrectionPlan([question, manual], answers).reviews[0].score).toBe(2);
    expect(isHomeworkCorrectionComplete([question, manual], answers)).toBe(false);
    expect(isHomeworkCorrectionComplete([question, manual], [{ ...answers[0], score: 2 }, answers[1]])).toBe(true);
    expect(answers).toEqual(before);
    expect(buildHomeworkAutomaticCorrectionPlan([manual], [{ ...answers[1], reviewedAt: null }]).unresolved[0].reason).toBe("manual_question");
  });
});
