import type { ApplicationResponseDto } from "../api/applicationDtos";
import type { ApplicationDocumentResponseDto } from "../api/applicationDocumentDtos";
import type { ApplicationRecord } from "./application";
import type { Application, Document } from "@/features/admissions/types/admissions";

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const requiredString = (record: UnknownRecord, key: string): string => {
  const value = record[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Application response is missing ${key}.`);
  }
  return value;
};

export function mapApplicationDto(value: unknown): ApplicationRecord {
  if (!isRecord(value)) throw new Error("Invalid application response.");
  const dto = value as unknown as ApplicationResponseDto;
  const id = requiredString(value, "id");
  const studentName = requiredString(value, "studentName");
  const createdAt = requiredString(value, "createdAt");
  const updatedAt = requiredString(value, "updatedAt");

  return {
    id,
    leadId: typeof dto.leadId === "string" ? dto.leadId : null,
    studentName,
    requestedAcademicYearId:
      typeof dto.requestedAcademicYearId === "string" ? dto.requestedAcademicYearId : null,
    requestedGradeId:
      typeof dto.requestedGradeId === "string" ? dto.requestedGradeId : null,
    source: dto.source,
    status: dto.status,
    submittedAt: typeof dto.submittedAt === "string" ? dto.submittedAt : null,
    createdAt,
    updatedAt,
    registrationState: dto.registrationState ?? {
      registered: false,
      studentId: null,
      enrollmentId: null,
      enrollmentStatus: null,
      registeredVia: null,
      registeredAt: null,
      source: "derived_from_student_application_id",
    },
    documentsSummary: dto.documentsSummary,
    dashboardState: dto.dashboardState,
  };
}

export function mapApplicationDocumentDto(value: unknown): ApplicationDocumentResponseDto {
  if (!isRecord(value)) throw new Error("Invalid application document response.");
  requiredString(value, "id");
  requiredString(value, "applicationId");
  requiredString(value, "fileId");
  requiredString(value, "documentType");
  return value as unknown as ApplicationDocumentResponseDto;
}

export function toLegacyApplication(record: ApplicationRecord): Application {
  return {
    id: record.id,
    leadId: record.leadId ?? undefined,
    studentName: record.studentName,
    full_name_ar: "",
    full_name_en: record.studentName,
    gender: "",
    date_of_birth: "",
    nationality: "",
    grade_requested: record.requestedGradeId ?? "",
    gradeRequested: record.requestedGradeId ?? "",
    guardianName: "",
    guardianPhone: "",
    guardianEmail: "",
    guardians: [],
    documents: [],
    tests: [],
    interviews: [],
    source: record.source,
    status: record.status,
    submittedDate: record.submittedAt ?? record.createdAt,
    submittedAt: record.submittedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    requestedAcademicYearId: record.requestedAcademicYearId,
    requestedGradeId: record.requestedGradeId,
    registrationState: record.registrationState,
    documentsSummary: record.documentsSummary,
    dashboardState: record.dashboardState,
  };
}

export function toLegacyDocument(dto: ApplicationDocumentResponseDto): Document {
  return {
    id: dto.id,
    type: dto.documentType,
    name: dto.file?.originalName ?? dto.documentType,
    status: dto.status,
    uploadedDate: dto.createdAt,
    url: dto.fileId ? `/api/files/${dto.fileId}/download` : undefined,
    fileType: dto.file?.mimeType?.includes("pdf")
      ? "pdf"
      : dto.file?.mimeType?.startsWith("image/")
        ? "image"
        : undefined,
    labelEn: dto.documentType,
    notes: dto.notes ?? undefined,
    fileId: dto.fileId,
    source: dto.source,
    canReview: dto.canReview,
    reviewEligibility: dto.reviewEligibility,
    linkedApplicantDocument: dto.linkedApplicantDocument,
  };
}
