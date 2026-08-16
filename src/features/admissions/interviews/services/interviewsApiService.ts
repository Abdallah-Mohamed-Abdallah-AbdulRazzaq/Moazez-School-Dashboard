import { apiGet, apiPatch, apiPost } from "@/lib/api";
import type { Interview } from "@/features/admissions/types/admissions";
import {
  buildQueryString,
  normalizeInterview,
  toIsoFromDateAndTime,
  unwrapPaginatedResponse,
  unwrapItemResponse,
  type PaginatedAdmissionsResult,
} from "@/features/admissions/shared/services/admissionsApiUtils";

const INTERVIEWS_ENDPOINT = "/admissions/interviews";

export interface FetchInterviewsParams {
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface CreateInterviewPayload {
  applicationId: string;
  scheduledAt?: string;
  date?: string;
  time?: string;
  interviewerUserId?: string;
  interviewerName?: string;
  notes?: string;
}

export interface CompleteInterviewPayload {
  status?: string;
  notes?: string;
}

export type UpdateInterviewPayload = Partial<
  CreateInterviewPayload & CompleteInterviewPayload
>;

const toCreateBody = (payload: CreateInterviewPayload) => {
  return {
    applicationId: payload.applicationId,
    scheduledAt:
      payload.scheduledAt ||
      toIsoFromDateAndTime(payload.date || "", payload.time || ""),
    interviewerUserId: payload.interviewerUserId || undefined,
    interviewerName: payload.interviewerName || undefined,
    notes: payload.notes || undefined,
  };
};

export async function fetchInterviews(
  params: FetchInterviewsParams = {},
): Promise<PaginatedAdmissionsResult<Interview>> {
  const response = await apiGet<unknown>(
    `${INTERVIEWS_ENDPOINT}${buildQueryString(params)}`,
  );
  const paginatedInterviews = unwrapPaginatedResponse(response, "interviews");
  return {
    items: paginatedInterviews.items.map(normalizeInterview),
    pagination: paginatedInterviews.pagination,
  };
}

export async function fetchInterviewById(id: string): Promise<Interview> {
  const response = await apiGet<unknown>(`${INTERVIEWS_ENDPOINT}/${id}`);
  return normalizeInterview(unwrapItemResponse(response, "interview"));
}

export async function createInterview(
  payload: CreateInterviewPayload,
): Promise<Interview> {
  const response = await apiPost<unknown>(
    INTERVIEWS_ENDPOINT,
    toCreateBody(payload),
  );
  return normalizeInterview(unwrapItemResponse(response, "created interview"));
}

export async function updateInterview(
  id: string,
  payload: UpdateInterviewPayload,
): Promise<Interview> {
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
  const response = await apiPatch<unknown>(
    `${INTERVIEWS_ENDPOINT}/${id}`,
    body,
  );
  return normalizeInterview(unwrapItemResponse(response, "updated interview"));
}

export async function completeInterview(
  id: string,
  payload: CompleteInterviewPayload,
): Promise<Interview> {
  const response = await apiPatch<unknown>(`${INTERVIEWS_ENDPOINT}/${id}`, {
    status: payload.status || "completed",
    notes: payload.notes,
  });
  return normalizeInterview(
    unwrapItemResponse(response, "completed interview"),
  );
}
