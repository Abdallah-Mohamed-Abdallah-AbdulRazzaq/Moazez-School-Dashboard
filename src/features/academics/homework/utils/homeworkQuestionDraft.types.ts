import type { AssignmentQuestion } from "@/features/academics/curriculum/services/curriculumService";
import type { CreateHomeworkAssignmentRequest } from "../services/homeworkApi.types";

export type HomeworkDraftMetadata = Pick<CreateHomeworkAssignmentRequest,
  "title" | "description" | "mode" | "dueAt" | "isGraded" | "totalMarks" | "estimatedMinutes">;
export interface HomeworkQuestionDraft {
  metadata: HomeworkDraftMetadata;
  questions: AssignmentQuestion[];
}
export interface HomeworkDraftValidationContext {
  now: Date;
  termStart: string;
  termEnd: string;
  publishAt?: string | null;
}
export type HomeworkDraftIssue = (
  | { scope: "metadata"; field: string }
  | { scope: "question"; questionId: string; field: string }
) & { messageKey: string; values?: Record<string, string | number> };
export type HomeworkDraftValidation =
  | { kind: "valid"; warnings: HomeworkDraftIssue[] }
  | { kind: "invalid"; issues: HomeworkDraftIssue[] };

export const HOMEWORK_DRAFT_LIMITS = {
  questions: 500, points: 99999.99, minutes: 2147483647,
} as const;
export const HOMEWORK_MODES = ["homework", "worksheet", "writing_task", "quiz", "reading", "project"] as const;
