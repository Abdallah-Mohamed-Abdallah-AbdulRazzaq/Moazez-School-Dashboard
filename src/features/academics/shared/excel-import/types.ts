import type { AssignmentQuestion } from "@/features/academics/curriculum/services/curriculumService";
import type { CreateHomeworkAssignmentRequest } from "@/features/academics/homework/services/homeworkApi.types";
import type { AssessmentQuestion, CreateAssessmentPayload } from "@/features/grades/shared/types";

export type ImportModule = "assignment" | "assessment";
export type ImportLocale = "ar" | "en";
export type ImportCell = string | number | boolean | null;
export type ImportSheet = "Details" | "Questions" | "Choices";
export interface ImportRow { rowNumber: number; cells: Record<string, ImportCell> }
export interface ImportWorkbookRows {
  module: ImportModule;
  details: ImportRow;
  questions: ImportRow[];
  choices: ImportRow[];
}
export interface ImportIssue {
  sheet: ImportSheet | "File";
  row: number;
  field: string;
  messageKey: string;
  values?: Record<string, string | number>;
}
export type ImportValidation<T> =
  | { kind: "valid"; draft: T; warnings: ImportIssue[] }
  | { kind: "invalid"; issues: ImportIssue[] };
export interface ImportContext {
  now: Date;
  termStart: string;
  termEnd: string;
  publishAt?: string | null;
}
export type HomeworkImportMetadata = Pick<CreateHomeworkAssignmentRequest,
  "title" | "description" | "mode" | "dueAt" | "isGraded" | "totalMarks" | "estimatedMinutes">;
export type AssessmentImportMetadata = Pick<CreateAssessmentPayload,
  "title" | "titleAr" | "type" | "date" | "weight" | "maxScore" | "expectedTimeMinutes" | "deliveryMode">;
export interface HomeworkImport {
  module: "assignment";
  metadata: HomeworkImportMetadata;
  questions: AssignmentQuestion[];
  source: ImportWorkbookRows;
}
export interface AssessmentImport {
  module: "assessment";
  metadata: AssessmentImportMetadata;
  questions: AssessmentQuestion[];
  source: ImportWorkbookRows;
}
export type ImportedDraft = HomeworkImport | AssessmentImport;
