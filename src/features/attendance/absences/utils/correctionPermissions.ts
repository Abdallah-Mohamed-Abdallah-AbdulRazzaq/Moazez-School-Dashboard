import type { AttendanceIncidentType } from "../types";

export function canCorrectIncidentToEarlyLeave(
  status: AttendanceIncidentType,
): boolean {
  return status === "ABSENT" || status === "LATE" || status === "EARLY_LEAVE";
}
