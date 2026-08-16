import { apiGet } from "@/lib/api";
import type {
  ReinforcementFilterOptions,
  ReinforcementFilterOptionsParams,
} from "../types";
import {
  buildReinforcementQueryString,
  unwrapReinforcementItemResponse,
} from "./reinforcementApiUtils";

const FILTER_OPTIONS_ENDPOINT = "/reinforcement/filter-options";

export async function getReinforcementFilterOptions(
  params?: ReinforcementFilterOptionsParams,
): Promise<ReinforcementFilterOptions> {
  const query = buildReinforcementQueryString(params);
  const response = await apiGet<unknown>(`${FILTER_OPTIONS_ENDPOINT}${query}`);
  return unwrapReinforcementItemResponse<ReinforcementFilterOptions>(response);
}
