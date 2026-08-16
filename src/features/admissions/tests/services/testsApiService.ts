import { apiGet, apiPatch, apiPost } from "@/lib/api";
import type { Test } from "@/features/admissions/types/admissions";
import {
  buildQueryString,
  normalizeTest,
  toIsoFromDateAndTime,
  unwrapPaginatedResponse,
  unwrapItemResponse,
  type PaginatedAdmissionsResult,
} from "@/features/admissions/shared/services/admissionsApiUtils";

const TESTS_ENDPOINT = "/admissions/tests";

export interface FetchPlacementTestsParams {
  search?: string;
  status?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface CreatePlacementTestPayload {
  applicationId: string;
  subjectId: string;
  type?: string;
  scheduledAt?: string;
  date?: string;
  time?: string;
}

export interface CompletePlacementTestPayload {
  status?: string;
  score?: number;
  result?: string;
}

export interface UpdatePlacementTestPayload extends CompletePlacementTestPayload {
  scheduledAt?: string;
  date?: string;
  time?: string;
}

const toCreateBody = (payload: CreatePlacementTestPayload) => ({
  applicationId: payload.applicationId,
  subjectId: payload.subjectId,
  type: payload.type || "Placement Test",
  scheduledAt:
    payload.scheduledAt || toIsoFromDateAndTime(payload.date || "", payload.time || ""),
});

export async function fetchPlacementTests(
  params: FetchPlacementTestsParams = {},
): Promise<PaginatedAdmissionsResult<Test>> {
  const response = await apiGet<unknown>(
    `${TESTS_ENDPOINT}${buildQueryString(params)}`,
  );
  const paginatedTests = unwrapPaginatedResponse(response, "placement tests");
  return {
    items: paginatedTests.items.map(normalizeTest),
    pagination: paginatedTests.pagination,
  };
}

export async function fetchPlacementTestById(id: string): Promise<Test> {
  const response = await apiGet<unknown>(`${TESTS_ENDPOINT}/${id}`);
  const item = unwrapItemResponse(response, "placement test");
  return normalizeTest(item);
}

export async function createPlacementTest(
  payload: CreatePlacementTestPayload,
): Promise<Test> {
  const response = await apiPost<unknown>(TESTS_ENDPOINT, toCreateBody(payload));
  return normalizeTest(unwrapItemResponse(response, "created placement test"));
}

export async function updatePlacementTest(
  id: string,
  payload: UpdatePlacementTestPayload,
): Promise<Test> {
  const body = {
    ...payload,
    scheduledAt:
      payload.scheduledAt ||
      (payload.date || payload.time
        ? toIsoFromDateAndTime(payload.date || "", payload.time || "")
        : undefined),
    date: undefined,
    time: undefined,
  };
  const response = await apiPatch<unknown>(`${TESTS_ENDPOINT}/${id}`, body);
  return normalizeTest(unwrapItemResponse(response, "updated placement test"));
}

export async function completePlacementTest(
  id: string,
  payload: CompletePlacementTestPayload,
): Promise<Test> {
  const response = await apiPatch<unknown>(`${TESTS_ENDPOINT}/${id}`, {
    status: "completed",
    score: payload.score,
    result: payload.result,
  });
  return normalizeTest(unwrapItemResponse(response, "completed placement test"));
}
