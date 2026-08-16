import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import type {
  ActiveDismissalRequestsListResponse,
  CreateDismissalGatePayload,
  CreateDismissalStaffAssignmentPayload,
  DeleteDismissalStaffAssignmentResponse,
  ConfirmDismissalStudentArrivalPayload,
  ConfirmDismissalStudentArrivalResponse,
  DeliverDismissalRequestPayload,
  DeliverDismissalRequestResponse,
  DismissalGatesListResponse,
  DismissalPickupRecipientsResponse,
  DismissalRequestDetailResponse,
  DismissalRequestHistoryDetailResponse,
  DismissalRequestHistoryListResponse,
  DismissalRequestStatusUpdateResponse,
  DismissalSettingsResponse,
  DismissalStaffAssignment,
  DismissalStaffAssignmentsListResponse,
  DismissalWaitingStudentsListResponse,
  EscalateDismissalRequestPayload,
  EscalateDismissalRequestResponse,
  ListActiveDismissalRequestsParams,
  ListDismissalGatesParams,
  ListDismissalRequestHistoryParams,
  ListDismissalStaffAssignmentsParams,
  ListDismissalWaitingStudentsParams,
  NedaaGate,
  UpdateDismissalGatePayload,
  UpdateDismissalRequestStatusPayload,
  UpdateDismissalSettingsPayload,
  UpdateDismissalStaffAssignmentPayload,
} from "@/features/nedaa/types/nedaa";

const DISMISSAL_SETTINGS_PATH = "/dismissal/settings";
const DISMISSAL_GATES_PATH = "/dismissal/gates";
const DISMISSAL_STAFF_ASSIGNMENTS_PATH = "/dismissal/staff-assignments";
const DISMISSAL_REQUESTS_PATH = "/dismissal/requests";
const DISMISSAL_WAITING_STUDENTS_PATH = "/dismissal/waiting-students";

export function fetchDismissalSettings(): Promise<DismissalSettingsResponse> {
  return apiGet<DismissalSettingsResponse>(DISMISSAL_SETTINGS_PATH);
}

export function updateDismissalSettings(
  payload: UpdateDismissalSettingsPayload,
): Promise<DismissalSettingsResponse> {
  return apiPatch<DismissalSettingsResponse>(DISMISSAL_SETTINGS_PATH, payload);
}

export function listDismissalGates(
  params?: ListDismissalGatesParams,
): Promise<DismissalGatesListResponse> {
  return apiGet<DismissalGatesListResponse>(DISMISSAL_GATES_PATH, { params });
}

export function createDismissalGate(
  payload: CreateDismissalGatePayload,
): Promise<NedaaGate> {
  return apiPost<NedaaGate>(DISMISSAL_GATES_PATH, payload);
}

export function fetchDismissalGate(gateId: string): Promise<NedaaGate> {
  return apiGet<NedaaGate>(`${DISMISSAL_GATES_PATH}/${gateId}`);
}

export function updateDismissalGate(
  gateId: string,
  payload: UpdateDismissalGatePayload,
): Promise<NedaaGate> {
  return apiPatch<NedaaGate>(`${DISMISSAL_GATES_PATH}/${gateId}`, payload);
}

export function listDismissalStaffAssignments(
  params?: ListDismissalStaffAssignmentsParams,
): Promise<DismissalStaffAssignmentsListResponse> {
  return apiGet<DismissalStaffAssignmentsListResponse>(
    DISMISSAL_STAFF_ASSIGNMENTS_PATH,
    { params },
  );
}

export function createDismissalStaffAssignment(
  payload: CreateDismissalStaffAssignmentPayload,
): Promise<DismissalStaffAssignment> {
  return apiPost<DismissalStaffAssignment>(
    DISMISSAL_STAFF_ASSIGNMENTS_PATH,
    payload,
  );
}

export function fetchDismissalStaffAssignment(
  assignmentId: string,
): Promise<DismissalStaffAssignment> {
  return apiGet<DismissalStaffAssignment>(
    `${DISMISSAL_STAFF_ASSIGNMENTS_PATH}/${assignmentId}`,
  );
}

export function updateDismissalStaffAssignment(
  assignmentId: string,
  payload: UpdateDismissalStaffAssignmentPayload,
): Promise<DismissalStaffAssignment> {
  return apiPatch<DismissalStaffAssignment>(
    `${DISMISSAL_STAFF_ASSIGNMENTS_PATH}/${assignmentId}`,
    payload,
  );
}

export function deleteDismissalStaffAssignment(
  assignmentId: string,
): Promise<DeleteDismissalStaffAssignmentResponse> {
  return apiDelete<DeleteDismissalStaffAssignmentResponse>(
    `${DISMISSAL_STAFF_ASSIGNMENTS_PATH}/${assignmentId}`,
  );
}

export function listActiveDismissalRequests(
  params?: ListActiveDismissalRequestsParams,
): Promise<ActiveDismissalRequestsListResponse> {
  return apiGet<ActiveDismissalRequestsListResponse>(
    `${DISMISSAL_REQUESTS_PATH}/active`,
    { params },
  );
}

export function fetchDismissalRequest(
  requestId: string,
): Promise<DismissalRequestDetailResponse> {
  return apiGet<DismissalRequestDetailResponse>(
    `${DISMISSAL_REQUESTS_PATH}/${requestId}`,
  );
}

export function updateDismissalRequestStatus(
  requestId: string,
  payload: UpdateDismissalRequestStatusPayload,
): Promise<DismissalRequestStatusUpdateResponse> {
  return apiPatch<DismissalRequestStatusUpdateResponse>(
    `${DISMISSAL_REQUESTS_PATH}/${requestId}/status`,
    payload,
  );
}

export function listDismissalPickupRecipients(
  requestId: string,
): Promise<DismissalPickupRecipientsResponse> {
  return apiGet<DismissalPickupRecipientsResponse>(
    `${DISMISSAL_REQUESTS_PATH}/${requestId}/pickup-recipients`,
  );
}

export function deliverDismissalRequest(
  requestId: string,
  payload: DeliverDismissalRequestPayload,
): Promise<DeliverDismissalRequestResponse> {
  return apiPost<DeliverDismissalRequestResponse>(
    `${DISMISSAL_REQUESTS_PATH}/${requestId}/deliver`,
    payload,
  );
}

export function escalateDismissalRequest(
  requestId: string,
  payload: EscalateDismissalRequestPayload,
): Promise<EscalateDismissalRequestResponse> {
  return apiPost<EscalateDismissalRequestResponse>(
    `${DISMISSAL_REQUESTS_PATH}/${requestId}/escalate`,
    payload,
  );
}

export function listDismissalWaitingStudents(
  params?: ListDismissalWaitingStudentsParams,
): Promise<DismissalWaitingStudentsListResponse> {
  return apiGet<DismissalWaitingStudentsListResponse>(
    DISMISSAL_WAITING_STUDENTS_PATH,
    { params },
  );
}

export function confirmDismissalStudentArrival(
  requestId: string,
  payload: ConfirmDismissalStudentArrivalPayload,
): Promise<ConfirmDismissalStudentArrivalResponse> {
  return apiPost<ConfirmDismissalStudentArrivalResponse>(
    `${DISMISSAL_WAITING_STUDENTS_PATH}/${requestId}/arrival`,
    payload,
  );
}

export function listDismissalRequestHistory(
  params?: ListDismissalRequestHistoryParams,
): Promise<DismissalRequestHistoryListResponse> {
  return apiGet<DismissalRequestHistoryListResponse>(
    `${DISMISSAL_REQUESTS_PATH}/history`,
    { params },
  );
}

export function fetchDismissalRequestHistoryItem(
  requestId: string,
): Promise<DismissalRequestHistoryDetailResponse> {
  return apiGet<DismissalRequestHistoryDetailResponse>(
    `${DISMISSAL_REQUESTS_PATH}/history/${requestId}`,
  );
}
