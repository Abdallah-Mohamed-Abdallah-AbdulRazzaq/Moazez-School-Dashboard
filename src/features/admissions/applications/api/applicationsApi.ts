import { apiGet, apiPatch, apiPost } from "@/lib/api";
import { buildQueryString, unwrapArrayResponse, unwrapItemResponse } from "@/features/admissions/shared/services/admissionsApiUtils";
import type { ApplicationRecord } from "../model/application";
import { mapApplicationDto } from "../model/mappers";
import type {
  ApplicationStatusDto,
  CreateApplicationRequest,
  UpdateApplicationRequest,
} from "./applicationDtos";

const ENDPOINT = "/admissions/applications";

export async function listApplications(status?: ApplicationStatusDto): Promise<ApplicationRecord[]> {
  const response = await apiGet<unknown>(`${ENDPOINT}${buildQueryString({ status })}`);
  return unwrapArrayResponse(response, "applications").map(mapApplicationDto);
}

export async function getApplication(id: string): Promise<ApplicationRecord> {
  const response = await apiGet<unknown>(`${ENDPOINT}/${id}`);
  return mapApplicationDto(unwrapItemResponse(response, "application"));
}

export async function postApplication(payload: CreateApplicationRequest): Promise<ApplicationRecord> {
  const response = await apiPost<unknown>(ENDPOINT, payload);
  return mapApplicationDto(unwrapItemResponse(response, "created application"));
}

export async function patchApplication(
  id: string,
  payload: UpdateApplicationRequest,
): Promise<ApplicationRecord> {
  const response = await apiPatch<unknown>(`${ENDPOINT}/${id}`, payload);
  return mapApplicationDto(unwrapItemResponse(response, "updated application"));
}

export async function postApplicationSubmission(id: string): Promise<ApplicationRecord> {
  const response = await apiPost<unknown>(`${ENDPOINT}/${id}/submit`, {});
  return mapApplicationDto(unwrapItemResponse(response, "submitted application"));
}

