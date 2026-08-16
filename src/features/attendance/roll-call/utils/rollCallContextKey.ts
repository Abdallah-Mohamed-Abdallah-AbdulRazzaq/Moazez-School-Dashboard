import type { AttendanceScopeType } from "@/features/attendance/policies/types";
import type { AttendanceScopeIds } from "@/features/attendance/shared/attendanceScope";

export function getRollCallContextKey({
  yearId,
  termId,
  date,
  scopeType,
  scopeIds,
}: {
  yearId?: string;
  termId?: string;
  date: string;
  scopeType: AttendanceScopeType;
  scopeIds: AttendanceScopeIds;
}): string {
  return JSON.stringify({
    yearId: yearId ?? null,
    termId: termId ?? null,
    date,
    scopeType,
    stageId: scopeIds.stageId ?? null,
    gradeId: scopeIds.gradeId ?? null,
    sectionId: scopeIds.sectionId ?? null,
    classroomId: scopeIds.classroomId ?? null,
  });
}
