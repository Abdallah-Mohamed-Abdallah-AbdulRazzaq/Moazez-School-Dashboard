import type {
  TimetableGenerationResponse,
  TimetableGenerationUnresolved,
  TimetableGenerationUnresolvedCode,
} from "@/features/academics/timetable/services/timetableApiTypes";

export interface TimetableGenerationPresentationContext {
  classroomNames: ReadonlyMap<string, string>;
  subjectNames: ReadonlyMap<string, string>;
  unknownClassroomName?: string;
  unknownSubjectName?: string;
}

export interface TimetableGenerationViewModel {
  status: "complete" | "partial" | "budget_exhausted";
  createdCount: number;
  existingCount: number;
  remainingDemandCount: number;
  complete: boolean;
  groups: TimetableGenerationClassroomGroup[];
}

export interface TimetableGenerationClassroomGroup {
  classroomId: string | null;
  classroomName: string;
  items: TimetableGenerationUnresolvedViewModel[];
}

export interface TimetableGenerationUnresolvedViewModel {
  code: TimetableGenerationUnresolvedCode;
  messageKey: TimetableGenerationUnresolvedCode;
  subjectId: string | null;
  subjectName: string;
  requiredWeeklySlots: number | null;
  scheduledWeeklySlots: number | null;
  remainingWeeklySlots: number;
}

export function presentTimetableGeneration(
  response: TimetableGenerationResponse,
  context: TimetableGenerationPresentationContext,
): TimetableGenerationViewModel {
  return {
    status: generationStatus(response),
    createdCount: response.createdCount,
    existingCount: response.existingCount,
    remainingDemandCount: response.remainingDemandCount,
    complete: response.complete,
    groups: groupUnresolvedDemand(response.unresolved, context),
  };
}

function generationStatus(
  response: TimetableGenerationResponse,
): TimetableGenerationViewModel["status"] {
  if (response.searchBudgetExhausted) return "budget_exhausted";
  return response.complete ? "complete" : "partial";
}

function groupUnresolvedDemand(
  unresolvedDemand: TimetableGenerationUnresolved[],
  context: TimetableGenerationPresentationContext,
): TimetableGenerationClassroomGroup[] {
  const groupsByClassroom = new Map<string | null, TimetableGenerationClassroomGroup>();
  unresolvedDemand.forEach((unresolved) =>
    addUnresolvedDemand(groupsByClassroom, unresolved, context),
  );
  return [...groupsByClassroom.values()];
}

function addUnresolvedDemand(
  groupsByClassroom: Map<string | null, TimetableGenerationClassroomGroup>,
  unresolved: TimetableGenerationUnresolved,
  context: TimetableGenerationPresentationContext,
): void {
  const group = groupsByClassroom.get(unresolved.classroomId) ?? createClassroomGroup(unresolved.classroomId, context);
  group.items.push(toUnresolvedViewModel(unresolved, context));
  groupsByClassroom.set(unresolved.classroomId, group);
}

function createClassroomGroup(
  classroomId: string | null,
  context: TimetableGenerationPresentationContext,
): TimetableGenerationClassroomGroup {
  return {
    classroomId,
    classroomName:
      (classroomId && context.classroomNames.get(classroomId)) ??
      context.unknownClassroomName ??
      "Unassigned classroom",
    items: [],
  };
}

function toUnresolvedViewModel(
  unresolved: TimetableGenerationUnresolved,
  context: TimetableGenerationPresentationContext,
): TimetableGenerationUnresolvedViewModel {
  return {
    code: unresolved.code,
    messageKey: unresolved.code,
    subjectId: unresolved.subjectId,
    subjectName:
      (unresolved.subjectId && context.subjectNames.get(unresolved.subjectId)) ??
      context.unknownSubjectName ??
      "Unassigned subject",
    requiredWeeklySlots: unresolved.requiredWeeklySlots,
    scheduledWeeklySlots: unresolved.scheduledWeeklySlots,
    remainingWeeklySlots: unresolved.remainingWeeklySlots,
  };
}
