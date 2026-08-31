export type CredentialAudienceMode =
  | "import_batch"
  | "selected_students"
  | "academic_year"
  | "stage"
  | "grade"
  | "section"
  | "classroom"
  | "missing_password";

export type CredentialAudience =
  | {
      audienceMode: "import_batch";
      sourceRegistrationBatchId: string;
    }
  | {
      audienceMode: "selected_students";
      studentIds: string[];
    }
  | {
      audienceMode: "academic_year";
      academicYearId: string;
    }
  | {
      audienceMode: "stage";
      academicYearId: string;
      stageId: string;
    }
  | {
      audienceMode: "grade";
      academicYearId: string;
      gradeId: string;
    }
  | {
      audienceMode: "section";
      academicYearId: string;
      sectionId: string;
    }
  | {
      audienceMode: "classroom";
      academicYearId: string;
      classroomId: string;
    }
  | { audienceMode: "missing_password" };

export type CredentialMode =
  | "unique_generated"
  | "shared_temporary"
  | "shared_admin_provided";

export type CredentialBatchStatus =
  | "pending"
  | "processing"
  | "completed"
  | "partial_failed"
  | "failed";

export interface CredentialPreviewSampleItem {
  studentId: string;
  userId: string;
  fullName: string;
  username: string | null;
  loginEmail: string;
  hasPassword: boolean;
  mustChangePassword: boolean;
  credentialVersion: number;
}

export interface CredentialAudiencePreview {
  totalMatched: number;
  eligible: number;
  skipped: number;
  skippedReasons: Record<string, number>;
  sample: CredentialPreviewSampleItem[];
}

export interface CredentialBatchCounters {
  totalRows: number;
  generatedRows: number;
  skippedRows: number;
  failedRows: number;
}

export interface CredentialBatch {
  id: string;
  audienceMode: CredentialAudienceMode;
  credentialMode: CredentialMode;
  selectors: Record<string, string>;
  status: CredentialBatchStatus;
  counters: CredentialBatchCounters;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

export interface CreateCredentialBatchInput {
  audience: CredentialAudience;
  credentialMode: CredentialMode;
  sharedPassword?: string;
}
