import { apiClient } from "@/lib/api";
import type { Document } from "@/features/admissions/types/admissions";
import { unwrapItemResponse } from "@/features/admissions/shared/services/admissionsApiUtils";
import {
  acceptApplicationDocument as acceptDocument,
  deleteApplicationDocument as deleteDocument,
  linkApplicationDocument,
  listApplicationDocuments,
  rejectApplicationDocument as rejectDocument,
  requestApplicationDocumentReplacement as requestReplacement,
} from "../api/applicationDocumentsApi";
import type { ApplicationDocumentStatusDto } from "../api/applicationDocumentDtos";
import { toLegacyDocument } from "../model/mappers";

type ApiRecord = Record<string, unknown>;

export interface CreateApplicationDocumentPayload {
  fileId: string;
  documentType: string;
  status?: Exclude<ApplicationDocumentStatusDto, "pending_review">;
  notes?: string;
}

const readFileId = (response: unknown): string => {
  const item = unwrapItemResponse(response, "uploaded file") as ApiRecord;
  const id = item.id ?? item.fileId ?? item.file_id;
  if (typeof id !== "string" || !id) {
    throw new Error("Uploaded file response is missing a file id.");
  }
  return id;
};

export async function uploadAdmissionsFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await apiClient.post<unknown>("/files", formData, {
    headers: { "Content-Type": undefined },
  });
  return readFileId(response.data);
}

export async function createApplicationDocument(
  applicationId: string,
  payload: CreateApplicationDocumentPayload,
): Promise<Document> {
  return toLegacyDocument(
    await linkApplicationDocument(applicationId, {
      ...payload,
      status: payload.status ?? "complete",
    }),
  );
}

export async function fetchApplicationDocuments(applicationId: string): Promise<Document[]> {
  return (await listApplicationDocuments(applicationId)).map(toLegacyDocument);
}

export async function acceptApplicationDocument(
  applicationId: string,
  documentId: string,
  note?: string,
): Promise<void> {
  await acceptDocument(applicationId, documentId, note);
}

export async function rejectApplicationDocument(
  applicationId: string,
  documentId: string,
  note: string,
): Promise<void> {
  await rejectDocument(applicationId, documentId, note);
}

export async function requestApplicationDocumentReplacement(
  applicationId: string,
  documentId: string,
  note: string,
): Promise<void> {
  await requestReplacement(applicationId, documentId, note);
}

export async function deleteApplicationDocument(
  applicationId: string,
  documentId: string,
): Promise<void> {
  await deleteDocument(applicationId, documentId);
}
