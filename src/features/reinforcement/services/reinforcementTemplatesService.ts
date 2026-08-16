import { apiGet, apiPost } from "@/lib/api";
import type {
  CreateReinforcementTemplatePayload,
  CreateReinforcementTemplateRequest,
  ListReinforcementTemplatesParams,
  ListReinforcementTemplatesResponse,
  ReinforcementTemplate,
} from "../types";
import {
  buildReinforcementQueryString,
  unwrapReinforcementItemResponse,
  unwrapReinforcementListResponse,
} from "./reinforcementApiUtils";

const TEMPLATES_ENDPOINT = "/reinforcement/templates";

const optionalText = (value?: string): string | undefined => {
  const trimmed = value?.trim();
  return trimmed || undefined;
};

const optionalRewardValue = (value?: string | number): number | undefined => {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;

  const trimmed = optionalText(value);
  if (!trimmed) return undefined;

  const numberValue = Number(trimmed);
  return Number.isFinite(numberValue) ? numberValue : undefined;
};

export function serializeCreateReinforcementTemplatePayload(
  payload: CreateReinforcementTemplatePayload,
): CreateReinforcementTemplateRequest {
  const descriptionEn = optionalText(payload.descriptionEn);
  const descriptionAr = optionalText(payload.descriptionAr);
  
  const rewardValue = optionalRewardValue(payload.reward.value);
  const rewardLabelEn = optionalText(payload.reward.labelEn);
  const rewardLabelAr = optionalText(payload.reward.labelAr);

  return {
    nameEn: payload.nameEn,
    nameAr: payload.nameAr,
    ...(descriptionEn ? { descriptionEn } : {}),
    ...(descriptionAr ? { descriptionAr } : {}),
    source: payload.source,
    rewardType: payload.reward.type,
    ...(rewardValue !== undefined ? { rewardValue } : {}),
    ...(rewardLabelEn ? { rewardLabelEn } : {}),
    ...(rewardLabelAr ? { rewardLabelAr } : {}),
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

export async function listReinforcementTemplates(
  params?: ListReinforcementTemplatesParams,
): Promise<ListReinforcementTemplatesResponse> {
  const query = buildReinforcementQueryString(params);
  const response = await apiGet<unknown>(`${TEMPLATES_ENDPOINT}${query}`);
  return unwrapReinforcementListResponse<ReinforcementTemplate>(response);
}

export async function createReinforcementTemplate(
  payload: CreateReinforcementTemplatePayload,
): Promise<ReinforcementTemplate> {
  const response = await apiPost<unknown>(
    TEMPLATES_ENDPOINT,
    serializeCreateReinforcementTemplatePayload(payload),
  );
  return unwrapReinforcementItemResponse<ReinforcementTemplate>(response);
}
