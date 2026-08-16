import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import { isApiError } from "@/lib/api-error";
import type { AttendancePolicy } from "@/features/attendance/policies/types";
import { fetchPolicies } from "@/features/attendance/policies/services/attendancePolicyService";
import {
  getExcusePolicyIssue,
  resolveEffectiveExcuseAttendancePolicy,
} from "../utils/excusePolicyValidation";
import type {
  ExcuseRequest,
  ExcuseRequestFilters,
  ExcuseValidationErrors,
  ExcuseScopeType,
  ExcuseStatus,
} from "../types";
import type { AttendanceScopeIds } from "@/features/attendance/shared/attendanceScope";
import { getNewAttachmentFileIds } from "../utils/excuseAttachmentDiff";

type BackendRecord = Record<string, unknown>;

const BASE = "/attendance/excuse-requests";

function asRecord(value: unknown): BackendRecord {
  return value && typeof value === "object" ? (value as BackendRecord) : {};
}

function omitUndefined<T extends Record<string, unknown>>(payload: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined)
  ) as Partial<T>;
}

function normalizeReason(value: string | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function normalizePatchedReason(value: string | undefined): string | null | undefined {
  return value === undefined ? undefined : normalizeReason(value);
}

function unwrapArray(response: unknown): unknown[] {
  if (Array.isArray(response)) return response;
  const object = asRecord(response);
  for (const key of ["items", "data", "requests", "excuseRequests"]) {
    if (Array.isArray(object[key])) return object[key] as unknown[];
  }
  return [];
}

function unwrapObject(response: unknown): BackendRecord {
  const object = asRecord(response);
  for (const key of ["request", "excuseRequest", "data"]) {
    const nested = object[key];
    if (nested && typeof nested === "object" && !Array.isArray(nested)) return nested as BackendRecord;
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

function getNumber(object: BackendRecord, keys: string[]) {
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

function normalizeStatus(value: unknown): ExcuseStatus {
  return String(value || "PENDING").toUpperCase() as ExcuseStatus;
}

function normalizeDateRange(object: BackendRecord) {
  const dateFrom = getString(object, ["dateFrom", "fromDate", "date"], "");
  const dateTo = getString(object, ["dateTo", "toDate", "date"], dateFrom);
  return { dateFrom: dateFrom.slice(0, 10), dateTo: dateTo.slice(0, 10) };
}

function mapAttachments(value: unknown): ExcuseRequest["attachments"] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const object = asRecord(item);
    return {
      id: getString(object, ["fileId", "id", "attachmentId"]),
      attachmentId: getOptionalString(object, ["id", "attachmentId"]),
      name: getString(object, ["originalName", "name", "filename", "title"]),
      size: getNumber(object, ["size", "sizeBytes"]) || 0,
      type: getString(object, ["type", "mimeType"], "application/octet-stream"),
      url: getOptionalString(object, ["url", "downloadUrl"]),
    };
  });
}

function mapRequest(item: unknown, fallback?: { yearId?: string; termId?: string }): ExcuseRequest {
  const object = unwrapObject(item);
  const student = asRecord(object.student);
  const { dateFrom, dateTo } = normalizeDateRange(object);
  const reason = getString(object, ["reason", "reasonEn", "reasonAr"]);
  const studentNameEn = getString(
    object,
    ["studentNameEn", "studentName", "nameEn", "displayNameEn"],
    getString(student, ["fullNameEn", "name", "firstName"]),
  );
  const studentNameAr = getString(
    object,
    ["studentNameAr", "nameAr", "displayNameAr"],
    getString(student, ["fullNameAr", "name"], studentNameEn),
  );
  const attachments = mapAttachments(object.attachments);
  const selectedPeriodIds = Array.isArray(object.selectedPeriodIds)
    ? (object.selectedPeriodIds as string[])
    : Array.isArray(object.selectedPeriodKeys)
      ? (object.selectedPeriodKeys as string[])
      : undefined;

  return {
    id: getString(object, ["id", "requestId", "excuseRequestId"]),
    yearId: getString(object, ["yearId", "academicYearId"], fallback?.yearId || ""),
    termId: getString(object, ["termId"], fallback?.termId || ""),
    studentId: getString(object, ["studentId"]),
    studentNameAr,
    studentNameEn,
    studentNumber:
      getOptionalString(object, ["studentNumber", "admissionNo", "studentCode"]) ||
      getOptionalString(student, ["studentNumber"]),
    // The current backend stores excuse requests at school scope and does not
    // support scope fields in its request or response contract.
    scopeType: "SCHOOL",
    scopeIds: {},
    hasScopeContext: true,
    type: String(object.type || "ABSENCE").toUpperCase() as ExcuseRequest["type"],
    dateFrom,
    dateTo,
    selectedPeriodIds,
    periodIndexes: Array.isArray(object.periodIndexes) ? (object.periodIndexes as number[]) : undefined,
    minutesLate: getNumber(object, ["minutesLate", "lateMinutes"]),
    minutesEarlyLeave: getNumber(object, ["minutesEarlyLeave", "earlyLeaveMinutes"]),
    reasonAr: getString(object, ["reasonAr", "reason"], reason),
    reasonEn: getString(object, ["reasonEn", "reason"], reason),
    attachments,
    attachmentCount: getNumber(object, ["attachmentCount"]) ?? attachments.length,
    status: normalizeStatus(object.status),
    decisionNote: getOptionalString(object, ["decisionNote", "reviewNote"]),
    decidedAt: getOptionalString(object, ["decidedAt", "reviewedAt"]),
    decidedBy: getOptionalString(object, ["decidedBy", "reviewedBy"]),
    createdById: getOptionalString(object, ["createdById"]),
    decidedById: getOptionalString(object, ["decidedById"]),
    createdAt: getString(object, ["createdAt"], new Date().toISOString()),
    updatedAt: getString(object, ["updatedAt"], new Date().toISOString()),
    linkedSessionIds: Array.isArray(object.linkedSessionIds) ? (object.linkedSessionIds as string[]) : undefined,
  };
}

function buildRequestPayload(payload: Partial<ExcuseRequest>) {
  return omitUndefined({
    academicYearId: payload.yearId,
    termId: payload.termId,
    studentId: payload.studentId,
    type: payload.type,
    dateFrom: payload.dateFrom,
    dateTo: payload.dateTo,
    selectedPeriodKeys: payload.selectedPeriodIds,
    lateMinutes: payload.minutesLate,
    earlyLeaveMinutes: payload.minutesEarlyLeave,
    reasonAr: normalizeReason(payload.reasonAr),
    reasonEn: normalizeReason(payload.reasonEn),
  });
}

function buildUpdatePayload(payload: Partial<ExcuseRequest>) {
  return omitUndefined({
    type: payload.type,
    dateFrom: payload.dateFrom,
    dateTo: payload.dateTo,
    selectedPeriodKeys: payload.selectedPeriodIds,
    lateMinutes: payload.minutesLate,
    earlyLeaveMinutes: payload.minutesEarlyLeave,
    reasonAr: normalizePatchedReason(payload.reasonAr),
    reasonEn: normalizePatchedReason(payload.reasonEn),
  });
}

export async function linkExcuseRequestAttachments(
  requestId: string,
  fileIds: string[],
) {
  if (fileIds.length === 0) return;
  await apiPost(`${BASE}/${requestId}/attachments`, { fileIds });
}

export class ExcuseAttachmentLinkError extends Error {
  constructor(
    public readonly request: ExcuseRequest,
    public readonly fileIds: string[],
    options?: ErrorOptions,
  ) {
    super("Excuse request was saved, but its attachments could not be linked", options);
    this.name = "ExcuseAttachmentLinkError";
  }
}

export async function fetchExcuseRequests(
  params: { yearId: string; termId: string } & Partial<ExcuseRequestFilters>
): Promise<ExcuseRequest[]> {
  const response = await apiGet<unknown>(BASE, {
    params: {
      academicYearId: params.yearId,
      termId: params.termId,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      status: params.status && params.status !== "ALL" ? params.status : undefined,
      type: params.type && params.type !== "ALL" ? params.type : undefined,
      search: params.search || undefined,
    },
  });

  return unwrapArray(response)
    .map((item) => mapRequest(item, params))
    .filter((request) => {
      const attachmentCount = request.attachmentCount ?? request.attachments.length;
      if (params.hasAttachment === "YES") return attachmentCount > 0;
      if (params.hasAttachment === "NO") return attachmentCount === 0;
      return true;
    });
}

export async function fetchExcuseRequestDetails(
  id: string,
): Promise<ExcuseRequest> {
  const response = await apiGet<unknown>(`${BASE}/${id}`);
  const request = mapRequest(response);
  if ((request.attachmentCount || 0) <= request.attachments.length) return request;

  const attachmentsResponse = await apiGet<unknown>(`${BASE}/${id}/attachments`);
  const attachments = mapAttachments(unwrapArray(attachmentsResponse));
  return {
    ...request,
    attachments,
    attachmentCount: Math.max(request.attachmentCount || 0, attachments.length),
  };
}

export async function createExcuseRequest(
  payload: Omit<
    ExcuseRequest,
    "id" | "status" | "createdAt" | "updatedAt" | "decidedAt" | "decidedBy" | "decisionNote" | "linkedSessionIds"
  >
): Promise<ExcuseRequest> {
  const response = await apiPost<unknown>(BASE, buildRequestPayload(payload));
  const request = mapRequest(response, { yearId: payload.yearId, termId: payload.termId });
  const fileIds = getNewAttachmentFileIds(payload.attachments, []);
  try {
    await linkExcuseRequestAttachments(request.id, fileIds);
  } catch (error) {
    throw new ExcuseAttachmentLinkError(request, fileIds, { cause: error });
  }
  return request;
}

export async function updateExcuseRequest(
  id: string,
  payload: Partial<Omit<ExcuseRequest, "id" | "yearId" | "termId" | "createdAt" | "status" | "decidedAt" | "decidedBy">>,
  initialAttachments: ExcuseRequest["attachments"] = [],
): Promise<ExcuseRequest> {
  const response = await apiPatch<unknown>(`${BASE}/${id}`, buildUpdatePayload(payload));
  const request = mapRequest(response);
  const fileIds = getNewAttachmentFileIds(
    payload.attachments || [],
    initialAttachments,
  );
  const currentFileIds = new Set(
    (payload.attachments || []).map((attachment) => attachment.id),
  );
  const removedAttachmentIds = initialAttachments.flatMap((attachment) =>
    attachment.attachmentId && !currentFileIds.has(attachment.id)
      ? [attachment.attachmentId]
      : [],
  );
  await Promise.all(
    removedAttachmentIds.map((attachmentId) =>
      apiDelete(`${BASE}/${id}/attachments/${attachmentId}`),
    ),
  );
  try {
    await linkExcuseRequestAttachments(id, fileIds);
  } catch (error) {
    throw new ExcuseAttachmentLinkError(request, fileIds, { cause: error });
  }
  return request;
}

export async function deleteExcuseRequest(id: string): Promise<void> {
  await apiDelete(`${BASE}/${id}`);
}

export async function approveExcuseRequest(id: string, decisionNote?: string, decidedBy?: string) {
  void decidedBy;

  try {
    const response = await apiPost<unknown>(`${BASE}/${id}/approve`, { decisionNote });
    return mapRequest(response);
  } catch (error) {
    if (
      isApiError(error) &&
      error.code === "validation.failed" &&
      error.message === "No matching submitted attendance entry exists for this excuse"
    ) {
      throw new ExcuseApprovalEligibilityError(id, { cause: error });
    }
    throw error;
  }
}

export class ExcuseApprovalEligibilityError extends Error {
  constructor(
    public readonly excuseRequestId: string,
    options?: ErrorOptions,
  ) {
    super("No matching submitted attendance entry exists for this excuse", options);
    this.name = "ExcuseApprovalEligibilityError";
  }
}

export async function rejectExcuseRequest(id: string, decisionNote?: string, decidedBy?: string) {
  void decidedBy;

  const response = await apiPost<unknown>(`${BASE}/${id}/reject`, { decisionNote });
  return mapRequest(response);
}

export async function validateExcuseRequest(
  payload: Partial<ExcuseRequest>,
  effectivePolicy: AttendancePolicy | null,
  termRange: { startDate: string; endDate: string }
): Promise<ExcuseValidationErrors> {
  const errors: ExcuseValidationErrors = {};

  if (!payload.studentId) errors.studentId = "Student is required";
  if (!payload.type) errors.type = "Type is required";
  if (!payload.dateFrom) errors.dateFrom = "Start date is required";
  if (!payload.dateTo) errors.dateTo = "End date is required";
  if (payload.dateFrom && payload.dateTo && payload.dateFrom > payload.dateTo) {
    errors.dateTo = "End date must be after start date";
  }
  if (payload.dateFrom && (payload.dateFrom < termRange.startDate || payload.dateFrom > termRange.endDate)) {
    errors.dateFrom = "Date must be within term range";
  }
  if (payload.dateTo && (payload.dateTo < termRange.startDate || payload.dateTo > termRange.endDate)) {
    errors.dateTo = "Date must be within term range";
  }

  const reasonAr = payload.reasonAr?.trim() || "";
  const reasonEn = payload.reasonEn?.trim() || "";
  if (effectivePolicy?.requireExcuseReason && !reasonAr && !reasonEn) {
    errors.reason = "At least one reason language is required";
  }

  if (payload.type === "LATE" || payload.type === "EARLY_LEAVE") {
    const hasPeriods = (payload.selectedPeriodIds && payload.selectedPeriodIds.length > 0) ||
      (payload.periodIndexes && payload.periodIndexes.length > 0);
    if (!hasPeriods) errors.selectedPeriodIds = "Period selection is required for late/early leave requests";
  }

  if (payload.type === "LATE") {
    if (payload.minutesLate === undefined || payload.minutesLate === null) {
      errors.minutesLate = "Minutes late is required";
    } else if (payload.minutesLate <= 0) {
      errors.minutesLate = "Minutes late must be greater than 0";
    }
  }

  if (payload.type === "EARLY_LEAVE") {
    if (payload.minutesEarlyLeave === undefined || payload.minutesEarlyLeave === null) {
      errors.minutesEarlyLeave = "Minutes early leave is required";
    } else if (payload.minutesEarlyLeave <= 0) {
      errors.minutesEarlyLeave = "Minutes early leave must be greater than 0";
    }
  }

  if (effectivePolicy && !effectivePolicy.allowExcuses) {
    errors.policy = "Excuses are disabled by policy";
  }
  if (effectivePolicy?.requireAttachmentForExcuse && (payload.attachments?.length || 0) === 0) {
    errors.attachments = "Attachment is required by policy";
  }

  return errors;
}

export async function validateExcusePolicyRange(
  payload: Pick<ExcuseRequest, "yearId" | "termId" | "dateFrom" | "dateTo" | "scopeType" | "scopeIds" | "attachments" | "reasonAr" | "reasonEn">
) {
  const policies = await fetchPolicies(payload.yearId, payload.termId);
  return getExcusePolicyIssue(payload, policies);
}

export async function resolveRequestPolicy(
  yearId: string,
  termId: string,
  scopeType: ExcuseScopeType,
  scopeIds: AttendanceScopeIds | undefined,
  date: string
): Promise<AttendancePolicy | null> {
  const policies = await fetchPolicies(yearId, termId);
  return resolveEffectiveExcuseAttendancePolicy(policies, date, scopeType, scopeIds);
}
