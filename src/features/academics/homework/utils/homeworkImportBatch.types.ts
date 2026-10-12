import type { StructureTree } from "@/features/academics/academic-structure-tree/services/structureService";
import type { Subject } from "@/features/academics/subjects/services/subjectsService";
import type { TeacherAllocation } from "@/features/academics/teacher-allocation/services/teacherAllocationService";
import type { StudentEnrollment } from "@/features/students-guardians/students/types";
import type { HomeworkAssignmentUiModel } from "../services/homeworkApi.types";

export type HomeworkBatchSelection =
  | { type: "classes"; classroomIds: string[] }
  | { type: "section" | "grade" | "stage"; id: string }
  | { type: "school" };
export type HomeworkBatchSkip = "missingClass" | "missingAllocation" | "missingTeacher"
  | "ambiguousAllocation" | "noStudents" | "invalidStructure";
type HomeworkBatchRowBase = {
  classroomId: string;
  classroomName: string;
  hierarchy: string;
  studentCount: number;
};
export type HomeworkBatchRow = HomeworkBatchRowBase & (
  | { eligible: true; allocationId: string; teacherUserId: string; teacherName: string }
  | { eligible: false; skipReason: HomeworkBatchSkip; teacherName?: string }
);
export type HomeworkBatchEligibleRow = Extract<HomeworkBatchRow, { eligible: true }>;
export interface HomeworkBatchContext {
  structure: StructureTree;
  subjects: Subject[];
  allocations: TeacherAllocation[];
  enrollments: Array<StudentEnrollment & { id: string }>;
}
export interface HomeworkBatchPlan {
  academicYearId: string;
  termId: string;
  subjectId: string;
  rows: HomeworkBatchRow[];
  signature: string;
}
export type HomeworkBatchResult = { target: HomeworkBatchRow } & (
  | { status: "queued" | "creating" | "skipped" }
  | { status: "created"; assignment: HomeworkAssignmentUiModel }
  | { status: "partial"; homeworkId: string; failedQuestionIndex: number; error: unknown }
  | { status: "failed" | "unconfirmed"; error: unknown }
);
export interface HomeworkBatchPageState {
  hasStarted: boolean;
  isSaving: boolean;
  allCreated: boolean;
}
