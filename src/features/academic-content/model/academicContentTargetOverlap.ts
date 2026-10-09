import {
  targetLineage,
  type AcademicTargetOptions,
} from "../services/academicContentSelectors";
import type { AcademicContentTargetDraft } from "../types/contracts";

const scopeDepth = { SCHOOL: 0, STAGE: 1, GRADE: 2, SECTION: 3, CLASSROOM: 4 };

const scopeAnchor = {
  SCHOOL: null,
  STAGE: "stageId",
  GRADE: "gradeId",
  SECTION: "sectionId",
  CLASSROOM: "classroomId",
} as const;

function hasAnchor(target: AcademicContentTargetDraft): boolean {
  const anchor = scopeAnchor[target.scopeType];
  return anchor === null || Boolean(target[anchor]);
}

function overlapsBroaderScope(
  target: AcademicContentTargetDraft,
  broader: AcademicContentTargetDraft,
  options: AcademicTargetOptions,
): boolean {
  if (
    !hasAnchor(broader) ||
    scopeDepth[broader.scopeType] >= scopeDepth[target.scopeType]
  )
    return false;
  if (
    broader.subjectId &&
    target.subjectId &&
    broader.subjectId !== target.subjectId
  )
    return false;
  if (broader.scopeType === "SCHOOL") return true;
  const anchor = scopeAnchor[broader.scopeType];
  const lineage = {
    ...targetLineage(options, target),
    classroomId: target.classroomId,
  };
  return broader[anchor] === lineage[anchor];
}

/** Advisory only: teacher assignments do not restrict audience matching. */
export function broaderTargetIndices(
  target: AcademicContentTargetDraft,
  targets: readonly AcademicContentTargetDraft[],
  options: AcademicTargetOptions,
): number[] {
  if (!hasAnchor(target)) return [];
  return targets.flatMap((broader, index) =>
    overlapsBroaderScope(target, broader, options) ? [index] : [],
  );
}
