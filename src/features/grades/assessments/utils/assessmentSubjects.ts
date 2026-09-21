import type { SubjectAllocation } from "@/features/academics/subjects/services/subjectsService";
import type { ExamScopeType, ScopeEntityOption, ScopeOption } from "../../shared/types";

type ScopeEntitiesByType = Record<ExamScopeType, ScopeEntityOption[]>;

function getScopeGradeId(
  scopeEntitiesByType: ScopeEntitiesByType,
  scopeType: ExamScopeType,
  scopeId: string,
): string {
  if (scopeType === "grade") return scopeId;

  const selectedScope = scopeEntitiesByType[scopeType].find(
    (entity) => entity.id === scopeId,
  );
  if (scopeType === "section") return selectedScope?.parentId || "";
  if (scopeType !== "classroom") return "";

  return scopeEntitiesByType.section.find(
    (section) => section.id === selectedScope?.parentId,
  )?.parentId || "";
}

function getScopeGradeIds(
  scopeEntitiesByType: ScopeEntitiesByType,
  scopeType: ExamScopeType,
  scopeId: string,
): Set<string> | null {
  const gradeId = getScopeGradeId(scopeEntitiesByType, scopeType, scopeId);
  if (gradeId) return new Set([gradeId]);
  if (scopeType !== "stage") return null;

  return new Set(
    scopeEntitiesByType.grade
      .filter((grade) => grade.parentId === scopeId)
      .map((grade) => grade.id),
  );
}

export function getEligibleAssessmentSubjects(
  subjects: Array<Pick<ScopeOption, "id" | "nameAr" | "nameEn">>,
  subjectAllocations: SubjectAllocation[],
  scopeEntitiesByType: ScopeEntitiesByType,
  scopeType: ExamScopeType,
  scopeId: string,
): Array<Pick<ScopeOption, "id" | "nameAr" | "nameEn">> {
  const gradeIds = getScopeGradeIds(
    scopeEntitiesByType,
    scopeType,
    scopeId,
  );
  const allocatedSubjectIds = new Set(
    subjectAllocations
      .filter((allocation) => !gradeIds || gradeIds.has(allocation.gradeId))
      .map((allocation) => allocation.subjectId),
  );

  return subjects.filter((subject) => allocatedSubjectIds.has(subject.id));
}
