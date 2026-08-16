import { apiGet, apiPatch, apiPost } from "@/lib/api";
import type {
  ArchiveRewardCatalogItemPayload,
  CreateRewardCatalogItemPayload,
  ListRewardCatalogParams,
  RewardCatalogItem,
  UpdateRewardCatalogItemPayload,
} from "../types";
import type { ReinforcementListResponse } from "../types";
import {
  buildReinforcementQueryString,
  unwrapReinforcementItemResponse,
  unwrapReinforcementListResponse,
} from "./reinforcementApiUtils";

const REWARD_CATALOG_ENDPOINT = "/reinforcement/rewards/catalog";

export async function listRewardCatalog(
  params?: ListRewardCatalogParams,
): Promise<ReinforcementListResponse<RewardCatalogItem>> {
  const query = buildReinforcementQueryString(params);
  const response = await apiGet<unknown>(`${REWARD_CATALOG_ENDPOINT}${query}`);
  return unwrapReinforcementListResponse<RewardCatalogItem>(response);
}

export async function getRewardCatalogItem(
  rewardId: string,
): Promise<RewardCatalogItem> {
  const response = await apiGet<unknown>(
    `${REWARD_CATALOG_ENDPOINT}/${rewardId}`,
  );
  return unwrapReinforcementItemResponse<RewardCatalogItem>(response);
}

export async function createRewardCatalogItem(
  payload: CreateRewardCatalogItemPayload,
): Promise<RewardCatalogItem> {
  const response = await apiPost<unknown>(REWARD_CATALOG_ENDPOINT, payload);
  return unwrapReinforcementItemResponse<RewardCatalogItem>(response);
}

export async function updateRewardCatalogItem(
  rewardId: string,
  payload: UpdateRewardCatalogItemPayload,
): Promise<RewardCatalogItem> {
  const response = await apiPatch<unknown>(
    `${REWARD_CATALOG_ENDPOINT}/${rewardId}`,
    payload,
  );
  return unwrapReinforcementItemResponse<RewardCatalogItem>(response);
}

export async function publishRewardCatalogItem(
  rewardId: string,
): Promise<RewardCatalogItem> {
  const response = await apiPost<unknown>(
    `${REWARD_CATALOG_ENDPOINT}/${rewardId}/publish`,
    {},
  );
  return unwrapReinforcementItemResponse<RewardCatalogItem>(response);
}

export async function archiveRewardCatalogItem(
  rewardId: string,
  payload: ArchiveRewardCatalogItemPayload,
): Promise<RewardCatalogItem> {
  const response = await apiPost<unknown>(
    `${REWARD_CATALOG_ENDPOINT}/${rewardId}/archive`,
    payload,
  );
  return unwrapReinforcementItemResponse<RewardCatalogItem>(response);
}
