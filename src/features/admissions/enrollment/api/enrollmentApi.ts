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

function isEmptyEnrollmentResponse(response: unknown): boolean {
  if (response === null || response === undefined) return true;
  if (typeof response === "string") return response.trim() === "";
  if (Array.isArray(response)) return response.length === 0;
  if (typeof response !== "object") return false;

  const record = response as Record<string, unknown>;
  if (Object.keys(record).length === 0) return true;

  return [record.data, record.items, record.result, record.payload].some(
    (value) => value === null || (Array.isArray(value) && value.length === 0),
  );
}

export async function fetchEnrollments(filters?: EnrollmentFiltersDto): Promise<EnrollmentDto[]> {
  const response = await apiGet<unknown>(`${BASE}${buildQueryString(filters)}`);
  return unwrapArrayResponse(response, "Enrollments") as EnrollmentDto[];
}

export async function fetchCurrentEnrollment(studentId: string, academicYearId?: string): Promise<EnrollmentDto | null> {
  const response = await apiGet<unknown>(`${BASE}/current${buildQueryString({ studentId, academicYearId })}`);
  if (isEmptyEnrollmentResponse(response)) return null;
  return unwrapItemResponse(response, "Current enrollment") as EnrollmentDto;
}

export async function fetchEnrollmentHistory(studentId: string): Promise<EnrollmentDto[]> {
  const response = await apiGet<unknown>(`${BASE}/history${buildQueryString({ studentId })}`);
  if (isEmptyEnrollmentResponse(response)) return [];
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
