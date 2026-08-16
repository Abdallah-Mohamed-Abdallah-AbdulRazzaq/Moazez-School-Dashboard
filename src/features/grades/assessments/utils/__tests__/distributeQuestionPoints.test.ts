import { describe, expect, it } from "vitest";
import { distributeQuestionPoints } from "../distributeQuestionPoints";

describe("question point distribution", () => {
  it("distributes decimal scores without changing the total", () => {
    const updates = distributeQuestionPoints(20.5, ["question-1", "question-2"]);

    expect(updates).toEqual([
      { questionId: "question-1", points: 10.25 },
      { questionId: "question-2", points: 10.25 },
    ]);
    expect(updates.reduce((total, update) => total + update.points, 0)).toBe(20.5);
  });

  it("assigns remaining hundredths deterministically", () => {
    expect(distributeQuestionPoints(20.51, ["question-1", "question-2"])).toEqual([
      { questionId: "question-1", points: 10.26 },
      { questionId: "question-2", points: 10.25 },
    ]);
  });
});
