import type { AttendancePolicy } from "@/features/attendance/policies/types";

export type ThresholdIncidentType = "LATE" | "EARLY_LEAVE";

type PolicyThresholdSource = Pick<
  AttendancePolicy,
  "lateThresholdMinutes" | "earlyLeaveThresholdMinutes"
>;

export interface ThresholdState {
  threshold?: number;
  isReached: boolean;
}

export function getPolicyThreshold(
  type: ThresholdIncidentType,
  policy?: Partial<PolicyThresholdSource> | null
): number | undefined {
  const value =
    type === "LATE"
      ? policy?.lateThresholdMinutes
      : policy?.earlyLeaveThresholdMinutes;

  return typeof value === "number" && value > 0 ? value : undefined;
}

export function getThresholdState(
  type: ThresholdIncidentType,
  minutes?: number,
  policy?: Partial<PolicyThresholdSource> | null
): ThresholdState {
  const threshold = getPolicyThreshold(type, policy);

  return {
    threshold,
    isReached:
      typeof threshold === "number" &&
      typeof minutes === "number" &&
      minutes >= threshold,
  };
}
