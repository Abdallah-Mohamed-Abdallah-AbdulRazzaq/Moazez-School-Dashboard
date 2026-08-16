import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import { isApiError } from "@/lib/api-error";
import type {
  AttendancePolicy,
  AttendanceScopeType,
  PolicyFormData,
} from "../types";
import { migratePeriodIds } from "@/features/academics/timetable/types/timetableConfig";
import { fetchTimetableConfigs } from "@/features/academics/timetable/services/timetableConfigService";
import { resolveTimetableConfig } from "@/features/academics/timetable/types/timetableConfig";
import { type AttendanceScopeIds } from "@/features/attendance/shared/attendanceScope";

type BackendRecord = Record<string, unknown>;

const BASE = "/attendance/policies";

export interface ListPoliciesParams {
  academicYearId: string;
  termId: string;
  scopeType?: AttendanceScopeType;
  classroomId?: string;
  isActive?: boolean;
}

export interface ValidatePolicyNameParams {
  academicYearId: string;
  termId: string;
  scopeType: AttendanceScopeType;
  scopeIds?: AttendanceScopeIds;
  nameAr: string;
  nameEn: string;
  excludeId?: string;
}

export interface EffectiveAttendancePolicyParams {
  yearId: string;
  termId: string;
  scopeType: AttendanceScopeType;
  scopeIds?: AttendanceScopeIds;
  date: string;
}

export interface PolicyNameValidationResult {
  uniqueAr: boolean;
  uniqueEn: boolean;
  available: boolean;
}

export function isAttendancePolicyConflict(error: unknown): boolean {
  return isApiError(error) && error.code === "attendance.policy.conflict";
}

function asRecord(value: unknown): BackendRecord {
  return value && typeof value === "object" ? (value as BackendRecord) : {};
}

function unwrapArray(response: unknown): unknown[] {
  if (Array.isArray(response)) return response;
  const object = asRecord(response);
  for (const key of ["items", "data", "policies"]) {
    if (Array.isArray(object[key])) return object[key] as unknown[];
  }
  return [];
}

function unwrapPolicy(response: unknown): BackendRecord {
  const object = asRecord(response);
  for (const key of ["policy", "data"]) {
    const nested = object[key];
    if (nested && typeof nested === "object" && !Array.isArray(nested))
      return nested as BackendRecord;
  }
  return object;
}

function getString(object: BackendRecord, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = object[key];
    if (typeof value === "string" && value.length > 0) return value;
  }
  return fallback;
}

function getOptionalString(object: BackendRecord, keys: string[]) {
  const value = getString(object, keys);
  return value || undefined;
}

function getNullableString(object: BackendRecord, keys: string[]) {
  return getOptionalString(object, keys) ?? null;
}

function getOptionalNumber(object: BackendRecord, keys: string[]) {
  for (const key of keys) {
    const value = object[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
}

function getNullableNumber(object: BackendRecord, keys: string[]) {
  return getOptionalNumber(object, keys) ?? null;
}

function getBoolean(object: BackendRecord, keys: string[], fallback = false) {
  for (const key of keys) {
    const value = object[key];
    if (typeof value === "boolean") return value;
  }
  return fallback;
}

function stripScopeKeyPrefix(scopeKey: string) {
  const separatorIndex = scopeKey.indexOf(":");
  return separatorIndex === -1 ? scopeKey : scopeKey.slice(separatorIndex + 1);
}

function resolveScopeIds(
  scopeType: AttendanceScopeType,
  object: BackendRecord,
): AttendanceScopeIds | undefined {
  const nested =
    object.scopeIds && typeof object.scopeIds === "object"
      ? (object.scopeIds as AttendanceScopeIds)
      : {};
  const scopeKey = getOptionalString(object, ["scopeKey", "scopeId"]);
  const scopeId =
    scopeKey && scopeKey !== "school"
      ? stripScopeKeyPrefix(scopeKey)
      : undefined;
  return {
    ...nested,
    stageId:
      getOptionalString(object, ["stageId"]) ||
      nested.stageId ||
      (scopeType === "STAGE" ? scopeId : undefined),
    gradeId:
      getOptionalString(object, ["gradeId"]) ||
      nested.gradeId ||
      (scopeType === "GRADE" ? scopeId : undefined),
    sectionId:
      getOptionalString(object, ["sectionId"]) ||
      nested.sectionId ||
      (scopeType === "SECTION" ? scopeId : undefined),
    classroomId:
      getOptionalString(object, ["classroomId"]) ||
      nested.classroomId ||
      (scopeType === "CLASSROOM" ? scopeId : undefined),
  };
}

function buildScopeParams(
  scopeType: AttendanceScopeType,
  scopeIds?: AttendanceScopeIds,
) {
  const params: Record<string, string> = {};
  if (scopeIds?.stageId) params.stageId = scopeIds.stageId;
  if (scopeIds?.gradeId) params.gradeId = scopeIds.gradeId;
  if (scopeIds?.sectionId) params.sectionId = scopeIds.sectionId;
  if (scopeIds?.classroomId) params.classroomId = scopeIds.classroomId;
  return params;
}

function compactPayload<T extends Record<string, unknown>>(
  payload: T,
): Partial<T> {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}

function mapPolicy(
  item: unknown,
  fallback?: { yearId?: string; termId?: string },
): AttendancePolicy {
  const object = unwrapPolicy(item);
  const id = getString(object, ["id"]);
  const yearId = getString(
    object,
    ["yearId", "academicYearId"],
    fallback?.yearId || "",
  );
  const termId = getString(object, ["termId"], fallback?.termId || "");
  if (!id || !yearId || !termId) {
    throw new Error("Invalid attendance policy response");
  }
  const scopeType = String(
    object.scopeType || "SCHOOL",
  ).toUpperCase() as AttendanceScopeType;
  return {
    id,
    yearId,
    termId,
    nameAr: getString(object, ["nameAr"]),
    nameEn: getString(object, ["nameEn"]),
    descriptionAr: getNullableString(object, ["descriptionAr"]),
    descriptionEn: getNullableString(object, ["descriptionEn"]),
    notes: getNullableString(object, ["notes"]),
    scopeType,
    scopeIds: resolveScopeIds(scopeType, object),
    mode: String(
      object.mode || "DAILY",
    ).toUpperCase() as AttendancePolicy["mode"],
    dailyComputationStrategy: getOptionalString(object, [
      "dailyComputationStrategy",
    ]) as AttendancePolicy["dailyComputationStrategy"],
    selectedPeriodIds: Array.isArray(object.selectedPeriodIds)
      ? (object.selectedPeriodIds as string[])
      : [],
    lateThresholdMinutes: getNullableNumber(object, ["lateThresholdMinutes"]),
    earlyLeaveThresholdMinutes: getNullableNumber(object, [
      "earlyLeaveThresholdMinutes",
    ]),
    autoAbsentAfterMinutes: getNullableNumber(object, [
      "autoAbsentAfterMinutes",
    ]),
    absentIfMissedPeriodsCount: getNullableNumber(object, [
      "absentIfMissedPeriodsCount",
    ]),
    allowExcuses: getBoolean(
      object,
      ["allowExcuses", "allowParentExcuseRequests"],
      true,
    ),
    requireExcuseReason: getBoolean(object, ["requireExcuseReason"], false),
    requireAttachmentForExcuse: getBoolean(
      object,
      ["requireAttachmentForExcuse", "requireExcuseAttachment"],
      false,
    ),
    notifyTeachers: getBoolean(object, ["notifyTeachers"], false),
    notifyStudents: getBoolean(object, ["notifyStudents"], false),
    notifyGuardians: getBoolean(
      object,
      ["notifyGuardians", "notifyGuardiansOnAbsence"],
      false,
    ),
    notifyOnAbsent: getBoolean(object, ["notifyOnAbsent"], false),
    notifyOnLate: getBoolean(object, ["notifyOnLate"], false),
    notifyOnEarlyLeave: getBoolean(object, ["notifyOnEarlyLeave"], false),
    effectiveStartDate: getNullableString(object, [
      "effectiveStartDate",
      "effectiveFrom",
    ]),
    effectiveEndDate: getNullableString(object, [
      "effectiveEndDate",
      "effectiveTo",
    ]),
    isActive: getBoolean(object, ["isActive"], true),
    createdAt: getString(object, ["createdAt"]),
    updatedAt: getString(object, ["updatedAt"]),
  };
}

type PolicyWriteInput = Partial<
  Omit<AttendancePolicy, "id" | "createdAt" | "updatedAt">
>;

function buildPolicyFields(payload: PolicyWriteInput) {
  return {
    academicYearId: payload.yearId,
    termId: payload.termId,
    nameAr: payload.nameAr,
    nameEn: payload.nameEn,
    descriptionAr: payload.descriptionAr,
    descriptionEn: payload.descriptionEn,
    notes: payload.notes,
    scopeType: payload.scopeType,
    scopeIds: payload.scopeIds,
    ...buildScopeParams(payload.scopeType || "SCHOOL", payload.scopeIds),
    mode: payload.mode,
    dailyComputationStrategy: payload.dailyComputationStrategy,
    selectedPeriodIds: payload.selectedPeriodIds,
    lateThresholdMinutes: payload.lateThresholdMinutes,
    earlyLeaveThresholdMinutes: payload.earlyLeaveThresholdMinutes,
    autoAbsentAfterMinutes: payload.autoAbsentAfterMinutes,
    absentIfMissedPeriodsCount: payload.absentIfMissedPeriodsCount,
    allowParentExcuseRequests: payload.allowExcuses,
    allowExcuses: payload.allowExcuses,
    requireExcuseReason: payload.requireExcuseReason,
    requireExcuseAttachment: payload.requireAttachmentForExcuse,
    requireAttachmentForExcuse: payload.requireAttachmentForExcuse,
    notifyGuardiansOnAbsence: payload.notifyGuardians,
    notifyTeachers: payload.notifyTeachers,
    notifyStudents: payload.notifyStudents,
    notifyGuardians: payload.notifyGuardians,
    notifyOnAbsent: payload.notifyOnAbsent,
    notifyOnLate: payload.notifyOnLate,
    notifyOnEarlyLeave: payload.notifyOnEarlyLeave,
    effectiveFrom: payload.effectiveStartDate,
    effectiveStartDate: payload.effectiveStartDate,
    effectiveTo: payload.effectiveEndDate,
    effectiveEndDate: payload.effectiveEndDate,
    isActive: payload.isActive,
  };
}

function buildCreatePolicyPayload(
  payload: PolicyFormData,
) {
  return {
    ...buildPolicyFields(payload),
    notes: payload.notes ?? null,
    dailyComputationStrategy:
      payload.dailyComputationStrategy ?? "DERIVED_FROM_PERIODS",
    autoAbsentAfterMinutes: payload.autoAbsentAfterMinutes ?? null,
  };
}

function buildPatchPolicyPayload(payload: PolicyWriteInput) {
  return compactPayload(buildPolicyFields(payload));
}

export async function validatePolicyName(
  params: ValidatePolicyNameParams,
): Promise<PolicyNameValidationResult> {
  const response = await apiGet<unknown>(`${BASE}/validate-name`, {
    params: compactPayload({
      academicYearId: params.academicYearId,
      termId: params.termId,
      scopeType: params.scopeType,
      ...buildScopeParams(params.scopeType, params.scopeIds),
      nameAr: params.nameAr,
      nameEn: params.nameEn,
      excludeId: params.excludeId,
    }),
  });
  const result = unwrapPolicy(response);
  if (
    typeof result.uniqueAr !== "boolean" ||
    typeof result.uniqueEn !== "boolean" ||
    typeof result.available !== "boolean"
  ) {
    throw new Error("Invalid attendance policy name validation response");
  }
  return {
    uniqueAr: result.uniqueAr,
    uniqueEn: result.uniqueEn,
    available: result.available,
  };
}

/**
 * Fetch all policies for a term
 * Auto-migrates old period IDs to stable IDs
 */
export const fetchPolicies = async (
  yearId: string,
  termId: string,
  filters: Omit<ListPoliciesParams, "academicYearId" | "termId"> = {},
): Promise<AttendancePolicy[]> => {
  const response = await apiGet<unknown>(BASE, {
    params: compactPayload({
      academicYearId: yearId,
      termId,
      scopeType: filters.scopeType,
      classroomId: filters.classroomId,
      isActive: filters.isActive,
    }),
  });
  const policies = unwrapArray(response).map((item) =>
    mapPolicy(item, { yearId, termId }),
  );

  // Period IDs returned by the backend are already stable UUIDs in the current
  // contract. Only resolve timetable configs when an older numeric ID actually
  // needs migration; normal attendance page loads must not fan out into four
  // timetable requests.
  const hasLegacyPeriodIds = policies.some((policy) =>
    policy.selectedPeriodIds?.some((id) => /^period-\d+$/.test(id)),
  );
  if (!hasLegacyPeriodIds) return policies;

  // Auto-migrate period IDs if needed
  try {
    const configs = await fetchTimetableConfigs({
      academicYearId: yearId,
      termId,
    });
    const termConfig = configs.find((c) => c.scopeType === "TERM") || null;

    if (termConfig) {
      const { periods } = resolveTimetableConfig(termConfig);

      // Migrate each policy's selectedPeriodIds
      return policies.map((policy) => {
        if (
          !policy.selectedPeriodIds ||
          policy.selectedPeriodIds.length === 0
        ) {
          return policy;
        }

        // Check if any period ID needs migration
        const needsMigration = policy.selectedPeriodIds.some((id) =>
          id.match(/^period-\d+$/),
        );

        if (!needsMigration) {
          return policy; // Already using stable IDs
        }

        // Migrate period IDs
        const migratedIds = migratePeriodIds(policy.selectedPeriodIds, periods);

        return {
          ...policy,
          selectedPeriodIds: migratedIds,
        };
      });
    }
  } catch (error) {
    console.error("Failed to migrate period IDs:", error);
  }

  return policies;
};

export async function fetchEffectiveAttendancePolicy(
  params: EffectiveAttendancePolicyParams,
): Promise<AttendancePolicy | null> {
  const response = await apiGet<unknown>(`${BASE}/effective`, {
    params: {
      academicYearId: params.yearId,
      termId: params.termId,
      scopeType: params.scopeType,
      ...buildScopeParams(params.scopeType, params.scopeIds),
      date: params.date,
    },
  });
  const policy = asRecord(response).policy;

  return policy
    ? mapPolicy(policy, { yearId: params.yearId, termId: params.termId })
    : null;
}

/**
 * Create a new policy
 */
export const createPolicy = async (
  payload: PolicyFormData,
): Promise<AttendancePolicy> => {
  const response = await apiPost<unknown>(
    BASE,
    buildCreatePolicyPayload(payload),
  );
  return mapPolicy(response, {
    yearId: payload.yearId,
    termId: payload.termId,
  });
};

/**
 * Update an existing policy
 */
export const updatePolicy = async (
  id: string,
  payload: Partial<Omit<AttendancePolicy, "id" | "createdAt" | "updatedAt">>,
): Promise<AttendancePolicy> => {
  const response = await apiPatch<unknown>(
    `${BASE}/${id}`,
    buildPatchPolicyPayload(payload),
  );
  return mapPolicy(response, {
    yearId: payload.yearId,
    termId: payload.termId,
  });
};

/**
 * Delete a policy
 */
export const deletePolicy = async (id: string): Promise<void> => {
  await apiDelete(`${BASE}/${id}`);
};

/**
 * Effective excuse policy type
 */
export type EffectiveExcusePolicy = {
  allowExcuses: boolean;
  requireExcuseReason: boolean;
  requireAttachmentForExcuse: boolean;
  lateThresholdMinutes: number;
  earlyLeaveThresholdMinutes: number;
};

/**
 * Resolve effective excuse policy for a specific scope and date
 * Returns the most specific policy that matches the criteria
 */
export async function resolveEffectiveExcusePolicy(
  yearId: string,
  termId: string,
  scopeType: AttendanceScopeType,
  scopeIds: AttendanceScopeIds | undefined,
  dateISO: string, // YYYY-MM-DD
): Promise<EffectiveExcusePolicy | null> {
  const selectedPolicy = await fetchEffectiveAttendancePolicy({
    yearId,
    termId,
    scopeType,
    scopeIds,
    date: dateISO,
  });

  if (!selectedPolicy) {
    return null;
  }

  return {
    allowExcuses: selectedPolicy.allowExcuses,
    requireExcuseReason: selectedPolicy.requireExcuseReason,
    requireAttachmentForExcuse: selectedPolicy.requireAttachmentForExcuse,
    lateThresholdMinutes: selectedPolicy.lateThresholdMinutes ?? 15,
    earlyLeaveThresholdMinutes:
      selectedPolicy.earlyLeaveThresholdMinutes ?? 15,
  };
}
