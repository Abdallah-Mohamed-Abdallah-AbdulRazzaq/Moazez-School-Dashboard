import { apiGet, apiPatch, apiPost } from "@/lib/api";
import type {
  CreateStudentNotePayload,
  StudentNote,
} from "@/features/students-guardians/students/types";
import {
  normalizeStudentNote,
  unwrapArrayResponse,
  unwrapItemResponse,
} from "@/features/students-guardians/services/studentsGuardiansApiUtils";

const STUDENTS_BASE_PATH = "/students-guardians/students";

export async function createStudentNote(
  studentId: string,
  payload: CreateStudentNotePayload,
): Promise<StudentNote> {
  const response = await apiPost<unknown>(
    `${STUDENTS_BASE_PATH}/${studentId}/notes`,
    payload,
  );
  return normalizeStudentNote(
    unwrapItemResponse(response, "Created student note"),
  );
}

export async function fetchStudentNotes(
  studentId: string,
): Promise<StudentNote[]> {
  const response = await apiGet<unknown>(
    `${STUDENTS_BASE_PATH}/${studentId}/notes`,
  );
  return unwrapArrayResponse(response, "Student notes").map(
    normalizeStudentNote,
  );
}

export async function updateStudentNote(
  studentId: string,
  studentNoteId: string,
  payload: Partial<CreateStudentNotePayload>,
): Promise<StudentNote> {
  const response = await apiPatch<unknown>(
    `${STUDENTS_BASE_PATH}/${studentId}/notes/${studentNoteId}`,
    payload,
  );
  return normalizeStudentNote(
    unwrapItemResponse(response, "Updated student note"),
  );
}
