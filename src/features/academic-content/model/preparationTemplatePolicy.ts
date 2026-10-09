import type {
  AcademicContentPreparationDetail,
  AcademicContentPreparationTemplateDetail,
} from "../types/contracts";

export function applyPreparationTemplate(
  current: AcademicContentPreparationDetail,
  template: AcademicContentPreparationTemplateDetail,
): AcademicContentPreparationDetail {
  return {
    ...current,
    topic: template.topic,
    objectives: [...template.objectives],
    learningOutcomes: [...template.learningOutcomes],
    teachingStrategies: [...template.teachingStrategies],
    activities: [...template.activities],
    resourceNotes: template.resourceNotes,
    assessmentNotes: template.assessmentNotes,
    teacherNotes: template.teacherNotes,
  };
}
