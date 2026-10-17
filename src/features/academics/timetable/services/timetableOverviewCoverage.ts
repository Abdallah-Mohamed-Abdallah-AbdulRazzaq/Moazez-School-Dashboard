import type { StructureTree } from "../../academic-structure-tree/services/structureService";
import type {
  TimetableDashboardAllResponseDto,
  TimetableDashboardConfigSummaryDto,
} from "./timetableApiTypes";
import {
  dashboardConfigurationScope,
  timetableTargetPath,
} from "./timetableOverview";
import { classroomsForTimetableScope } from "./timetableDisplayScope";
import { timetableConfigScopeId } from "./timetableScope";

export const coverageCategories = [
  "using",
  "overridden",
  "inherited",
  "uncovered",
] as const;
export type CoverageCategory = (typeof coverageCategories)[number];
const scopeRank: Record<string, number> = {
  TERM: 0,
  STAGE: 1,
  GRADE: 2,
  SECTION: 3,
  CLASSROOM: 4,
};

export function overviewCoverage(
  tree: StructureTree,
  dashboard: TimetableDashboardAllResponseDto,
  config: TimetableDashboardConfigSummaryDto,
) {
  const scope = dashboardConfigurationScope(config);
  const affected = scope ? classroomsForTimetableScope({ ...tree, scope }) : [];
  const effective = new Map(
    dashboard.items.map((item) => [item.classroomId, item.effectiveConfig]),
  );
  const coverage: Record<CoverageCategory, typeof affected> = {
    using: [],
    overridden: [],
    inherited: [],
    uncovered: [],
  };
  affected.forEach((classroom) => {
    const source = effective.get(classroom.id);
    const category = !source
      ? "uncovered"
      : source.id === config.id
        ? "using"
        : scopeRank[source.scopeType.toUpperCase()] >
            scopeRank[config.scopeType.toUpperCase()]
          ? "overridden"
          : "inherited";
    coverage[category].push(classroom);
  });
  return coverage;
}

export function overviewScopePath(
  tree: StructureTree,
  config: TimetableDashboardConfigSummaryDto,
  locale: string,
) {
  const scope = dashboardConfigurationScope(config);
  const id = scope ? timetableConfigScopeId(scope) : undefined;
  return id ? timetableTargetPath(tree, id, locale) : "";
}

export function overviewStageId(
  tree: StructureTree,
  config: TimetableDashboardConfigSummaryDto,
) {
  const scope = dashboardConfigurationScope(config);
  const id = scope ? timetableConfigScopeId(scope) : undefined;
  const classroom = tree.classrooms.find((node) => node.id === id);
  const section = tree.sections.find(
    (node) => node.id === (classroom?.sectionId ?? id),
  );
  const grade = tree.grades.find(
    (node) => node.id === (section?.gradeId ?? id),
  );
  return tree.stages.find((node) => node.id === (grade?.stageId ?? id))?.id;
}

export function overviewStatus(
  config: TimetableDashboardConfigSummaryDto,
  publicationStatus: string | undefined,
) {
  if (publicationStatus === undefined) return "checking";
  if (publicationStatus === "unavailable") return "unknown";
  return publicationStatus === "checked"
    ? config.status.toLowerCase()
    : publicationStatus;
}
