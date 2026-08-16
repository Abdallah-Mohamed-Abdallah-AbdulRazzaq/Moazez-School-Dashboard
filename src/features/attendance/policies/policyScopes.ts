import type { AttendanceScopeType } from "./types";

export type AvailablePolicyScopeType = Exclude<
  AttendanceScopeType,
  "STAGE"
>;

export const AVAILABLE_POLICY_SCOPE_TYPES: AvailablePolicyScopeType[] = [
  "SCHOOL",
  "GRADE",
  "SECTION",
  "CLASSROOM",
];

export const isAvailablePolicyScope = (
  scopeType: AttendanceScopeType,
): scopeType is AvailablePolicyScopeType =>
  AVAILABLE_POLICY_SCOPE_TYPES.includes(scopeType as AvailablePolicyScopeType);
