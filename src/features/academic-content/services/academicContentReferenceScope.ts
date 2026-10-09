import type { Assessment } from "@/features/grades/shared/types";
import type {
  AcademicContentTargetDraft,
  AcademicContentTargetScope,
} from "../types/contracts";
import {
  targetLineage,
  type AcademicTargetOptions,
} from "./academicContentSelectors";

function resolvedScope(
  target: AcademicContentTargetDraft,
  structure: AcademicTargetOptions["structure"],
) {
  const lineage = targetLineage({ structure }, target);
  if (
    target.scopeType !== "SCHOOL" &&
    !structure.stages.some((stage) => stage.id === lineage.stageId)
  )
    return null;
  return {
    ...lineage,
    classroomId: target.scopeType === "CLASSROOM" ? target.classroomId : null,
    subjectId: target.subjectId,
  };
}

/** Backend reference validation requires a subject even for a whole-school scope. */
export function academicReferenceMatcher(
  targets: readonly AcademicContentTargetDraft[],
  structure: AcademicTargetOptions["structure"],
): (reference: AcademicContentTargetDraft) => boolean {
  const scopes = targets.map((target) => resolvedScope(target, structure));
  return (reference) => {
    const referenceScope = resolvedScope(reference, structure);
    if (!referenceScope) return false;
    return scopes.some(
      (scope) =>
        scope &&
        scope.subjectId &&
        scope.subjectId === referenceScope.subjectId &&
        (["stageId", "gradeId", "sectionId", "classroomId"] as const).every(
          (field) =>
            !scope[field] ||
            !referenceScope[field] ||
            scope[field] === referenceScope[field],
        ),
    );
  };
}

export function assessmentReferenceScope(
  assessment: Assessment,
): AcademicContentTargetDraft {
  const scopeType =
    assessment.scopeType.toUpperCase() as AcademicContentTargetScope;
  const fallbackAnchor = assessment.scopeKey || assessment.scopeId;
  return {
    scopeType,
    subjectId: assessment.subjectId,
    stageId:
      scopeType === "STAGE" ? assessment.stageId || fallbackAnchor : null,
    gradeId:
      scopeType === "GRADE" ? assessment.gradeId || fallbackAnchor : null,
    sectionId:
      scopeType === "SECTION" ? assessment.sectionId || fallbackAnchor : null,
    classroomId:
      scopeType === "CLASSROOM"
        ? assessment.classroomId || fallbackAnchor
        : null,
  };
}
