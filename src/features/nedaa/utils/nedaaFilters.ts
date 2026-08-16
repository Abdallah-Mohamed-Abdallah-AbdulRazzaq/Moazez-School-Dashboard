import type {
  ListDismissalGatesParams,
  ListDismissalStaffAssignmentsParams,
} from "@/features/nedaa/types/nedaa";

export type NedaaBooleanFilterValue = "" | "true" | "false";

export interface NedaaGateFilters {
  q: string;
  status: string;
  active: NedaaBooleanFilterValue;
  page: number;
  limit: number;
}

export interface NedaaStaffAssignmentFilters {
  q: string;
  staffUserId: string;
  gateId: string;
  stageId: string;
  gradeId: string;
  sectionId: string;
  classroomId: string;
  active: NedaaBooleanFilterValue;
  lead: NedaaBooleanFilterValue;
  page: number;
  limit: number;
}

function trimOrUndefined(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function booleanFilterValue(
  value: NedaaBooleanFilterValue,
): boolean | undefined {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

export function buildDismissalGatesListParams({
  q,
  status,
  active,
  page,
  limit,
}: NedaaGateFilters): ListDismissalGatesParams {
  const trimmedQuery = trimOrUndefined(q);
  const trimmedStatus = trimOrUndefined(status);
  const activeValue = booleanFilterValue(active);

  return {
    ...(trimmedQuery ? { q: trimmedQuery } : {}),
    ...(trimmedStatus ? { status: trimmedStatus } : {}),
    ...(activeValue !== undefined ? { active: activeValue } : {}),
    page,
    limit,
  };
}

export function buildDismissalStaffAssignmentsListParams({
  q,
  staffUserId,
  gateId,
  stageId,
  gradeId,
  sectionId,
  classroomId,
  active,
  lead,
  page,
  limit,
}: NedaaStaffAssignmentFilters): ListDismissalStaffAssignmentsParams {
  const trimmedQuery = trimOrUndefined(q);
  const trimmedStaffUserId = trimOrUndefined(staffUserId);
  const trimmedGateId = trimOrUndefined(gateId);
  const trimmedStageId = trimOrUndefined(stageId);
  const trimmedGradeId = trimOrUndefined(gradeId);
  const trimmedSectionId = trimOrUndefined(sectionId);
  const trimmedClassroomId = trimOrUndefined(classroomId);
  const activeValue = booleanFilterValue(active);
  const leadValue = booleanFilterValue(lead);

  return {
    ...(trimmedQuery ? { q: trimmedQuery } : {}),
    ...(trimmedStaffUserId ? { staffUserId: trimmedStaffUserId } : {}),
    ...(trimmedGateId ? { gateId: trimmedGateId } : {}),
    ...(trimmedStageId ? { stageId: trimmedStageId } : {}),
    ...(trimmedGradeId ? { gradeId: trimmedGradeId } : {}),
    ...(trimmedSectionId ? { sectionId: trimmedSectionId } : {}),
    ...(trimmedClassroomId ? { classroomId: trimmedClassroomId } : {}),
    ...(activeValue !== undefined ? { active: activeValue } : {}),
    ...(leadValue !== undefined ? { lead: leadValue } : {}),
    page,
    limit,
  };
}
