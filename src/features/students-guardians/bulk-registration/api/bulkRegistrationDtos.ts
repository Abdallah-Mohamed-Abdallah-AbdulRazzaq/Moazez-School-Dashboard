export interface BulkRegistrationPlacementInput {
  academicYearId: string;
  termId?: string;
  classroomId: string;
  enrollmentDate: string;
}

export type BulkRegistrationBatchStatus =
  | "UPLOADED"
  | "VALIDATING"
  | "VALIDATION_FAILED"
  | "READY"
  | "EXECUTING"
  | "EXECUTION_PARTIAL_FAILED"
  | "FAILED"
  | "COMPLETED";

export type BulkRegistrationRowStatus =
  | "PENDING"
  | "VALID"
  | "INVALID"
  | "PROCESSING"
  | "CREATED"
  | "FAILED";

export interface BulkRegistrationRowsQuery {
  page: number;
  limit: number;
  status?: BulkRegistrationRowStatus;
}

export interface BulkRegistrationNamedPlacement {
  id: string;
  nameAr: string;
  nameEn: string;
}

export interface BulkRegistrationClassroomPlacement
  extends BulkRegistrationNamedPlacement {
  capacity: number | null;
}

export interface BulkRegistrationResolvedPlacement {
  academicYear: BulkRegistrationNamedPlacement;
  term: BulkRegistrationNamedPlacement | null;
  stage: BulkRegistrationNamedPlacement;
  grade: BulkRegistrationNamedPlacement;
  section: BulkRegistrationNamedPlacement;
  classroom: BulkRegistrationClassroomPlacement;
  enrollmentDate: string;
}

export interface BulkRegistrationSeatReadiness {
  limit: number | null;
  used: number;
  remaining: number | null;
}

export interface BulkRegistrationPreflight {
  valid: boolean;
  errors: string[];
  templateVersion: number;
  placement: BulkRegistrationResolvedPlacement | null;
  studentSeat: BulkRegistrationSeatReadiness | null;
}

export interface BulkRegistrationBatchPlacement {
  academicYearId: string;
  termId: string | null;
  classroomId: string;
  enrollmentDate: string;
}

export interface BulkRegistrationCounters {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  createdRows: number;
  failedRows: number;
}

export interface BulkRegistrationBatch {
  id: string;
  sourceImportJobId: string;
  status: BulkRegistrationBatchStatus;
  templateVersion: number;
  placement: BulkRegistrationBatchPlacement;
  counters: BulkRegistrationCounters;
  createdAt: string;
  updatedAt: string;
}

export interface BulkRegistrationBatchDetail extends BulkRegistrationBatch {
  validatedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  validationErrors: string[];
}

export interface BulkRegistrationNormalizedData {
  firstNameEn: string | null;
  fatherNameEn: string | null;
  grandfatherNameEn: string | null;
  familyNameEn: string | null;
  firstNameAr: string | null;
  fatherNameAr: string | null;
  grandfatherNameAr: string | null;
  familyNameAr: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  nationality: string | null;
  username: string;
  contactEmail: string | null;
  studentPhone: string | null;
}

export interface BulkRegistrationRowError {
  code: string;
  field: string | null;
  reason?: string;
}

export interface BulkRegistrationRow {
  id: string;
  rowNumber: number;
  status: BulkRegistrationRowStatus;
  normalizedData: BulkRegistrationNormalizedData;
  errors: BulkRegistrationRowError[];
  studentId: string | null;
  userId: string | null;
  enrollmentId: string | null;
}

export interface BulkRegistrationRowsPage {
  items: BulkRegistrationRow[];
  total: number;
  page: number;
  limit: number;
}
