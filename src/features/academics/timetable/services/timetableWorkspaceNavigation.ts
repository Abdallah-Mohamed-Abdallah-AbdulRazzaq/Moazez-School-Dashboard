import type { TimetableScopeSelection } from "./timetableScope";
import { timetableConfigScopeId } from "./timetableScope";

export function timetableWorkspaceQuery(
  current: string,
  scope: TimetableScopeSelection,
  configurationId?: string,
) {
  const params = new URLSearchParams(current);
  [
    "tab",
    "configure",
    "stage",
    "grade",
    "section",
    "classroom",
    "configuration",
    "scopeId",
    "entry",
  ].forEach((key) => params.delete(key));
  params.set("workspace", "1");
  params.set("configurationScope", scope.scopeType);
  const scopeId = timetableConfigScopeId(scope);
  if (scopeId) params.set("scopeId", scopeId);
  if (configurationId) params.set("configuration", configurationId);
  const filterKeys = {
    stageId: "stage",
    gradeId: "grade",
    sectionId: "section",
    classroomId: "classroom",
  } as const;
  Object.entries(filterKeys).forEach(([field, key]) => {
    const value = scope[field as keyof typeof filterKeys];
    if (value) params.set(key, value);
  });
  return params;
}

export function timetableOverviewQuery(current: string) {
  const params = new URLSearchParams(current);
  [
    "workspace",
    "configure",
    "configurationScope",
    "scopeId",
    "configuration",
    "entry",
    "stage",
    "grade",
    "section",
    "classroom",
    "tab",
  ].forEach((key) => params.delete(key));
  return params;
}
