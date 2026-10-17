import type {
  BackendTimetableEntryDto,
  TimetableDashboardConfigSummaryDto,
  TimetableScopeType,
} from "./timetableApiTypes";
import { dashboardConfigScopeId } from "./timetableDashboardContract";
import type { TimetableScopeSelection } from "./timetableScope";

const scopeFields = {
  STAGE: "stageId",
  GRADE: "gradeId",
  SECTION: "sectionId",
  CLASSROOM: "classroomId",
} as const;
export const conflictLinkParams = [
  "configuration",
  "configurationScope",
  "scopeId",
  "entry",
] as const;

export function conflictTimetableHref({
  locale,
  academicYearId,
  termId,
  lesson,
  configuration,
}: {
  locale: string;
  academicYearId: string;
  termId: string;
  lesson: BackendTimetableEntryDto;
  configuration: TimetableDashboardConfigSummaryDto | null;
}) {
  const params = new URLSearchParams({
    year: academicYearId,
    term: termId,
    classroom: lesson.classroom.id,
    configuration: lesson.timetableConfigId,
    entry: lesson.id,
  });
  params.set(
    "configurationScope",
    configuration?.scopeType.toUpperCase() ?? "CLASSROOM",
  );
  const scopeId = configuration
    ? dashboardConfigScopeId(configuration)
    : lesson.classroom.id;
  if (scopeId) params.set("scopeId", scopeId);
  return `/${locale}/academics/timetable?${params}`;
}

export function conflictLinkScope(params: {
  get: (key: string) => string | null;
}): TimetableScopeSelection | null {
  const scopeType = params.get("configurationScope")?.toUpperCase() as
    TimetableScopeType | undefined;
  if (scopeType === "TERM") return { scopeType };
  const scopeId = params.get("scopeId");
  if (!scopeType || !(scopeType in scopeFields) || !scopeId) return null;
  return {
    scopeType,
    [scopeFields[scopeType as keyof typeof scopeFields]]: scopeId,
  };
}
