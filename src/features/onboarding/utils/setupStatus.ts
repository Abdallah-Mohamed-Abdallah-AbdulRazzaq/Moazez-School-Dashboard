import { setupSteps } from "../config/setupSteps";
import type {
  AcademicContextSetupData,
  ResourceState,
  SetupEvaluation,
  SetupSnapshot,
  SetupStepId,
  SetupStepStatus,
  SubjectsSetupData,
} from "../types";
import type { StructureTree } from "@/features/academics/academic-structure-tree/services/structureService";
import type { Room } from "@/features/academics/timetable/types/timetable";
import type { SchoolProfileSettings } from "@/features/settings/types";

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim());
}

export function isSetupSnapshotLoading(snapshot: SetupSnapshot) {
  return Object.values(snapshot).some((resource) => resource.status === "loading");
}

function resourceStatus<T>(
  resource: ResourceState<T>,
  isComplete: (data: T) => boolean,
): { status: Exclude<SetupStepStatus, "locked">; isComplete: boolean; error?: string } {
  if (resource.status === "error") {
    return { status: "error", isComplete: false, error: resource.error };
  }

  if (resource.status === "loading") {
    return { status: "loading", isComplete: false };
  }

  const complete = isComplete(resource.data);
  return { status: complete ? "complete" : "available", isComplete: complete };
}

function hasCompleteOrganization(profile: SchoolProfileSettings) {
  return hasText(profile.schoolName);
}

function hasCompleteAcademicContext(data: AcademicContextSetupData) {
  return data.years.some((year) =>
    (data.termsByYear[year.id] ?? []).some((term) => term.yearId === year.id),
  );
}

function hasCompleteStructure(tree: StructureTree) {
  const stageIds = new Set(tree.stages.map((stage) => stage.id));
  const validGradeIds = new Set(
    tree.grades.filter((grade) => stageIds.has(grade.stageId)).map((grade) => grade.id),
  );

  const validSectionIds = new Set(
    tree.sections.filter((section) => validGradeIds.has(section.gradeId)).map((section) => section.id),
  );

  return tree.classrooms.some((classroom) => validSectionIds.has(classroom.sectionId));
}

function hasCompleteSubjects(data: SubjectsSetupData, tree: StructureTree | undefined) {
  if (!tree || tree.grades.length === 0 || data.subjects.length === 0) {
    return false;
  }

  const subjectIds = new Set(data.subjects.map((subject) => subject.id));
  const gradeIds = new Set(tree.grades.map((grade) => grade.id));

  return data.allocations.some(
    (allocation) =>
      subjectIds.has(allocation.subjectId) &&
      gradeIds.has(allocation.gradeId) &&
      allocation.weeklyHours > 0,
  );
}

function hasCompleteRooms(rooms: Room[]) {
  return rooms.length > 0;
}

function evaluateResource(
  stepId: SetupStepId,
  snapshot: SetupSnapshot,
): { status: Exclude<SetupStepStatus, "locked">; isComplete: boolean; error?: string } {
  switch (stepId) {
    case "organization":
      return resourceStatus(snapshot.organization, hasCompleteOrganization);
    case "academicContext":
      return resourceStatus(snapshot.academicContext, hasCompleteAcademicContext);
    case "structure":
      return resourceStatus(snapshot.structure, hasCompleteStructure);
    case "subjects":
      return resourceStatus(snapshot.subjects, (data) =>
        hasCompleteSubjects(
          data,
          snapshot.structure.status === "success" ? snapshot.structure.data : undefined,
        ),
      );
    case "rooms":
      return resourceStatus(snapshot.rooms, hasCompleteRooms);
  }
}

export function evaluateSetup(snapshot: SetupSnapshot): SetupEvaluation {
  const completed = new Set<SetupStepId>();
  const steps = {} as SetupEvaluation["steps"];

  for (const definition of setupSteps) {
    const lockedBy = definition.prerequisites.filter(
      (prerequisite) => !completed.has(prerequisite),
    );

    if (lockedBy.length > 0) {
      steps[definition.id] = {
        id: definition.id,
        status: "locked",
        isComplete: false,
        lockedBy,
      };
      continue;
    }

    const result = evaluateResource(definition.id, snapshot);
    if (result.isComplete) {
      completed.add(definition.id);
    }

    steps[definition.id] = {
      id: definition.id,
      status: result.status,
      isComplete: result.isComplete,
      lockedBy: [],
      error: result.error,
    };
  }

  const totalCount = setupSteps.length;
  const completedCount = completed.size;

  return {
    steps,
    completedCount,
    totalCount,
    progressPercent: totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100),
    isComplete: completedCount === totalCount,
  };
}
