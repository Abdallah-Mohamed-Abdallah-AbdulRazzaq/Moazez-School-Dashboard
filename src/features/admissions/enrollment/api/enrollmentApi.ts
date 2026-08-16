import { apiGet, apiPost } from "@/lib/api";
import { buildQueryString, unwrapArrayResponse, unwrapItemResponse } from "@/features/students-guardians/services/studentsGuardiansApiUtils";
import type {
  AcademicYearDto,
  EnrollmentDto,
  EnrollmentFiltersDto,
  EnrollmentMovementDto,
  EnrollmentPlacementDto,
  PromoteEnrollmentDto,
  TransferEnrollmentDto,
  ValidateEnrollmentDto,
  ValidationResultDto,
  WithdrawEnrollmentDto,
} from "./enrollmentDtos";

const BASE = "/students-guardians/enrollments";

export async function fetchEnrollments(filters?: EnrollmentFiltersDto): Promise<EnrollmentDto[]> {
  const response = await apiGet<unknown>(`${BASE}${buildQueryString(filters)}`);
  return unwrapArrayResponse(response, "Enrollments") as EnrollmentDto[];
}

export async function fetchEnrollment(id: string): Promise<EnrollmentDto> {
  const response = await apiGet<unknown>(`${BASE}/${encodeURIComponent(id)}`);
  return unwrapItemResponse(response, "Enrollment") as EnrollmentDto;
}

export async function fetchCurrentEnrollment(studentId: string, academicYearId?: string): Promise<EnrollmentDto | null> {
  const response = await apiGet<unknown>(`${BASE}/current${buildQueryString({ studentId, academicYearId })}`);
  if (response === null) return null;
  return unwrapItemResponse(response, "Current enrollment") as EnrollmentDto;
}

export async function fetchEnrollmentHistory(studentId: string): Promise<EnrollmentDto[]> {
  const response = await apiGet<unknown>(`${BASE}/history${buildQueryString({ studentId })}`);
  return unwrapArrayResponse(response, "Enrollment history") as EnrollmentDto[];
}

export async function fetchEnrollmentAcademicYears(): Promise<AcademicYearDto[]> {
  const response = await apiGet<unknown>(`${BASE}/academic-years`);
  return unwrapArrayResponse(response, "Enrollment academic years") as AcademicYearDto[];
}

export async function validateEnrollment(payload: ValidateEnrollmentDto): Promise<ValidationResultDto> {
  const response = await apiPost<unknown>(`${BASE}/validate`, payload);
  return unwrapItemResponse(response, "Enrollment validation") as ValidationResultDto;
}

export async function createEnrollment(payload: EnrollmentPlacementDto): Promise<EnrollmentDto> {
  const response = await apiPost<unknown>(BASE, payload);
  return unwrapItemResponse(response, "Created enrollment") as EnrollmentDto;
}

export async function upsertEnrollment(payload: EnrollmentPlacementDto): Promise<EnrollmentDto> {
  const response = await apiPost<unknown>(`${BASE}/upsert`, payload);
  return unwrapItemResponse(response, "Upserted enrollment") as EnrollmentDto;
}

export async function transferEnrollment(payload: TransferEnrollmentDto): Promise<EnrollmentMovementDto> {
  const response = await apiPost<unknown>(`${BASE}/transfer`, payload);
  return unwrapItemResponse(response, "Enrollment transfer") as EnrollmentMovementDto;
}

export async function withdrawEnrollment(payload: WithdrawEnrollmentDto): Promise<EnrollmentMovementDto> {
  const response = await apiPost<unknown>(`${BASE}/withdraw`, payload);
  return unwrapItemResponse(response, "Enrollment withdrawal") as EnrollmentMovementDto;
}

export async function promoteEnrollment(payload: PromoteEnrollmentDto): Promise<EnrollmentMovementDto> {
  const response = await apiPost<unknown>(`${BASE}/promote`, payload);
  return unwrapItemResponse(response, "Enrollment promotion") as EnrollmentMovementDto;
}
