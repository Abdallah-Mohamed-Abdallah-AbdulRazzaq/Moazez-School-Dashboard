import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import type { StudentDocument } from "@/features/students-guardians/students/types";
import {
  normalizeStudentDocument,
  unwrapArrayResponse,
  unwrapItemResponse,
} from "@/features/students-guardians/services/studentsGuardiansApiUtils";

const STUDENTS_BASE_PATH = "/students-guardians/students";
const DOCUMENTS_BASE_PATH = "/students-guardians/documents";

export interface CreateStudentDocumentPayload {
  type: string;
  fileId: string;
  status: StudentDocument["status"];
  notes?: string;
}

export interface ImportStudentDocumentsFromApplicationPayload {
  applicationId: string;
  applicationDocumentIds: string[];
}

export interface ImportedStudentDocumentSource {
  sourceApplicationId: string;
  sourceApplicationDocumentId: string;
  sourceApplicantRequestDocumentId: string | null;
}

export interface ImportedStudentDocument {
  applicationDocumentId: string;
  studentDocument: StudentDocument;
  source: ImportedStudentDocumentSource;
}

export interface SkippedStudentDocumentImport {
  applicationDocumentId: string;
  reason: "already_imported";
  studentDocumentId: string;
}

export interface ImportStudentDocumentsFromApplicationResponse {
  studentId: string;
  applicationId: string;
  imported: ImportedStudentDocument[];
  skipped: SkippedStudentDocumentImport[];
  warnings: string[];
}

interface RawImportStudentDocumentsFromApplicationResponse
  extends Omit<ImportStudentDocumentsFromApplicationResponse, "imported"> {
  imported: Array<
    Omit<ImportedStudentDocument, "studentDocument"> & {
      studentDocument: unknown;
    }
  >;
}

export interface DeleteStudentDocumentResponse {
  ok: boolean;
}

export async function createStudentDocument(
  studentId: string,
  payload: CreateStudentDocumentPayload,
): Promise<StudentDocument> {
  const response = await apiPost<unknown>(
    `${STUDENTS_BASE_PATH}/${studentId}/documents`,
    payload,
  );
  return normalizeStudentDocument(
    unwrapItemResponse(response, "Created student document"),
  );
}

export async function fetchStudentDocuments(
  studentId: string,
): Promise<StudentDocument[]> {
  const response = await apiGet<unknown>(
    `${STUDENTS_BASE_PATH}/${studentId}/documents`,
  );
  return unwrapArrayResponse(response, "Student documents").map(
    normalizeStudentDocument,
  );
}

export async function fetchMissingStudentDocuments(
  studentId: string,
): Promise<StudentDocument[]> {
  const response = await apiGet<unknown>(
    `${STUDENTS_BASE_PATH}/${studentId}/documents/missing`,
  );
  return unwrapArrayResponse(response, "Missing student documents").map(
    normalizeStudentDocument,
  );
}

export async function updateStudentDocument(
  studentDocumentId: string,
  payload: Partial<StudentDocument> & { notes?: string },
): Promise<StudentDocument> {
  const response = await apiPatch<unknown>(
    `${DOCUMENTS_BASE_PATH}/${studentDocumentId}`,
    payload,
  );
  return normalizeStudentDocument(
    unwrapItemResponse(response, "Updated student document"),
  );
}

export async function importStudentDocumentsFromApplication(
  studentId: string,
  payload: ImportStudentDocumentsFromApplicationPayload,
): Promise<ImportStudentDocumentsFromApplicationResponse> {
  const response = await apiPost<unknown>(
    `${STUDENTS_BASE_PATH}/${studentId}/documents/import-from-application`,
    payload,
  );
  const importedDocuments = unwrapItemResponse<RawImportStudentDocumentsFromApplicationResponse>(
    response,
    "Imported student documents",
  );

  return {
    ...importedDocuments,
    imported: importedDocuments.imported.map((importedDocument) => ({
      ...importedDocument,
      studentDocument: normalizeStudentDocument(
        importedDocument.studentDocument,
      ),
    })),
  };
}

export async function deleteStudentDocument(
  studentDocumentId: string,
): Promise<DeleteStudentDocumentResponse> {
  const response = await apiDelete<unknown>(
    `${DOCUMENTS_BASE_PATH}/${studentDocumentId}`,
  );
  return unwrapItemResponse(response, "Deleted student document");
}
