import type { AttendancePolicy } from "../types";

type PolicyModeSource = Pick<AttendancePolicy, "mode"> | null | undefined;

export const isDailyAttendancePolicy = (policy: PolicyModeSource) =>
  policy?.mode === "DAILY";

export const isPeriodAttendancePolicy = (policy: PolicyModeSource) =>
  policy?.mode === "PERIOD";
