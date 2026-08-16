import type {
  AcademicYear,
  StructureTree,
  Term,
} from "@/features/academics/academic-structure-tree/services/structureService";
import type {
  Subject,
  SubjectAllocation,
} from "@/features/academics/subjects/services/subjectsService";
import type { Room } from "@/features/academics/timetable/types/timetable";
import type { SchoolProfileSettings } from "@/features/settings/types";

export type SetupStepId =
  | "organization"
  | "academicContext"
  | "structure"
  | "subjects"
  | "rooms";

export type ResourceState<T> =
  | { status: "loading"; data?: T; error?: undefined }
  | { status: "success"; data: T; error?: undefined }
  | { status: "error"; data?: T; error: string };

export interface AcademicContextSetupData {
  years: AcademicYear[];
  termsByYear: Record<string, Term[]>;
}

export interface SubjectsSetupData {
  subjects: Subject[];
  allocations: SubjectAllocation[];
}

export interface SetupSnapshot {
  organization: ResourceState<SchoolProfileSettings>;
  academicContext: ResourceState<AcademicContextSetupData>;
  structure: ResourceState<StructureTree>;
  subjects: ResourceState<SubjectsSetupData>;
  rooms: ResourceState<Room[]>;
}

export interface SetupStepDefinition {
  id: SetupStepId;
  translationKey: string;
  prerequisites: SetupStepId[];
}

export type SetupStepStatus = "complete" | "available" | "locked" | "loading" | "error";

export interface SetupStepEvaluation {
  id: SetupStepId;
  status: SetupStepStatus;
  isComplete: boolean;
  lockedBy: SetupStepId[];
  error?: string;
}

export interface SetupEvaluation {
  steps: Record<SetupStepId, SetupStepEvaluation>;
  completedCount: number;
  totalCount: number;
  progressPercent: number;
  isComplete: boolean;
}
