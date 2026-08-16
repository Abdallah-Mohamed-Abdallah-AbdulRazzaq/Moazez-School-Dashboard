import { apiGet, apiPatch, apiPost } from "@/lib/api";
import type {
  Student,
  StudentTimelineEvent,
  UpdateStudentPayload,
} from "@/features/students-guardians/students/types";
import {
  buildQueryString,
  normalizeStudent,
  normalizeTimelineEvent,
  unwrapArrayResponse,
  unwrapItemResponse,
} from "@/features/students-guardians/services/studentsGuardiansApiUtils";

const STUDENTS_BASE_PATH = "/students-guardians/students";

export interface FetchStudentsParams {
  search?: string;
  status?: string;
}

export type CreateStudentPayload = Partial<Student> & {
  full_name_en?: string;
  dateOfBirth?: string;
  gender?: string;
  nationality?: string;
  status?: string;
  contact?: Student["contact"];
};

export async function fetchStudents(
  params?: FetchStudentsParams,
): Promise<Student[]> {
  const response = await apiGet<unknown>(
    `${STUDENTS_BASE_PATH}${buildQueryString(params)}`,
  );
  return unwrapArrayResponse(response, "Students").map(normalizeStudent);
}

export async function fetchStudentById(studentId: string): Promise<Student> {
  const response = await apiGet<unknown>(`${STUDENTS_BASE_PATH}/${studentId}`);
  return normalizeStudent(unwrapItemResponse(response, "Student"));
}

export async function createStudent(
  payload: CreateStudentPayload,
): Promise<Student> {
  const response = await apiPost<unknown>(STUDENTS_BASE_PATH, payload);
  return normalizeStudent(unwrapItemResponse(response, "Created student"));
}

export async function updateStudent(
  studentId: string,
  payload: UpdateStudentPayload,
): Promise<Student> {
  const response = await apiPatch<unknown>(
    `${STUDENTS_BASE_PATH}/${studentId}`,
    payload,
  );
  return normalizeStudent(unwrapItemResponse(response, "Updated student"));
}

export async function fetchStudentTimeline(
  studentId: string,
): Promise<StudentTimelineEvent[]> {
  const response = await apiGet<unknown>(
    `${STUDENTS_BASE_PATH}/${studentId}/timeline`,
  );
  return unwrapArrayResponse(response, "Student timeline").map(
    normalizeTimelineEvent,
  );
}
