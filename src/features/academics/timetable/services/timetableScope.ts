import type { TimetableScopeType } from "@/features/academics/timetable/services/timetableApiTypes";

export interface TimetableScopeIds {
  stageId?: string | null;
  gradeId?: string | null;
  sectionId?: string | null;
  classroomId?: string | null;
}

export interface TimetableScopeSelection {
  scopeType: TimetableScopeType;
  stageId?: string;
  gradeId?: string;
  sectionId?: string;
  classroomId?: string;
}

interface TimetableConfigScopeIdentity extends TimetableScopeIds {
  scopeType: string;
}

export function resolveTimetableScopeSelection(
  scopeIds: TimetableScopeIds,
): TimetableScopeSelection {
  if (scopeIds.classroomId) {
    return { scopeType: "CLASSROOM", classroomId: scopeIds.classroomId };
  }
  if (scopeIds.sectionId) {
    return { scopeType: "SECTION", sectionId: scopeIds.sectionId };
  }
  if (scopeIds.gradeId) {
    return { scopeType: "GRADE", gradeId: scopeIds.gradeId };
  }
  if (scopeIds.stageId) {
    return { scopeType: "STAGE", stageId: scopeIds.stageId };
  }
  return { scopeType: "TERM" };
}

export function timetableConfigScopeId(
  config: TimetableConfigScopeIdentity,
): string | undefined {
  switch (config.scopeType.toUpperCase()) {
    case "CLASSROOM":
      return config.classroomId ?? undefined;
    case "SECTION":
      return config.sectionId ?? undefined;
    case "GRADE":
      return config.gradeId ?? undefined;
    case "STAGE":
      return config.stageId ?? undefined;
    default:
      return undefined;
  }
}
