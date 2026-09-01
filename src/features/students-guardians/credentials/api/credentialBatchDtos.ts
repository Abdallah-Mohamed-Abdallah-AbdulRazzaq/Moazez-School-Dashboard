export const CREDENTIAL_AUDIENCE_MODES = [
  "import_batch",
  "selected_students",
  "academic_year",
  "stage",
  "grade",
  "section",
  "classroom",
  "missing_password",
] as const;

export type CredentialAudienceMode = (typeof CREDENTIAL_AUDIENCE_MODES)[number];

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

export const CREDENTIAL_MODES = [
  "unique_generated",
  "shared_temporary",
  "shared_admin_provided",
] as const;

export type CredentialMode = (typeof CREDENTIAL_MODES)[number];

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
