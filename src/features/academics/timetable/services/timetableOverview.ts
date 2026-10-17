import type { StructureTree } from "../../academic-structure-tree/services/structureService";
import type {
  TimetableDashboardAllResponseDto,
  TimetableDashboardConfigSummaryDto,
} from "./timetableApiTypes";
import { dashboardConfigScopeId } from "./timetableDashboardContract";
import type { TimetableScopeSelection } from "./timetableScope";
import { classroomsForTimetableScope } from "./timetableDisplayScope";

export function dashboardConfigurationScope(
  config: TimetableDashboardConfigSummaryDto,
): TimetableScopeSelection | null {
  const scopeId = dashboardConfigScopeId(config);
  switch (config.scopeType.toUpperCase()) {
    case "TERM":
      return { scopeType: "TERM" };
    case "STAGE":
      return scopeId ? { scopeType: "STAGE", stageId: scopeId } : null;
    case "GRADE":
      return scopeId ? { scopeType: "GRADE", gradeId: scopeId } : null;
    case "SECTION":
      return scopeId ? { scopeType: "SECTION", sectionId: scopeId } : null;
    case "CLASSROOM":
      return scopeId ? { scopeType: "CLASSROOM", classroomId: scopeId } : null;
    default:
      return null;
  }
}

export function overviewConfigurations(
  dashboard: TimetableDashboardAllResponseDto,
  additionalConfigs: TimetableDashboardConfigSummaryDto[],
) {
  const configs = new Map(
    additionalConfigs.map((config) => [config.id, config]),
  );
  dashboard.items.forEach((item) => {
    item.configs.forEach((config) => configs.set(config.id, config));
    if (item.effectiveConfig)
      configs.set(item.effectiveConfig.id, item.effectiveConfig);
  });
  return [...configs.values()].sort(
    (a, b) =>
      Number(b.scopeType.toUpperCase() === "TERM") -
      Number(a.scopeType.toUpperCase() === "TERM"),
  );
}

export function emptyTimetableScopes(
  tree: StructureTree,
): TimetableScopeSelection[] {
  const scopes: TimetableScopeSelection[] = [
    ...tree.stages.map((stage) => ({
      scopeType: "STAGE" as const,
      stageId: stage.id,
    })),
    ...tree.grades.map((grade) => ({
      scopeType: "GRADE" as const,
      gradeId: grade.id,
    })),
    ...tree.sections.map((section) => ({
      scopeType: "SECTION" as const,
      sectionId: section.id,
    })),
  ];
  return scopes.filter(
    (scope) => classroomsForTimetableScope({ ...tree, scope }).length === 0,
  );
}

export function timetableScopeTargets(
  tree: StructureTree,
  scopeType: Exclude<TimetableScopeSelection["scopeType"], "TERM">,
  locale: string,
) {
  const nodes = {
    STAGE: tree.stages,
    GRADE: tree.grades,
    SECTION: tree.sections,
    CLASSROOM: tree.classrooms,
  }[scopeType];
  return nodes.map((node) => ({
    value: node.id,
    label: timetableTargetPath(tree, node.id, locale),
  }));
}

export function timetableTargetPath(
  tree: StructureTree,
  id: string,
  locale: string,
): string {
  const classroom = tree.classrooms.find((node) => node.id === id);
  const section = tree.sections.find(
    (node) => node.id === (classroom?.sectionId ?? id),
  );
  const grade = tree.grades.find(
    (node) => node.id === (section?.gradeId ?? id),
  );
  const stage = tree.stages.find((node) => node.id === (grade?.stageId ?? id));
  return [stage, grade, section, classroom]
    .filter((node) => !!node)
    .map((node) =>
      locale === "ar" ? node.nameAr || node.name : node.nameEn || node.name,
    )
    .join(" › ");
}
