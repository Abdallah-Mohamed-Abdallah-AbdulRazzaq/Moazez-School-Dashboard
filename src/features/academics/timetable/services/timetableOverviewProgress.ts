import type { StructureTree } from "../../academic-structure-tree/services/structureService";
import type {
  PublicationResponse,
  TimetableDashboardConfigSummaryDto,
} from "./timetableApiTypes";
import { dashboardConfigurationScope } from "./timetableOverview";
import { timetableConfigScopeId } from "./timetableScope";

export type OverviewNextStep =
  | "configuration"
  | "periods"
  | "schedule"
  | "review"
  | "published"
  | "archived"
  | "unknown";
export type OverviewAttention =
  "setup" | "review" | "uncovered" | "unavailable";

export function overviewProgress(
  config: TimetableDashboardConfigSummaryDto,
  publication: PublicationResponse | undefined,
  status: string,
) {
  if (status === "published")
    return { step: "published" as const, completed: 3, needsReview: false };
  if (status === "archived")
    return {
      step: "archived" as const,
      completed: undefined,
      needsReview: false,
    };
  const summary = publication?.summary;
  const daysConfigured = (summary?.activeDays ?? config.activeDays).length > 0;
  const completed =
    Number(daysConfigured) +
    Number((summary?.instructionalPeriodsCount ?? 0) > 0) +
    Number((summary?.entriesCount ?? 0) > 0);
  let step: OverviewNextStep = "unknown";
  if (!daysConfigured) step = "configuration";
  else if (summary) {
    if (!summary.instructionalPeriodsCount) step = "periods";
    else if (!summary.entriesCount) step = "schedule";
    else step = "review";
  }
  return {
    step,
    completed: summary ? completed : undefined,
    needsReview:
      step === "review" &&
      !!publication &&
      (publication.blockingReasons.length > 0 ||
        (summary?.conflictsCount ?? 0) > 0),
  };
}

export function overviewParentConfiguration(
  tree: StructureTree,
  config: TimetableDashboardConfigSummaryDto,
  configurations: TimetableDashboardConfigSummaryDto[],
) {
  const scope = dashboardConfigurationScope(config);
  if (!scope || scope.scopeType === "TERM") return undefined;
  const id = timetableConfigScopeId(scope);
  const classroom =
    scope.scopeType === "CLASSROOM"
      ? tree.classrooms.find((node) => node.id === id)
      : undefined;
  const section = tree.sections.find(
    (node) =>
      node.id ===
      (classroom?.sectionId ??
        (scope.scopeType === "SECTION" ? id : undefined)),
  );
  const grade = tree.grades.find(
    (node) =>
      node.id ===
      (section?.gradeId ?? (scope.scopeType === "GRADE" ? id : undefined)),
  );
  const ancestors = [
    { type: "SECTION", id: classroom?.sectionId },
    { type: "GRADE", id: section?.gradeId },
    { type: "STAGE", id: grade?.stageId },
  ];
  for (const ancestor of ancestors) {
    if (!ancestor.id) continue;
    const parent = configurations.find((candidate) => {
      const parentScope = dashboardConfigurationScope(candidate);
      return (
        parentScope?.scopeType === ancestor.type &&
        timetableConfigScopeId(parentScope) === ancestor.id
      );
    });
    if (parent) return parent;
  }
  return configurations.find(
    (candidate) => candidate.scopeType.toUpperCase() === "TERM",
  );
}
