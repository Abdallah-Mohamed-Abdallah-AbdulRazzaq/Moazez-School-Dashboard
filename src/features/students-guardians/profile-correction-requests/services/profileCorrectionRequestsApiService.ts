import { apiGet, apiPost } from "@/lib/api";
import {
  buildQueryString,
  unwrapArrayResponse,
  unwrapItemResponse,
} from "@/features/students-guardians/services/studentsGuardiansApiUtils";
import type {
  FetchProfileCorrectionRequestsParams,
  ProfileCorrectionRequestDetail,
  ProfileCorrectionRequestListItem,
  ReviewProfileCorrectionRequestPayload,
} from "@/features/students-guardians/profile-correction-requests/types/profileCorrectionRequests";
import {
  normalizeProfileCorrectionRequestDetail,
  normalizeProfileCorrectionRequestListItem,
} from "@/features/students-guardians/profile-correction-requests/utils/profileCorrectionRequestMappers";

const PROFILE_CORRECTION_REQUESTS_BASE_PATH =
  "/students-guardians/profile-correction-requests";

function buildSupportedQuery(params?: FetchProfileCorrectionRequestsParams) {
  return buildQueryString({
    status: params?.status === "all" ? undefined : params?.status,
    studentId: params?.studentId,
  });
}

export async function fetchProfileCorrectionRequests(
  params?: FetchProfileCorrectionRequestsParams,
): Promise<ProfileCorrectionRequestListItem[]> {
  const response = await apiGet<unknown>(
    `${PROFILE_CORRECTION_REQUESTS_BASE_PATH}${buildSupportedQuery(params)}`,
  );
  return unwrapArrayResponse(response, "Profile correction requests").map(
    normalizeProfileCorrectionRequestListItem,
  );
}

export async function fetchProfileCorrectionRequestById(
  requestId: string,
): Promise<ProfileCorrectionRequestDetail> {
  const response = await apiGet<unknown>(
    `${PROFILE_CORRECTION_REQUESTS_BASE_PATH}/${requestId}`,
  );
  return normalizeProfileCorrectionRequestDetail(
    unwrapItemResponse(response, "Profile correction request"),
  );
}

export async function approveProfileCorrectionRequest(
  requestId: string,
  payload: ReviewProfileCorrectionRequestPayload = {},
): Promise<ProfileCorrectionRequestDetail> {
  const response = await apiPost<unknown>(
    `${PROFILE_CORRECTION_REQUESTS_BASE_PATH}/${requestId}/approve`,
    payload.reviewerNote ? { reviewerNote: payload.reviewerNote } : {},
  );
  return normalizeProfileCorrectionRequestDetail(
    unwrapItemResponse(response, "Approved profile correction request"),
  );
}

export async function rejectProfileCorrectionRequest(
  requestId: string,
  payload: ReviewProfileCorrectionRequestPayload = {},
): Promise<ProfileCorrectionRequestDetail> {
  const response = await apiPost<unknown>(
    `${PROFILE_CORRECTION_REQUESTS_BASE_PATH}/${requestId}/reject`,
    payload.reviewerNote ? { reviewerNote: payload.reviewerNote } : {},
  );
  return normalizeProfileCorrectionRequestDetail(
    unwrapItemResponse(response, "Rejected profile correction request"),
  );
}
