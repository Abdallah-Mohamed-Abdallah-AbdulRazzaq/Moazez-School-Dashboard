export type ApplicationDocumentStatusDto = "complete" | "missing" | "pending_review";

export interface ApplicationDocumentFileDto {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: string;
  visibility: string;
}

export interface ApplicationDocumentResponseDto {
  id: string;
  applicationId: string;
  fileId: string;
  documentType: string;
  status: ApplicationDocumentStatusDto;
  source: "staff_upload" | "applicant_portal";
  canReview: boolean;
  reviewEligibility: { canAccept: boolean; canReject: boolean; canRequestReplacement: boolean; reason: "reviewable" | "application_status_not_reviewable" | "document_not_pending_review" | "not_applicant_portal_document" | "applicant_document_not_uploaded" };
  linkedApplicantDocument: { id: string; status: "uploaded" | "accepted" | "rejected" | "needs_replacement" | "superseded" } | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  file?: ApplicationDocumentFileDto;
}

export interface LinkApplicationDocumentRequest {
  fileId: string;
  documentType: string;
  status?: Exclude<ApplicationDocumentStatusDto, "pending_review">;
  notes?: string;
}

export interface ReviewApplicationDocumentRequest {
  note?: string;
}
