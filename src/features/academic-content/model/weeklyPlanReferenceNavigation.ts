import type { HomeworkAssignmentUiModel } from "@/features/academics/homework/services/homeworkApi.types";
import type { Assessment } from "@/features/grades/shared/types";
import { assessmentReferenceScope } from "../services/academicContentReferenceScope";

interface ReferenceNavigationContext {
  locale: string;
  academicYearId?: string;
  termId?: string;
}

function referenceQuery(
  reference: { academicYearId?: string; termId?: string },
  context: ReferenceNavigationContext,
) {
  const query = new URLSearchParams();
  const year = reference.academicYearId || context.academicYearId;
  const term = reference.termId || context.termId;
  if (year) query.set("year", year);
  if (term) query.set("term", term);
  return query;
}

export function weeklyPlanHomeworkHref(
  homework: HomeworkAssignmentUiModel,
  context: ReferenceNavigationContext,
) {
  const query = referenceQuery(homework, context).toString();
  return `/${context.locale}/academics/homework/${encodeURIComponent(homework.id)}${query ? `?${query}` : ""}`;
}

export function weeklyPlanAssessmentHref(
  assessment: Assessment,
  context: ReferenceNavigationContext,
) {
  const query = referenceQuery(assessment, context);
  const scope = assessmentReferenceScope(assessment);
  query.set("scopeType", assessment.scopeType);
  query.set("scopeId", scope.classroomId || scope.sectionId || scope.gradeId || scope.stageId || "");
  query.set("subjectId", assessment.subjectId);
  query.set("assessmentId", assessment.id);
  return `/${context.locale}/grades/assessments?${query.toString()}#assessment-${encodeURIComponent(assessment.id)}`;
}
