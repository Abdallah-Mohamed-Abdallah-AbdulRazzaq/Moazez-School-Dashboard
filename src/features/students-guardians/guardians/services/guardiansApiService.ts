import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import type {
  Student,
  StudentGuardian,
  StudentGuardianLink,
} from "@/features/students-guardians/students/types";
import {
  buildQueryString,
  normalizeGuardian,
  normalizeStudent,
  normalizeStudentGuardianLink,
  unwrapArrayResponse,
  unwrapItemResponse,
} from "@/features/students-guardians/services/studentsGuardiansApiUtils";

const GUARDIANS_BASE_PATH = "/students-guardians/guardians";
const STUDENTS_BASE_PATH = "/students-guardians/students";

export interface FetchGuardiansParams {
  search?: string;
  relation?: string;
}

export type GuardianPayload = Partial<StudentGuardian>;

export interface LinkGuardianPayload {
  guardianId: string;
  is_primary?: boolean;
}

export interface UpdateStudentGuardianLinkPayload {
  is_primary?: boolean;
}

export async function fetchGuardians(
  params?: FetchGuardiansParams,
): Promise<Array<StudentGuardian & { id: string }>> {
  const response = await apiGet<unknown>(
    `${GUARDIANS_BASE_PATH}${buildQueryString(params)}`,
  );
  return unwrapArrayResponse(response, "Guardians").map(normalizeGuardian);
}

export async function fetchGuardianById(
  guardianId: string,
): Promise<StudentGuardian & { id: string }> {
  const response = await apiGet<unknown>(
    `${GUARDIANS_BASE_PATH}/${guardianId}`,
  );
  return normalizeGuardian(unwrapItemResponse(response, "Guardian"));
}

export async function createGuardian(
  payload: GuardianPayload,
): Promise<StudentGuardian & { id: string }> {
  const response = await apiPost<unknown>(GUARDIANS_BASE_PATH, payload);
  return normalizeGuardian(unwrapItemResponse(response, "Created guardian"));
}

export async function updateGuardian(
  guardianId: string,
  payload: GuardianPayload,
): Promise<StudentGuardian & { id: string }> {
  const response = await apiPatch<unknown>(
    `${GUARDIANS_BASE_PATH}/${guardianId}`,
    payload,
  );
  return normalizeGuardian(unwrapItemResponse(response, "Updated guardian"));
}

export async function linkGuardianToStudent(
  studentId: string,
  payload: LinkGuardianPayload,
): Promise<StudentGuardianLink & { id: string }> {
  const response = await apiPost<unknown>(
    `${STUDENTS_BASE_PATH}/${studentId}/guardians`,
    payload,
  );
  return normalizeStudentGuardianLink(
    unwrapItemResponse(response, "Student guardian link"),
  );
}

export async function unlinkGuardianFromStudent(
  studentId: string,
  guardianId: string,
): Promise<void> {
  await apiDelete<unknown>(
    `${STUDENTS_BASE_PATH}/${studentId}/guardians/${guardianId}`,
  );
}

export async function updateStudentGuardianLink(
  studentId: string,
  guardianId: string,
  payload: UpdateStudentGuardianLinkPayload,
): Promise<StudentGuardian & { id: string }> {
  const response = await apiPatch<unknown>(
    `${STUDENTS_BASE_PATH}/${studentId}/guardians/${guardianId}`,
    payload,
  );
  return normalizeGuardian(
    unwrapItemResponse(response, "Updated student guardian link"),
  );
}

export async function fetchStudentGuardians(
  studentId: string,
): Promise<Array<StudentGuardian & { id: string }>> {
  const response = await apiGet<unknown>(
    `${STUDENTS_BASE_PATH}/${studentId}/guardians`,
  );
  return unwrapArrayResponse(response, "Student guardians").map(
    normalizeGuardian,
  );
}

export async function fetchPrimaryStudentGuardians(
  studentId: string,
): Promise<Array<StudentGuardian & { id: string }>> {
  const response = await apiGet<unknown>(
    `${STUDENTS_BASE_PATH}/${studentId}/guardians/primary`,
  );
  try {
    return unwrapArrayResponse(response, "Primary student guardians").map(
      normalizeGuardian,
    );
  } catch (error) {
    if (error instanceof Error && /must be an array/.test(error.message)) {
      return [
        normalizeGuardian(
          unwrapItemResponse(response, "Primary student guardian"),
        ),
      ];
    }
    throw error;
  }
}

export async function fetchGuardianStudents(
  guardianId: string,
): Promise<Student[]> {
  const response = await apiGet<unknown>(
    `${GUARDIANS_BASE_PATH}/${guardianId}/students`,
  );

  if (Array.isArray(response)) {
    return response.map(normalizeStudent);
  }

  if (
    response &&
    typeof response === "object" &&
    "students" in response &&
    Array.isArray((response as { students?: unknown }).students)
  ) {
    return (response as { students: unknown[] }).students.map(normalizeStudent);
  }

  return unwrapArrayResponse(response, "Guardian students").map(
    normalizeStudent,
  );
}
