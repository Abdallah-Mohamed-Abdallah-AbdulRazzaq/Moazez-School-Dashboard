import { act, renderHook } from "@testing-library/react";
import { expect, it } from "vitest";
import { useHomeworkCreateQuestions } from "../useHomeworkCreateQuestions";

it("allows 500 blank authored questions, refuses the 501st and reuses capacity after deletion", () => {
  const { result } = renderHook(() => useHomeworkCreateQuestions({ locked: false, onExcelAccepted: () => {} }));
  act(() => result.current.requestManualAuthoring());
  act(() => { for (let index = 0; index < 501; index++) result.current.addQuestion(); });
  const content = result.current.content;
  if (content.kind !== "manual") throw new Error("Manual authoring missing");
  expect(content.questions).toHaveLength(500);
  expect(new Set(content.questions.map(question => question.id)).size).toBe(500);
  expect(content.questions.every(question => !question.questionTextEn && !question.questionTextAr && question.options?.every(option => !option.textEn && !option.textAr))).toBe(true);
  act(() => result.current.deleteQuestion(content.questions[0].id));
  act(() => result.current.addQuestion());
  if (result.current.content.kind !== "manual") throw new Error("Manual authoring missing");
  expect(result.current.content.questions).toHaveLength(500);
  expect(new Set(result.current.content.questions.map(question => question.id)).size).toBe(500);
});

it("clears incompatible answer fields and example choices only for the local authoring collection", () => {
  const { result } = renderHook(() => useHomeworkCreateQuestions({ locked: false, onExcelAccepted: () => {} }));
  act(() => result.current.requestManualAuthoring()); act(() => result.current.addQuestion());
  if (result.current.content.kind !== "manual") throw new Error("Manual authoring missing");
  const id = result.current.content.questions[0].id;
  act(() => result.current.updateQuestion(id, { questionType: "SHORT_ANSWER", expectedAnswer: "Answer" }));
  act(() => result.current.updateQuestion(id, { questionType: "TRUE_FALSE", correctAnswer: false }));
  if (result.current.content.kind !== "manual") throw new Error("Manual authoring missing");
  expect(result.current.content.questions[0]).toMatchObject({ correctAnswer: false, expectedAnswer: undefined, options: [] });
  act(() => result.current.updateQuestion(id, { questionType: "MCQ_SINGLE", options: [{ id: "1", textEn: "Example", textAr: "مثال", isCorrect: true, order: 1 }] }));
  if (result.current.content.kind !== "manual") throw new Error("Manual authoring missing");
  expect(result.current.content.questions[0]).toMatchObject({ correctAnswer: undefined, options: [{ textEn: "", textAr: "" }] });
});
