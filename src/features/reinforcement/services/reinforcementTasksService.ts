import { apiGet, apiPost } from "@/lib/api";
import type {
  CancelReinforcementTaskPayload,
  CreateReinforcementTaskPayload,
  DuplicateReinforcementTaskPayload,
  ListReinforcementTasksParams,
  ListReinforcementTasksResponse,
  ReinforcementTargetPayload,
  ReinforcementTargetScope,
  ReinforcementTask,
} from "../types";
import {
  buildReinforcementQueryString,
  unwrapReinforcementItemResponse,
  unwrapReinforcementListResponse,
} from "./reinforcementApiUtils";

const TASKS_ENDPOINT = "/reinforcement/tasks";
const SUPPORTED_TARGET_SCOPES: ReinforcementTargetScope[] = [
  "school",
  "stage",
  "grade",
  "section",
  "classroom",
  "student",
];

const optionalText = (value?: string): string | undefined => {
  const trimmed = value?.trim();
  return trimmed || undefined;
};

const textFromUnknown = (value: unknown): string | undefined =>
  typeof value === "string" ? optionalText(value) : undefined;

const optionalRewardValue = (
  value?: CreateReinforcementTaskPayload["rewardValue"],
): CreateReinforcementTaskPayload["rewardValue"] | undefined => {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : undefined;
};

const normalizeTargetScope = (
  scope: unknown,
): ReinforcementTargetScope | undefined => {
  const normalized = textFromUnknown(scope)?.toLowerCase();
  return SUPPORTED_TARGET_SCOPES.find((item) => item === normalized);
};

const scopeIdForTarget = (
  target: Partial<Record<string, unknown>>,
  scopeType: ReinforcementTargetScope,
): string | undefined => {
  const scopedKey = `${scopeType}Id`;
  return (
    textFromUnknown(target.scopeId) ||
    textFromUnknown(target[scopedKey]) ||
    textFromUnknown(target.id) ||
    textFromUnknown(target.value)
  );
};

export function normalizeReinforcementTaskTargets(
  targets: ReadonlyArray<unknown>,
): ReinforcementTargetPayload[] {
  return targets.reduce<ReinforcementTargetPayload[]>((normalized, target) => {
    if (!target || typeof target !== "object") return normalized;

    const record = target as Partial<Record<string, unknown>>;
    const scopeType = normalizeTargetScope(record.scopeType || record.scope);
    if (!scopeType) return normalized;

    const scopeId = scopeIdForTarget(record, scopeType);
    if (!scopeId) return normalized;

    normalized.push({ scopeType, scopeId });
    return normalized;
  }, []);
}

export function serializeCreateReinforcementTaskPayload(
  payload: CreateReinforcementTaskPayload,
): CreateReinforcementTaskPayload {
  const academicYearId = optionalText(payload.academicYearId);
  const termId = payload.termId.trim();
  const subjectId = optionalText(payload.subjectId);
  const descriptionEn = optionalText(payload.descriptionEn);
  const descriptionAr = optionalText(payload.descriptionAr);
  const rewardValue = optionalRewardValue(payload.rewardValue);
  const rewardLabelEn = optionalText(payload.rewardLabelEn);
  const rewardLabelAr = optionalText(payload.rewardLabelAr);

  return {
    ...(academicYearId ? { academicYearId } : {}),
    termId,
    ...(subjectId ? { subjectId } : {}),
    titleEn: payload.titleEn,
    titleAr: payload.titleAr,
    ...(descriptionEn ? { descriptionEn } : {}),
    ...(descriptionAr ? { descriptionAr } : {}),
    source: payload.source,
    rewardType: payload.rewardType,
    ...(rewardValue !== undefined ? { rewardValue } : {}),
    ...(rewardLabelEn ? { rewardLabelEn } : {}),
    ...(rewardLabelAr ? { rewardLabelAr } : {}),
    dueDate: payload.dueDate,
    targets: normalizeReinforcementTaskTargets(payload.targets),
    stages: payload.stages.map((stage) => {
      const stageDescriptionEn = optionalText(stage.descriptionEn);
      const stageDescriptionAr = optionalText(stage.descriptionAr);

      return {
        sortOrder: stage.sortOrder,
        titleEn: stage.titleEn,
        titleAr: stage.titleAr,
        ...(stageDescriptionEn ? { descriptionEn: stageDescriptionEn } : {}),
        ...(stageDescriptionAr ? { descriptionAr: stageDescriptionAr } : {}),
        proofType: stage.proofType,
        ...(typeof stage.requiresApproval === "boolean"
          ? { requiresApproval: stage.requiresApproval }
          : {}),
      };
    }),
  };
}

export async function listReinforcementTasks(
  params?: ListReinforcementTasksParams,
): Promise<ListReinforcementTasksResponse> {
  const query = buildReinforcementQueryString(params);
  const response = await apiGet<unknown>(`${TASKS_ENDPOINT}${query}`);
  return unwrapReinforcementListResponse<ReinforcementTask>(response);
}

export async function createReinforcementTask(
  payload: CreateReinforcementTaskPayload,
): Promise<ReinforcementTask> {
  const response = await apiPost<unknown>(
    TASKS_ENDPOINT,
    serializeCreateReinforcementTaskPayload(payload),
  );
  return unwrapReinforcementItemResponse<ReinforcementTask>(response);
}

export async function getReinforcementTask(
  taskId: string,
): Promise<ReinforcementTask> {
  const response = await apiGet<unknown>(`${TASKS_ENDPOINT}/${taskId}`);
  return unwrapReinforcementItemResponse<ReinforcementTask>(response);
}

export async function duplicateReinforcementTask(
  taskId: string,
  payload: DuplicateReinforcementTaskPayload,
): Promise<ReinforcementTask> {
  const response = await apiPost<unknown>(
    `${TASKS_ENDPOINT}/${taskId}/duplicate`,
    payload,
  );
  return unwrapReinforcementItemResponse<ReinforcementTask>(response);
}

export async function cancelReinforcementTask(
  taskId: string,
  payload: CancelReinforcementTaskPayload,
): Promise<ReinforcementTask> {
  const response = await apiPost<unknown>(
    `${TASKS_ENDPOINT}/${taskId}/cancel`,
    serializeCancelReinforcementTaskPayload(payload),
  );
  return unwrapReinforcementItemResponse<ReinforcementTask>(response);
}

export function serializeCancelReinforcementTaskPayload(
  payload: CancelReinforcementTaskPayload,
): CancelReinforcementTaskPayload {
  const reason = optionalText(payload.reason);
  return reason ? { reason } : {};
}
