import { apiGet } from "@/lib/api";
import type {
  RewardCatalogSummaryParams,
  RewardsOverviewParams,
  StudentRewardsSummaryParams,
} from "../types";
import {
  buildReinforcementQueryString,
  unwrapReinforcementItemResponse,
} from "./reinforcementApiUtils";

const REWARDS_ENDPOINT = "/reinforcement/rewards";

export async function getRewardsOverview(
  params?: RewardsOverviewParams,
): Promise<Record<string, unknown>> {
  const query = buildReinforcementQueryString(params);
  const response = await apiGet<unknown>(`${REWARDS_ENDPOINT}/overview${query}`);
  return unwrapReinforcementItemResponse<Record<string, unknown>>(response);
}

export async function getStudentRewardsSummary(
  studentId: string,
  params?: StudentRewardsSummaryParams,
): Promise<Record<string, unknown>> {
  const query = buildReinforcementQueryString(params);
  const response = await apiGet<unknown>(
    `${REWARDS_ENDPOINT}/students/${studentId}/summary${query}`,
  );
  return unwrapReinforcementItemResponse<Record<string, unknown>>(response);
}

export async function getRewardCatalogSummary(
  params?: RewardCatalogSummaryParams,
): Promise<Record<string, unknown>> {
  const query = buildReinforcementQueryString(params);
  const response = await apiGet<unknown>(
    `${REWARDS_ENDPOINT}/catalog-summary${query}`,
  );
  return unwrapReinforcementItemResponse<Record<string, unknown>>(response);
}
