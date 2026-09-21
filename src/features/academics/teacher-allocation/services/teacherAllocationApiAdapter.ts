import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import type {
  ApplyTeacherToGradeRequest,
  ApplyTeacherToGradeResponse,
  BulkTeacherAllocationRequest,
  BulkTeacherAllocationResponse,
  ClearSubjectAllocationsRequest,
  ClearSubjectAllocationsResponse,
  CreateTeacherAllocationRequest,
  DeleteTeacherAllocationResponse,
  ListTeacherAllocationsResponse,
  PreviewTeacherAllocationReassignmentRequest,
  ReassignTeacherAllocationRequest,
  TeacherAllocationDto,
  TeacherAllocationReassignmentPreviewResponse,
  TeacherAllocationReassignmentResponse,
  TeacherAllocationValidationResponse,
  TeacherLoadsResponse,
} from "@/features/academics/teacher-allocation/services/teacherAllocationApi.types";

const BASE = "/academics/allocations";

export function listTeacherAllocations(params: {
  termId?: string;
  classroomId?: string;
}) {
  return apiGet<ListTeacherAllocationsResponse>(BASE, { params });
}

export function createTeacherAllocation(
  payload: CreateTeacherAllocationRequest,
) {
  return apiPost<TeacherAllocationDto>(BASE, payload);
}

export function previewTeacherAllocationReassignment(
  allocationId: string,
  payload: PreviewTeacherAllocationReassignmentRequest,
) {
  return apiPost<TeacherAllocationReassignmentPreviewResponse>(
    `${BASE}/${allocationId}/reassignment-preview`,
    payload,
  );
}

export function reassignTeacherAllocation(
  allocationId: string,
  payload: ReassignTeacherAllocationRequest,
) {
  return apiPost<TeacherAllocationReassignmentResponse>(
    `${BASE}/${allocationId}/reassign`,
    payload,
  );
}

export function bulkSaveTeacherAllocations(
  payload: BulkTeacherAllocationRequest,
) {
  return apiPut<BulkTeacherAllocationResponse>(`${BASE}/bulk`, payload);
}

export function applyTeacherToGrade(payload: ApplyTeacherToGradeRequest) {
  return apiPost<ApplyTeacherToGradeResponse>(`${BASE}/apply-to-grade`, payload);
}

export function clearSubjectAllocations(
  payload: ClearSubjectAllocationsRequest,
) {
  return apiPost<ClearSubjectAllocationsResponse>(
    `${BASE}/clear-subject`,
    payload,
  );
}

export function getTeacherAllocationValidation(params: {
  termId: string;
  gradeId?: string;
  subjectId?: string;
}) {
  return apiGet<TeacherAllocationValidationResponse>(`${BASE}/validation`, {
    params,
  });
}

export function getTeacherLoads(params: {
  termId: string;
  teacherUserId?: string;
}) {
  return apiGet<TeacherLoadsResponse>(`${BASE}/teacher-loads`, { params });
}

export function deleteTeacherAllocation(id: string) {
  return apiDelete<DeleteTeacherAllocationResponse>(`${BASE}/${id}`);
}
