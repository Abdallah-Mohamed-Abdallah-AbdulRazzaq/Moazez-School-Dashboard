export type ProfileCorrectionRequestStatus =
  "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface ProfileCorrectionRequestedChange {
  field: string;
  label: string;
  currentValue: string;
  requestedValue: string;
}

export interface ProfileCorrectionRequestListItem {
  id: string;
  studentId: string;
  studentName: string;
  studentNumber?: string;
  status: ProfileCorrectionRequestStatus;
  requestedAt: string;
  reviewedAt?: string;
  cancelledAt?: string;
  reviewerNote?: string;
  reason?: string;
  changeCount: number;
}

export interface ProfileCorrectionRequestDetail extends ProfileCorrectionRequestListItem {
  changes: ProfileCorrectionRequestedChange[];
  currentSnapshot: Record<string, unknown> | null;
}

export interface FetchProfileCorrectionRequestsParams {
  status?: ProfileCorrectionRequestStatus | "all";
  studentId?: string;
}

export interface ReviewProfileCorrectionRequestPayload {
  reviewerNote?: string;
}
