import {
  fetchStructureTree,
  type StructureTree,
} from "@/features/academics/academic-structure-tree/services/structureService";
import { fetchAssessments } from "@/features/grades/overview/services/gradesOverviewService";
import type {
  Assessment,
  ExamScopeType,
} from "@/features/grades/shared/types";
import type { HomeworkAssignmentUiModel } from "./homeworkApi.types";

export interface HomeworkGradeSyncScope {
  scopeType: ExamScopeType;
  scopeId: string;
}

function uniqueScopes(scopes: HomeworkGradeSyncScope[]) {
  return Array.from(
    new Map(
      scopes.map((scope) => [`${scope.scopeType}:${scope.scopeId}`, scope]),
    ).values(),
  );
}

export function resolveHomeworkGradeSyncScopes(
  homework: HomeworkAssignmentUiModel,
  structure: StructureTree,
): HomeworkGradeSyncScope[] {
  const classroom = structure.classrooms.find(
    ({ id }) => id === homework.classroomId,
  );
  const sectionId = homework.classroomSectionId ?? classroom?.sectionId;
  const section = structure.sections.find(({ id }) => id === sectionId);
  const gradeId = homework.classroomGradeId ?? section?.gradeId;
  const grade = structure.grades.find(({ id }) => id === gradeId);

  return uniqueScopes([
    { scopeType: "school", scopeId: "" },
    ...(grade?.stageId
      ? [{ scopeType: "stage" as const, scopeId: grade.stageId }]
      : []),
    ...(gradeId
      ? [{ scopeType: "grade" as const, scopeId: gradeId }]
      : []),
    ...(sectionId
      ? [{ scopeType: "section" as const, scopeId: sectionId }]
      : []),
    ...(homework.classroomId
      ? [{ scopeType: "classroom" as const, scopeId: homework.classroomId }]
      : []),
  ]);
}

function assessmentScopeId(assessment: Assessment): string {
  switch (assessment.scopeType) {
    case "stage":
      return assessment.stageId ?? assessment.scopeId;
    case "grade":
      return assessment.gradeId ?? assessment.scopeId;
    case "section":
      return assessment.sectionId ?? assessment.scopeId;
    case "classroom":
      return assessment.classroomId ?? assessment.scopeId;
    case "school":
    default:
      return "";
  }
}

function isCompatibleAssessment(
  assessment: Assessment,
  homework: HomeworkAssignmentUiModel,
  scopeKeys: ReadonlySet<string>,
): boolean {
  return (
    assessment.type === "ASSIGNMENT" &&
    !assessment.isLocked &&
    (!assessment.academicYearId ||
      assessment.academicYearId === homework.academicYearId) &&
    assessment.termId === homework.termId &&
    assessment.subjectId === homework.subjectId &&
    scopeKeys.has(`${assessment.scopeType}:${assessmentScopeId(assessment)}`)
  );
}

export async function discoverHomeworkGradeSyncCandidates(
  homework: HomeworkAssignmentUiModel,
): Promise<Assessment[]> {
  const { academicYearId, termId, subjectId } = homework;
  if (!academicYearId || !termId || !subjectId) {
    return [];
  }
  const structure = await fetchStructureTree(academicYearId, termId);
  const scopes = resolveHomeworkGradeSyncScopes(homework, structure);
  const results = await Promise.all(
    scopes.map(({ scopeType, scopeId }) =>
      fetchAssessments(academicYearId, termId, {
        scopeType,
        scopeId,
        subjectId,
        includeDrafts: true,
      }),
    ),
  );
  const scopeKeys = new Set(
    scopes.map(({ scopeType, scopeId }) => `${scopeType}:${scopeId}`),
  );
  const candidates = new Map<string, Assessment>();
  for (const assessment of results.flat()) {
    if (
      !candidates.has(assessment.id) &&
      isCompatibleAssessment(assessment, homework, scopeKeys)
    ) {
      candidates.set(assessment.id, assessment);
    }
  }
  return Array.from(candidates.values());
}
