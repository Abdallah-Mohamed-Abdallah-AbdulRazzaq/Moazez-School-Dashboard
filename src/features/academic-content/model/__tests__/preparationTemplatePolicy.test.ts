import { describe, expect, it } from "vitest";
import { applyPreparationTemplate } from "../preparationTemplatePolicy";

describe("applyPreparationTemplate", () => {
  it("copies preset fields without replacing live academic references", () => {
    const current = {
      topic: "Current topic",
      objectives: ["Current objective"],
      learningOutcomes: [],
      teachingStrategies: [],
      activities: [],
      resourceNotes: null,
      assessmentNotes: null,
      teacherNotes: null,
      curriculumId: "curriculum-1",
      curriculumUnitId: "unit-1",
      curriculumLessonId: "lesson-1",
      lessonPlanId: "plan-1",
      lessonPlanItemId: "item-1",
      timetableEntryId: "entry-1",
    };
    const template = {
      id: "template-1",
      name: "Fractions preset",
      description: null,
      stageId: null,
      subjectId: null,
      topic: "Template topic",
      objectives: ["Template objective"],
      learningOutcomes: ["Template outcome"],
      teachingStrategies: ["Template strategy"],
      activities: ["Template activity"],
      resourceNotes: "Template resources",
      assessmentNotes: "Template assessment",
      teacherNotes: "Template notes",
      createdByUserId: "user-1",
      updatedByUserId: null,
      createdAt: "2026-10-01T08:00:00.000Z",
      updatedAt: "2026-10-02T08:00:00.000Z",
    };

    const applied = applyPreparationTemplate(current, template);

    expect(applied).toMatchObject({
      topic: "Template topic",
      curriculumId: "curriculum-1",
      curriculumUnitId: "unit-1",
      curriculumLessonId: "lesson-1",
      lessonPlanId: "plan-1",
      lessonPlanItemId: "item-1",
      timetableEntryId: "entry-1",
    });
    expect(applied.objectives).toEqual(["Template objective"]);
    expect(applied.objectives).not.toBe(template.objectives);
    expect(applied.learningOutcomes).not.toBe(template.learningOutcomes);
    expect(applied.teachingStrategies).not.toBe(template.teachingStrategies);
    expect(applied.activities).not.toBe(template.activities);
  });
});
