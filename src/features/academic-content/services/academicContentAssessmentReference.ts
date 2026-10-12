import type { Assessment } from "@/features/grades/shared/types";
import type { Subject } from "@/features/academics/subjects/services/subjectsService";
import { assessmentReferenceScope } from "./academicContentReferenceScope";
import { targetLineage, type AcademicTargetOptions } from "./academicContentSelectors";

export type AssessmentReferenceNames = Pick<Subject, "name" | "nameAr" | "nameEn">;

export interface AcademicContentAssessmentReference extends Assessment {
  subject?: AssessmentReferenceNames;
  scopeNames?: AssessmentReferenceNames[];
}

export function withAssessmentReferenceNames(
  assessment: Assessment,
  context: Pick<AcademicTargetOptions, "structure" | "subjects">,
): AcademicContentAssessmentReference {
  const scope = assessmentReferenceScope(assessment);
  const lineage = targetLineage(context, scope);
  const hierarchy = [
    [context.structure.stages, lineage.stageId],
    [context.structure.grades, lineage.gradeId],
    [context.structure.sections, lineage.sectionId],
    [context.structure.classrooms, scope.classroomId],
  ] as const;
  return {
    ...assessment,
    subject: context.subjects.find(({ id }) => id === assessment.subjectId),
    scopeNames: hierarchy.flatMap(([entities, anchorId]) => {
      const entity = entities.find(({ id }) => id === anchorId);
      return entity ? [entity] : [];
    }),
  };
}
