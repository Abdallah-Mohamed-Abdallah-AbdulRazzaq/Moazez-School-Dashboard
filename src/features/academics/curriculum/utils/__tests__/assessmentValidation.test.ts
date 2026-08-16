import { describe, expect, it } from "vitest";
import type { Assignment, AssignmentQuestion } from "../../services/curriculumService";
import { validateAssignment, validateQuestion } from "../validation";

const t = (key: string) => key;

function question(overrides: Partial<AssignmentQuestion> = {}): AssignmentQuestion {
  return {
    id: "question-1",
    assignmentId: "assessment-1",
    questionTextAr: "سؤال",
    questionTextEn: "Question",
    questionType: "SHORT_ANSWER",
    points: 1,
    order: 1,
    createdAt: "",
    ...overrides,
  };
}

describe("assessment backend validation boundaries", () => {
  it("rejects zero question points", () => {
    expect(validateQuestion(question({ points: 0 }), t)).toEqual(
      expect.objectContaining({ points: "invalid_points" }),
    );
  });

  it("requires prompts for media questions", () => {
    expect(validateQuestion(question({
      questionType: "MEDIA",
      questionTextAr: "",
      questionTextEn: "",
      mediaMode: "LINK",
      mediaUrl: "https://example.com/media.png",
    }), t)).toEqual(expect.objectContaining({
      textAr: "required_ar",
      textEn: "required_en",
    }));
  });

  it("rejects expected time below one minute", () => {
    const assignment = {
      id: "assessment-1",
      titleAr: "اختبار",
      titleEn: "Assessment",
      maxScore: 20,
      expectedTimeMinutes: 0,
    } as Assignment;

    expect(validateAssignment(assignment, [question()], t)).toEqual(
      expect.objectContaining({ expectedTimeMinutes: "invalid_expected_time" }),
    );
  });
});
