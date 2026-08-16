import type { AttendancePolicy } from "@/features/attendance/policies/types";
import type { ExcuseRequest } from "../types";
import { formatLocalDate } from "../../utils/dateFormatting";
import {
  ATTENDANCE_SCOPE_PRIORITY,
  resolveAttendanceHierarchyScope,
  scopeMatchesTarget,
} from "@/features/attendance/shared/attendanceScope";

export type ExcusePolicyIssueCode =
  | "NO_ACTIVE_POLICY"
  | "EXCUSES_DISABLED"
  | "REASON_REQUIRED"
  | "ATTACHMENT_REQUIRED";

export interface ExcusePolicyIssue {
  code: ExcusePolicyIssueCode;
  date: string;
}

export class ExcusePolicyValidationError extends Error {
  issue: ExcusePolicyIssue;

  constructor(issue: ExcusePolicyIssue) {
    super(issue.code);
    this.name = "ExcusePolicyValidationError";
    this.issue = issue;
  }
}

export function enumerateExcuseDates(dateFrom: string, dateTo: string): string[] {
  const result: string[] = [];
  const current = new Date(`${dateFrom}T00:00:00`);
  const end = new Date(`${dateTo}T00:00:00`);

  while (current <= end) {
    result.push(formatLocalDate(current));
    current.setDate(current.getDate() + 1);
  }

  return result;
}

export function resolveEffectiveExcuseAttendancePolicy(
  policies: AttendancePolicy[],
  date: string,
  scopeType: ExcuseRequest["scopeType"],
  scopeIds?: ExcuseRequest["scopeIds"]
): AttendancePolicy | null {
  if (!scopeType) return null;

  const active = policies.filter((policy) => {
    if (!policy.isActive) return false;
    if (policy.effectiveStartDate && date < policy.effectiveStartDate) return false;
    if (policy.effectiveEndDate && date > policy.effectiveEndDate) return false;
    return true;
  });

  const resolvedScope = resolveAttendanceHierarchyScope({ scopeType, scopeIds });

  for (const priority of ATTENDANCE_SCOPE_PRIORITY) {
    const match = active.find(
      (policy) =>
        policy.scopeType === priority &&
        scopeMatchesTarget(policy.scopeType, policy.scopeIds, resolvedScope)
    );

    if (match) {
      return match;
    }
  }

  return null;
}

export function getExcusePolicyIssue(
  request: Pick<ExcuseRequest, "dateFrom" | "dateTo" | "scopeType" | "scopeIds" | "attachments" | "reasonAr" | "reasonEn">,
  policies: AttendancePolicy[]
): ExcusePolicyIssue | null {
  const dates = enumerateExcuseDates(request.dateFrom, request.dateTo);

  for (const date of dates) {
    const effectivePolicy = resolveEffectiveExcuseAttendancePolicy(
      policies,
      date,
      request.scopeType,
      request.scopeIds
    );

    if (!effectivePolicy) {
      return { code: "NO_ACTIVE_POLICY", date };
    }

    if (!effectivePolicy.allowExcuses) {
      return { code: "EXCUSES_DISABLED", date };
    }

    const hasReason = !!(request.reasonAr?.trim() || request.reasonEn?.trim());
    if (effectivePolicy.requireExcuseReason && !hasReason) {
      return { code: "REASON_REQUIRED", date };
    }

    if (effectivePolicy.requireAttachmentForExcuse && request.attachments.length === 0) {
      return { code: "ATTACHMENT_REQUIRED", date };
    }
  }

  return null;
}

export function assertExcusePolicyAllowed(
  request: Pick<ExcuseRequest, "dateFrom" | "dateTo" | "scopeType" | "scopeIds" | "attachments" | "reasonAr" | "reasonEn">,
  policies: AttendancePolicy[]
) {
  const issue = getExcusePolicyIssue(request, policies);
  if (issue) {
    throw new ExcusePolicyValidationError(issue);
  }
}
