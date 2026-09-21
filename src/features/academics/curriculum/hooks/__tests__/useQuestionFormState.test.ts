import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useQuestionFormState } from "../useQuestionFormState";

describe("useQuestionFormState", () => {
  it("uses a bilingual MCQ template when a new question is opened", async () => {
    const { result } = renderHook(() => useQuestionFormState({
      question: null,
      isOpen: true,
      resetKey: null,
    }));

    await waitFor(() => {
      expect(result.current.questionTextAr).toBe("سؤال جديد");
    });

    expect(result.current.questionTextEn).toBe("New question");
    expect(result.current.questionType).toBe("MCQ_SINGLE");
    expect(result.current.points).toBe(1);
    expect(result.current.options).toEqual([
      expect.objectContaining({
        textAr: "الخيار الأول",
        textEn: "First option",
        isCorrect: true,
        order: 1,
      }),
      expect.objectContaining({
        textAr: "الخيار الثاني",
        textEn: "Second option",
        isCorrect: false,
        order: 2,
      }),
    ]);
  });
});
