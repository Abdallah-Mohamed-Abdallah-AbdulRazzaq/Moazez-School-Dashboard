import { apiDelete, apiGet, apiPost } from "@/lib/api";
import { unwrapArrayResponse, unwrapItemResponse } from "@/features/admissions/shared/services/admissionsApiUtils";
import type {
  ApplicationDocumentResponseDto,
  LinkApplicationDocumentRequest,
} from "./applicationDocumentDtos";
import { mapApplicationDocumentDto } from "../model/mappers";

const documentsEndpoint = (applicationId: string) =>
  `/admissions/applications/${applicationId}/documents`;

export async function listApplicationDocuments(
  applicationId: string,
): Promise<ApplicationDocumentResponseDto[]> {
  const response = await apiGet<unknown>(documentsEndpoint(applicationId));
  return unwrapArrayResponse(response, "application documents").map(mapApplicationDocumentDto);
}

export async function linkApplicationDocument(
  applicationId: string,
  payload: LinkApplicationDocumentRequest,
): Promise<ApplicationDocumentResponseDto> {
  const response = await apiPost<unknown>(documentsEndpoint(applicationId), payload);
  return mapApplicationDocumentDto(unwrapItemResponse(response, "application document"));
}

export async function acceptApplicationDocument(
  applicationId: string,
  documentId: string,
  note?: string,
): Promise<void> {
  await apiPost<unknown>(
    `${documentsEndpoint(applicationId)}/${documentId}/accept`,
    note?.trim() ? { note: note.trim() } : {},
  );
}

export async function rejectApplicationDocument(
  applicationId: string,
  documentId: string,
  note: string,
): Promise<void> {
  await apiPost<unknown>(
    `${documentsEndpoint(applicationId)}/${documentId}/reject`,
    { note: note.trim() },
  );
}

export async function requestApplicationDocumentReplacement(
  applicationId: string,
  documentId: string,
  note: string,
): Promise<void> {
  await apiPost<unknown>(
    `${documentsEndpoint(applicationId)}/${documentId}/request-replacement`,
    { note: note.trim() },
  );
}

export async function deleteApplicationDocument(
  applicationId: string,
  documentId: string,
): Promise<void> {
  await apiDelete(`${documentsEndpoint(applicationId)}/${documentId}`);
}
