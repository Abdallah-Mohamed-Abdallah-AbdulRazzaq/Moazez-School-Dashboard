import { apiGet, apiPost } from "@/lib/api";
import type {
  ApproveRewardRedemptionPayload,
  CancelRewardRedemptionPayload,
  CreateRewardRedemptionPayload,
  FulfillRewardRedemptionPayload,
  ListRewardRedemptionsParams,
  RejectRewardRedemptionPayload,
  RewardRedemption,
} from "../types";
import type { ReinforcementListResponse } from "../types";
import {
  buildReinforcementQueryString,
  unwrapReinforcementItemResponse,
  unwrapReinforcementListResponse,
} from "./reinforcementApiUtils";

const REWARD_REDEMPTIONS_ENDPOINT = "/reinforcement/rewards/redemptions";

export async function listRewardRedemptions(
  params?: ListRewardRedemptionsParams,
): Promise<ReinforcementListResponse<RewardRedemption>> {
  const query = buildReinforcementQueryString(params);
  const response = await apiGet<unknown>(
    `${REWARD_REDEMPTIONS_ENDPOINT}${query}`,
  );
  return unwrapReinforcementListResponse<RewardRedemption>(response);
}

export async function getRewardRedemption(
  redemptionId: string,
): Promise<RewardRedemption> {
  const response = await apiGet<unknown>(
    `${REWARD_REDEMPTIONS_ENDPOINT}/${redemptionId}`,
  );
  return unwrapReinforcementItemResponse<RewardRedemption>(response);
}

export async function createRewardRedemption(
  payload: CreateRewardRedemptionPayload,
): Promise<RewardRedemption> {
  const response = await apiPost<unknown>(
    REWARD_REDEMPTIONS_ENDPOINT,
    payload,
  );
  return unwrapReinforcementItemResponse<RewardRedemption>(response);
}

export async function cancelRewardRedemption(
  redemptionId: string,
  payload: CancelRewardRedemptionPayload,
): Promise<RewardRedemption> {
  const response = await apiPost<unknown>(
    `${REWARD_REDEMPTIONS_ENDPOINT}/${redemptionId}/cancel`,
    payload,
  );
  return unwrapReinforcementItemResponse<RewardRedemption>(response);
}

export async function approveRewardRedemption(
  redemptionId: string,
  payload: ApproveRewardRedemptionPayload,
): Promise<RewardRedemption> {
  const response = await apiPost<unknown>(
    `${REWARD_REDEMPTIONS_ENDPOINT}/${redemptionId}/approve`,
    payload,
  );
  return unwrapReinforcementItemResponse<RewardRedemption>(response);
}

export async function rejectRewardRedemption(
  redemptionId: string,
  payload: RejectRewardRedemptionPayload,
): Promise<RewardRedemption> {
  const response = await apiPost<unknown>(
    `${REWARD_REDEMPTIONS_ENDPOINT}/${redemptionId}/reject`,
    payload,
  );
  return unwrapReinforcementItemResponse<RewardRedemption>(response);
}

export async function fulfillRewardRedemption(
  redemptionId: string,
  payload: FulfillRewardRedemptionPayload,
): Promise<RewardRedemption> {
  const response = await apiPost<unknown>(
    `${REWARD_REDEMPTIONS_ENDPOINT}/${redemptionId}/fulfill`,
    payload,
  );
  return unwrapReinforcementItemResponse<RewardRedemption>(response);
}
