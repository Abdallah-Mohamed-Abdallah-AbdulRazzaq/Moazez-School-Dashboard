import { apiGet, apiPost } from "@/lib/api";
import type { Decision, DecisionType } from "@/features/admissions/types/admissions";
import {
  buildQueryString,
  normalizeDecision,
  unwrapPaginatedResponse,
  unwrapItemResponse,
  type PaginatedAdmissionsResult,
} from "@/features/admissions/shared/services/admissionsApiUtils";

const DECISIONS_ENDPOINT = "/admissions/decisions";

export interface FetchDecisionsParams {
  search?: string;
  decision?: DecisionType;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface CreateDecisionPayload {
  applicationId: string;
  decision: DecisionType;
  reason: string;
}

export async function fetchDecisions(
  params: FetchDecisionsParams = {},
): Promise<PaginatedAdmissionsResult<Decision>> {
  const response = await apiGet<unknown>(
    `${DECISIONS_ENDPOINT}${buildQueryString(params)}`,
  );
  const paginatedDecisions = unwrapPaginatedResponse(response, "decisions");
  return {
    items: paginatedDecisions.items.map(normalizeDecision),
    pagination: paginatedDecisions.pagination,
  };
}

export async function fetchDecisionById(id: string): Promise<Decision> {
  const response = await apiGet<unknown>(`${DECISIONS_ENDPOINT}/${id}`);
  return normalizeDecision(unwrapItemResponse(response, "decision"));
}

export async function createDecision(
  payload: CreateDecisionPayload,
): Promise<Decision> {
  const response = await apiPost<unknown>(DECISIONS_ENDPOINT, {
    applicationId: payload.applicationId,
    decision: payload.decision,
    reason: payload.reason.trim(),
  });
  return normalizeDecision(unwrapItemResponse(response, "created decision"));
}

export function getDecisionFriendlyErrorMessage(error: unknown): string | null {
  if (!error || typeof error !== "object" || !("status" in error)) {
    return null;
  }

  const status = (error as { status?: number }).status;

  if (status === 400) {
    return "Check the selected decision and reason, then try again.";
  }

  if (status === 403) {
    return "You do not have permission to make admission decisions.";
  }

  if (status === 404) {
    return "The application could not be found.";
  }

  if (status === 409) {
    return "A decision already exists for this application.";
  }

  if (status === 422) {
    return "Complete the required test and interview before making a decision.";
  }

  return null;
}
