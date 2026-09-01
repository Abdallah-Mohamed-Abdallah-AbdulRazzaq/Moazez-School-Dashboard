import type {
  CredentialAudience,
  CredentialAudienceMode,
} from "../api/credentialBatchDtos";

export const MAX_SELECTED_CREDENTIAL_STUDENTS = 10_000;

export interface CredentialAudienceDraft {
  audienceMode: CredentialAudienceMode;
  sourceRegistrationBatchId?: string;
  studentIds?: string[];
  academicYearId?: string;
  stageId?: string;
  gradeId?: string;
  sectionId?: string;
  classroomId?: string;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string | undefined): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function buildAcademicAudience(
  draft: CredentialAudienceDraft,
): CredentialAudience | null {
  if (!isUuid(draft.academicYearId)) return null;

  switch (draft.audienceMode) {
    case "academic_year":
      return { audienceMode: "academic_year", academicYearId: draft.academicYearId };
    case "stage":
      return isUuid(draft.stageId)
        ? {
            audienceMode: "stage",
            academicYearId: draft.academicYearId,
            stageId: draft.stageId,
          }
        : null;
    case "grade":
      return isUuid(draft.gradeId)
        ? {
            audienceMode: "grade",
            academicYearId: draft.academicYearId,
            gradeId: draft.gradeId,
          }
        : null;
    case "section":
      return isUuid(draft.sectionId)
        ? {
            audienceMode: "section",
            academicYearId: draft.academicYearId,
            sectionId: draft.sectionId,
          }
        : null;
    case "classroom":
      return isUuid(draft.classroomId)
        ? {
            audienceMode: "classroom",
            academicYearId: draft.academicYearId,
            classroomId: draft.classroomId,
          }
        : null;
    default:
      return null;
  }
}

export function buildCredentialAudience(
  draft: CredentialAudienceDraft,
): CredentialAudience | null {
  switch (draft.audienceMode) {
    case "import_batch":
      return isUuid(draft.sourceRegistrationBatchId)
        ? {
            audienceMode: "import_batch",
            sourceRegistrationBatchId: draft.sourceRegistrationBatchId,
          }
        : null;
    case "selected_students": {
      const studentIds = [...new Set(draft.studentIds ?? [])];
      return studentIds.length > 0 &&
        studentIds.length <= MAX_SELECTED_CREDENTIAL_STUDENTS &&
        studentIds.every((studentId) => isUuid(studentId))
        ? { audienceMode: "selected_students", studentIds }
        : null;
    }
    case "missing_password":
      return { audienceMode: "missing_password" };
    default:
      return buildAcademicAudience(draft);
  }
}

export function getCredentialAudienceKey(
  audience: CredentialAudience,
): string {
  return JSON.stringify(audience);
}
