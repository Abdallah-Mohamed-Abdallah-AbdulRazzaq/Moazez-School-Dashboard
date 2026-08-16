import { fetchPolicies } from "@/features/attendance/policies/services/attendancePolicyService";
import type { AttendancePolicy } from "@/features/attendance/policies/types";
import { getOrCreateSession, upsertEntry } from "@/features/attendance/roll-call/services/attendanceRollCallService";
import { fetchTimetableConfig } from "@/features/academics/timetable/services/timetableConfigService";
import { resolveTimetableConfig } from "@/features/academics/timetable/types/timetableConfig";
import type { TimetablePeriod } from "@/features/academics/timetable/types/timetableConfig";
import type { AttachmentMeta as RollCallAttachmentMeta } from "@/features/attendance/roll-call/types";
import type { ExcuseRequest } from "../types";
import { normalizeSelectedPeriodIds } from "../../utils/periodIdNormalization";
import {
  assertExcusePolicyAllowed,
  enumerateExcuseDates,
  resolveEffectiveExcuseAttendancePolicy,
} from "./excusePolicyValidation";

interface ApplyExcuseParams {
  request: ExcuseRequest;
  decidedBy?: string;
}

async function fetchTimetablePeriodsForScope(
  yearId: string,
  termId: string,
  scopeIds: ExcuseRequest["scopeIds"]
): Promise<TimetablePeriod[]> {
  const termConfig = await fetchTimetableConfig({
    academicYearId: yearId,
    termId,
    scopeType: "TERM",
  });

  let gradeConfig = null;
  if (scopeIds?.gradeId) {
    gradeConfig = await fetchTimetableConfig({
      academicYearId: yearId,
      termId,
      scopeType: "GRADE",
      gradeId: scopeIds.gradeId,
    });
  }

  let sectionConfig = null;
  if (scopeIds?.sectionId) {
    sectionConfig = await fetchTimetableConfig({
      academicYearId: yearId,
      termId,
      scopeType: "SECTION",
      sectionId: scopeIds.sectionId,
    });
  }

  const resolved = resolveTimetableConfig(termConfig, gradeConfig, sectionConfig);
  return resolved.periods;
}

function choosePeriodIds(
  request: ExcuseRequest,
  policy: AttendancePolicy,
  periods: TimetablePeriod[]
): string[] {
  const normalizedPolicyPeriods = normalizeSelectedPeriodIds(policy.selectedPeriodIds || [], periods);

  if (request.type === "ABSENCE") {
    return normalizedPolicyPeriods.length > 0 ? normalizedPolicyPeriods : [periods[0]?.id].filter(Boolean);
  }

  if (request.selectedPeriodIds && request.selectedPeriodIds.length > 0) {
    return normalizeSelectedPeriodIds(request.selectedPeriodIds, periods);
  }

  if (request.periodIndexes && request.periodIndexes.length > 0) {
    return request.periodIndexes
      .map((index) => periods.find((period) => period.index === index)?.id)
      .filter((id): id is string => id !== undefined);
  }

  if (normalizedPolicyPeriods.length === 0) {
    return [periods[0]?.id].filter(Boolean);
  }

  return request.type === "LATE"
    ? [normalizedPolicyPeriods[0]]
    : [normalizedPolicyPeriods[normalizedPolicyPeriods.length - 1]];
}

function mapAttachments(attachments: ExcuseRequest["attachments"], decidedBy?: string): RollCallAttachmentMeta[] {
  return attachments.map((attachment) => ({
    id: attachment.id,
    name: attachment.name,
    size: attachment.size,
    type: attachment.type,
    uploadedBy: decidedBy,
    uploadedAt: new Date().toISOString(),
  }));
}

export async function applyExcuseToAttendance({ request, decidedBy }: ApplyExcuseParams): Promise<string[]> {
  if (!request.scopeType) {
    throw new Error("Cannot apply an excuse without attendance scope context.");
  }

  const policies = await fetchPolicies(request.yearId, request.termId);
  assertExcusePolicyAllowed(request, policies);

  const dates = enumerateExcuseDates(request.dateFrom, request.dateTo);
  const linkedSessionIds = new Set<string>();
  const periods = await fetchTimetablePeriodsForScope(request.yearId, request.termId, request.scopeIds);

  for (const date of dates) {
    const effectivePolicy = resolveEffectiveExcuseAttendancePolicy(
      policies,
      date,
      request.scopeType,
      request.scopeIds
    );

    if (!effectivePolicy) {
      continue;
    }

    const targetPeriodIds = choosePeriodIds(request, effectivePolicy, periods);

    for (const periodId of targetPeriodIds) {
      const periodData = periods.find((period) => period.id === periodId);
      if (!periodData) {
        continue;
      }

      const sessionData = await getOrCreateSession({
        yearId: request.yearId,
        termId: request.termId,
        date,
        scopeType: request.scopeType,
        scopeIds: request.scopeIds,
        mode: "PERIOD",
        periodId: periodData.id,
        periodIndex: periodData.index,
        periodNameAr: periodData.nameAr,
        periodNameEn: periodData.nameEn,
      });

      linkedSessionIds.add(sessionData.session.id);

      const entryUpdate: {
        status: "EXCUSED";
        excuseReason: string;
        excuseAttachments: RollCallAttachmentMeta[];
        minutesLate?: number;
        minutesEarlyLeave?: number;
      } = {
        status: "EXCUSED",
        excuseReason: request.reasonEn || request.reasonAr,
        excuseAttachments: mapAttachments(request.attachments, decidedBy),
      };

      if (request.type === "LATE" && request.minutesLate !== undefined) {
        entryUpdate.minutesLate = request.minutesLate;
      }

      if (request.type === "EARLY_LEAVE" && request.minutesEarlyLeave !== undefined) {
        entryUpdate.minutesEarlyLeave = request.minutesEarlyLeave;
      }

      await upsertEntry(request.yearId, request.termId, sessionData.session.id, request.studentId, entryUpdate);
    }
  }

  return Array.from(linkedSessionIds);
}
