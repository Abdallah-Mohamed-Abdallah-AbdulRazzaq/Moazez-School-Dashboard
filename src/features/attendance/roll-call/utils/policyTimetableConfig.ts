import type { AttendancePolicy } from "@/features/attendance/policies/types";
import type { AttendanceScopeType } from "@/features/attendance/policies/types";
import type { FetchTimetableConfigParams } from "@/features/academics/timetable/services/timetableConfigService";
import type { AttendanceScopeIds } from "@/features/attendance/shared/attendanceScope";

type PolicyTimetableScope = Exclude<
  AttendancePolicy["scopeType"],
  "SCHOOL" | "STAGE"
>;

const timetableScopeIds: Record<
  PolicyTimetableScope,
  keyof NonNullable<AttendancePolicy["scopeIds"]>
> = {
  GRADE: "gradeId",
  SECTION: "sectionId",
  CLASSROOM: "classroomId",
};

export function getPolicyTimetableConfigRequest(
  policy: Pick<AttendancePolicy, "scopeType" | "scopeIds">,
  academicYearId: string,
  termId: string,
): FetchTimetableConfigParams | null {
  return getRollCallTimetableConfigRequest(
    policy.scopeType,
    policy.scopeIds || {},
    academicYearId,
    termId,
  );
}

export function getRollCallTimetableConfigRequest(
  scopeType: AttendanceScopeType,
  scopeIds: AttendanceScopeIds,
  academicYearId: string,
  termId: string,
): FetchTimetableConfigParams | null {
  const request = { academicYearId, termId };

  if (scopeType === "SCHOOL") {
    return { ...request, scopeType: "TERM" };
  }
  if (scopeType === "STAGE") {
    return { ...request, scopeType: "TERM" };
  }

  const scopeIdKey = timetableScopeIds[scopeType];
  const scopeId = scopeIds[scopeIdKey];
  if (!scopeId) return null;

  return {
    ...request,
    scopeType,
    [scopeIdKey]: scopeId,
  };
}
