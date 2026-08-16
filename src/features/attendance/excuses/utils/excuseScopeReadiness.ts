import type { AttendanceScopeType } from "@/features/attendance/policies/types";
import {
  isScopeSelectionComplete,
  type AttendanceScopeIds,
} from "@/features/attendance/shared/attendanceScope";
import type { ExcuseType } from "../types";

export function getReadyExcuseScope(
  scopeType: AttendanceScopeType,
  scopeIds?: AttendanceScopeIds,
  explicitSelection = true,
  requestType: ExcuseType = "ABSENCE",
) {
  const acceptsDefaultSchoolScope =
    requestType === "ABSENCE" && scopeType === "SCHOOL";
  if (!explicitSelection && !acceptsDefaultSchoolScope) return null;
  if (
    requestType !== "ABSENCE" &&
    (scopeType === "SCHOOL" || scopeType === "STAGE")
  ) {
    return null;
  }
  if (!isScopeSelectionComplete(scopeType, scopeIds)) return null;

  return { scopeType, scopeIds };
}
