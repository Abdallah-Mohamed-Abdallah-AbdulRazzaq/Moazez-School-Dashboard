import type { AttendancePolicy } from "@/features/attendance/policies/types";
import type { EffectiveExcusePolicy } from "@/features/attendance/policies/services/attendancePolicyService";
import type { ExcuseRequest } from "../types";
import {
  getExcusePolicyIssue,
  resolveEffectiveExcuseAttendancePolicy,
} from "./excusePolicyValidation";

type ExcusePolicyInput = Pick<
  ExcuseRequest,
  | "dateFrom"
  | "dateTo"
  | "scopeType"
  | "scopeIds"
  | "attachments"
  | "reasonAr"
  | "reasonEn"
>;

function toEffectivePolicy(
  policy: AttendancePolicy | null,
): EffectiveExcusePolicy | null {
  if (!policy) return null;
  return {
    allowExcuses: policy.allowExcuses,
    requireExcuseReason: policy.requireExcuseReason,
    requireAttachmentForExcuse: policy.requireAttachmentForExcuse,
    lateThresholdMinutes: policy.lateThresholdMinutes ?? 15,
    earlyLeaveThresholdMinutes: policy.earlyLeaveThresholdMinutes ?? 15,
  };
}

export function deriveExcusePolicyState(
  policies: AttendancePolicy[],
  input: ExcusePolicyInput,
) {
  return {
    policy: toEffectivePolicy(
      resolveEffectiveExcuseAttendancePolicy(
        policies,
        input.dateFrom,
        input.scopeType,
        input.scopeIds,
      ),
    ),
    issue: getExcusePolicyIssue(input, policies),
  };
}
