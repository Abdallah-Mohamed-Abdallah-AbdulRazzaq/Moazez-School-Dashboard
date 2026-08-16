import { apiGet, apiPost } from "@/lib/api";
import type {
  EnrollmentMovement,
  EnrollmentMovementAction,
  StudentEnrollment,
} from "@/features/students-guardians/students/types";
import {
  buildQueryString,
  normalizeEnrollment,
  unwrapArrayResponse,
  unwrapItemResponse,
} from "@/features/students-guardians/services/studentsGuardiansApiUtils";

const ENROLLMENTS_BASE_PATH = "/students-guardians/enrollments";

export type EnrollmentPayload = Partial<StudentEnrollment> & {
  termId?: string;
};

export interface EnrollmentValidationResult {
  valid: boolean;
  errors?: string[];
  message?: string;
}

export interface FetchCurrentEnrollmentParams {
  studentId?: string;
  academicYearId?: string;
}

export interface FetchEnrollmentsParams {
  studentId?: string;
  academicYearId?: string;
  academicYear?: string;
  status?: string;
}

export interface TransferStudentPayload {
  studentId: string;
  targetSectionId: string;
  targetClassroomId?: string;
  effectiveDate: string;
  reason?: string;
  notes?: string;
  sourceRequestId?: string;
}

export interface WithdrawStudentPayload {
  studentId: string;
  effectiveDate: string;
  reason?: string;
  notes?: string;
  actionType?: Extract<
    EnrollmentMovementAction,
    "withdrawn" | "transferred_external"
  >;
  sourceRequestId?: string;
}

export async function validateEnrollment(
  payload: EnrollmentPayload,
): Promise<EnrollmentValidationResult> {
  const response = await apiPost<unknown>(
    `${ENROLLMENTS_BASE_PATH}/validate`,
    payload,
  );
  return unwrapItemResponse(response, "Enrollment validation");
}

export async function createEnrollment(
  payload: EnrollmentPayload,
): Promise<StudentEnrollment & { id: string }> {
  const response = await apiPost<unknown>(ENROLLMENTS_BASE_PATH, payload);
  return normalizeEnrollment(
    unwrapItemResponse(response, "Created enrollment"),
  );
}

export async function fetchEnrollmentById(
  enrollmentId: string,
): Promise<StudentEnrollment & { id: string }> {
  const response = await apiGet<unknown>(
    `${ENROLLMENTS_BASE_PATH}/${enrollmentId}`,
  );
  return normalizeEnrollment(unwrapItemResponse(response, "Enrollment"));
}

export async function fetchCurrentEnrollment(
  params: FetchCurrentEnrollmentParams,
): Promise<(StudentEnrollment & { id: string }) | null> {
  const response = await apiGet<unknown>(
    `${ENROLLMENTS_BASE_PATH}/current${buildQueryString(params)}`,
  );
  if (response === null) return null;

  return normalizeEnrollment(
    unwrapItemResponse(response, "Current enrollment"),
  );
}

export async function fetchEnrollmentHistory(
  studentId: string,
): Promise<Array<StudentEnrollment & { id: string }>> {
  const response = await apiGet<unknown>(
    `${ENROLLMENTS_BASE_PATH}/history${buildQueryString({ studentId })}`,
  );
  return unwrapArrayResponse(response, "Enrollment history").map(
    normalizeEnrollment,
  );
}

export async function fetchEnrollments(
  params?: FetchEnrollmentsParams,
): Promise<Array<StudentEnrollment & { id: string }>> {
  const response = await apiGet<unknown>(
    `${ENROLLMENTS_BASE_PATH}${buildQueryString(params)}`,
  );
  return unwrapArrayResponse(response, "Enrollments").map(normalizeEnrollment);
}

export async function fetchEnrollmentAcademicYears(): Promise<unknown[]> {
  const response = await apiGet<unknown>(
    `${ENROLLMENTS_BASE_PATH}/academic-years`,
  );
  return unwrapArrayResponse(response, "Enrollment academic years");
}

export async function transferStudent(
  payload: TransferStudentPayload,
): Promise<EnrollmentMovement> {
  const response = await apiPost<unknown>(
    `${ENROLLMENTS_BASE_PATH}/transfer`,
    payload,
  );
  return unwrapItemResponse(response, "Enrollment transfer");
}

export async function withdrawStudent(
  payload: WithdrawStudentPayload,
): Promise<EnrollmentMovement> {
  const response = await apiPost<unknown>(
    `${ENROLLMENTS_BASE_PATH}/withdraw`,
    payload,
  );
  return unwrapItemResponse(response, "Enrollment withdrawal");
}
