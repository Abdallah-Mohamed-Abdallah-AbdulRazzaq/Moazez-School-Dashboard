import { apiGet, apiPatch, apiPost } from "@/lib/api";
import type {
  CreateXpPolicyPayload,
  GetEffectiveXpPolicyParams,
  GetXpSummaryParams,
  GrantXpForReviewPayload,
  ListXpLedgerParams,
  ListXpLedgerResponse,
  ListXpPoliciesParams,
  ListXpPoliciesResponse,
  ManualXpGrantPayload,
  ManualXpGrantResponse,
  PatchXpPolicyPayload,
  XpLedgerEntry,
  XpPolicy,
  XpSummary,
} from "../types";
import {
  buildReinforcementQueryString,
  unwrapReinforcementItemResponse,
  unwrapReinforcementListResponse,
} from "./reinforcementApiUtils";

const XP_POLICIES_ENDPOINT = "/reinforcement/xp/policies";
const MANUAL_GRANTS_ENDPOINT = "/reinforcement/xp/grants/manual";
const REINFORCEMENT_REVIEW_GRANT_ENDPOINT = "/reinforcement/xp/grants/reinforcement-review";
const XP_LEDGER_ENDPOINT = "/reinforcement/xp/ledger";
const XP_SUMMARY_ENDPOINT = "/reinforcement/xp/summary";

export interface XpPolicyResponseDto {
  id: string | null;
  academicYearId: string;
  termId: string;
  scopeType: XpPolicy["scopeType"];
  scopeKey: string;
  dailyCap: number | null;
  weeklyCap: number | null;
  cooldownMinutes: number | null;
  allowedReasons: unknown;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export function mapXpPolicyResponse(dto: XpPolicyResponseDto): XpPolicy {
  const allowedReasons = Array.isArray(dto.allowedReasons)
    ? dto.allowedReasons
        .filter((reason): reason is string => typeof reason === "string")
        .map((reason) => reason.trim())
        .filter(Boolean)
    : [];

  return { ...dto, allowedReasons };
}

const optionalText = (value: string | null | undefined): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const optionalNumber = (value: number | null | undefined): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const optionalStringList = (values: string[] | undefined): string[] | undefined => {
  const cleaned = values
    ?.map((value) => value.trim())
    .filter((value) => value.length > 0);

  return cleaned?.length ? cleaned : undefined;
};

export function serializeCreateXpPolicyPayload(
  payload: CreateXpPolicyPayload,
): CreateXpPolicyPayload {
  return {
    ...(optionalText(payload.academicYearId)
      ? { academicYearId: optionalText(payload.academicYearId) }
      : {}),
    termId: payload.termId.trim(),
    scopeType: payload.scopeType,
    ...(optionalText(payload.scopeId) ? { scopeId: optionalText(payload.scopeId) } : {}),
    ...(optionalNumber(payload.dailyCap) !== undefined
      ? { dailyCap: optionalNumber(payload.dailyCap) }
      : {}),
    ...(optionalNumber(payload.weeklyCap) !== undefined
      ? { weeklyCap: optionalNumber(payload.weeklyCap) }
      : {}),
    ...(optionalNumber(payload.cooldownMinutes) !== undefined
      ? { cooldownMinutes: optionalNumber(payload.cooldownMinutes) }
      : {}),
    ...(optionalStringList(payload.allowedReasons)
      ? { allowedReasons: optionalStringList(payload.allowedReasons) }
      : {}),
    ...(optionalText(payload.startsAt) ? { startsAt: optionalText(payload.startsAt) } : {}),
    ...(optionalText(payload.endsAt) ? { endsAt: optionalText(payload.endsAt) } : {}),
    ...(typeof payload.isActive === "boolean" ? { isActive: payload.isActive } : {}),
  };
}

export function serializePatchXpPolicyPayload(
  payload: PatchXpPolicyPayload,
): PatchXpPolicyPayload {
  const serializedPayload: PatchXpPolicyPayload = {};
  const numberKeys: (keyof PatchXpPolicyPayload)[] = [
    "dailyCap",
    "weeklyCap",
    "cooldownMinutes",
  ];
  for (const key of numberKeys) {
    const value = payload[key];
    if (value === null || optionalNumber(value as number | null | undefined) !== undefined) {
      Object.assign(serializedPayload, { [key]: value });
    }
  }

  const allowedReasons = optionalStringList(payload.allowedReasons);
  if (allowedReasons) serializedPayload.allowedReasons = allowedReasons;

  for (const key of ["startsAt", "endsAt"] as const) {
    const value = payload[key];
    if (value === null) {
      serializedPayload[key] = null;
    } else if (typeof value === "string") {
      const trimmed = optionalText(value);
      if (trimmed) serializedPayload[key] = trimmed;
    }
  }

  if (typeof payload.isActive === "boolean") {
    serializedPayload.isActive = payload.isActive;
  }
  return serializedPayload;
}

export function serializeManualXpGrantPayload(
  payload: ManualXpGrantPayload,
): ManualXpGrantPayload {
  return {
    ...(optionalText(payload.academicYearId)
      ? { academicYearId: optionalText(payload.academicYearId) }
      : {}),
    termId: payload.termId.trim(),
    studentId: payload.studentId,
    ...(payload.enrollmentId === null
      ? { enrollmentId: null }
      : optionalText(payload.enrollmentId)
        ? { enrollmentId: optionalText(payload.enrollmentId) }
        : {}),
    amount: payload.amount,
    reason: payload.reason,
    ...(optionalText(payload.reasonAr) ? { reasonAr: optionalText(payload.reasonAr) } : {}),
    ...(optionalText(payload.sourceId) ? { sourceId: optionalText(payload.sourceId) } : {}),
    ...(optionalText(payload.dedupeKey)
      ? { dedupeKey: optionalText(payload.dedupeKey) }
      : {}),
  };
}

export async function listXpPolicies(
  params?: ListXpPoliciesParams,
): Promise<ListXpPoliciesResponse> {
  const query = buildReinforcementQueryString(params);
  const response = await apiGet<unknown>(`${XP_POLICIES_ENDPOINT}${query}`);
  const policyPage = unwrapReinforcementListResponse<XpPolicyResponseDto>(response);
  return { ...policyPage, items: policyPage.items.map(mapXpPolicyResponse) };
}

export async function getEffectiveXpPolicy(
  params: GetEffectiveXpPolicyParams,
): Promise<XpPolicy> {
  const query = buildReinforcementQueryString(params);
  const response = await apiGet<unknown>(
    `${XP_POLICIES_ENDPOINT}/effective${query}`,
  );
  return mapXpPolicyResponse(
    unwrapReinforcementItemResponse<XpPolicyResponseDto>(response),
  );
}

export async function createXpPolicy(
  payload: CreateXpPolicyPayload,
): Promise<XpPolicy> {
  const response = await apiPost<unknown>(
    XP_POLICIES_ENDPOINT,
    serializeCreateXpPolicyPayload(payload),
  );
  return mapXpPolicyResponse(
    unwrapReinforcementItemResponse<XpPolicyResponseDto>(response),
  );
}

export async function patchXpPolicy(
  policyId: string,
  payload: PatchXpPolicyPayload,
): Promise<XpPolicy> {
  const response = await apiPatch<unknown>(
    `${XP_POLICIES_ENDPOINT}/${policyId}`,
    serializePatchXpPolicyPayload(payload),
  );
  return mapXpPolicyResponse(
    unwrapReinforcementItemResponse<XpPolicyResponseDto>(response),
  );
}

export async function grantManualXp(
  payload: ManualXpGrantPayload,
): Promise<ManualXpGrantResponse> {
  const response = await apiPost<unknown>(
    MANUAL_GRANTS_ENDPOINT,
    serializeManualXpGrantPayload(payload),
  );
  return unwrapReinforcementItemResponse<ManualXpGrantResponse>(response);
}

export async function listXpLedger(
  params?: ListXpLedgerParams,
): Promise<ListXpLedgerResponse> {
  const query = buildReinforcementQueryString(params);
  const response = await apiGet<unknown>(`${XP_LEDGER_ENDPOINT}${query}`);
  return unwrapReinforcementListResponse<XpLedgerEntry>(response);
}

export async function getXpSummary(
  params: GetXpSummaryParams,
): Promise<XpSummary> {
  const query = buildReinforcementQueryString(params);
  const response = await apiGet<unknown>(`${XP_SUMMARY_ENDPOINT}${query}`);
  return unwrapReinforcementItemResponse<XpSummary>(response);
}

export async function grantXpForReinforcementReview(
  submissionId: string,
  payload: GrantXpForReviewPayload,
): Promise<ManualXpGrantResponse> {
  const response = await apiPost<unknown>(
    `${REINFORCEMENT_REVIEW_GRANT_ENDPOINT}/${submissionId}`,
    payload,
  );
  return unwrapReinforcementItemResponse<ManualXpGrantResponse>(response);
}
