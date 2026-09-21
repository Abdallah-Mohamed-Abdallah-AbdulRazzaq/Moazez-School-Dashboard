import type {
  BackendTimetableEntryDto,
  BackendTimetablePeriodDto,
  TimetableDashboardConfigSummaryDto,
  TimetableDashboardItemDto,
} from "@/features/academics/timetable/services/timetableApiTypes";

export interface EffectiveDashboardTimetable {
  config: TimetableDashboardConfigSummaryDto;
  periods: BackendTimetablePeriodDto[];
  entries: BackendTimetableEntryDto[];
}

export function resolveEffectiveDashboardTimetable(
  dashboardItem: TimetableDashboardItemDto,
): EffectiveDashboardTimetable | null {
  const config = dashboardItem.effectiveConfig;
  if (!config) return null;

  return {
    config,
    periods: dashboardItem.periods.filter(
      (period) => period.timetableConfigId === config.id,
    ),
    entries: dashboardItem.entries.filter(
      (entry) => entry.timetableConfigId === config.id,
    ),
  };
}

export function dashboardConfigScopeId(
  config: TimetableDashboardConfigSummaryDto,
): string | undefined {
  if (config.scopeType.toUpperCase() === "STAGE" && config.stageId) {
    return config.stageId;
  }

  const keyParts = config.scopeKey.split(":");
  if (keyParts.length !== 2) return undefined;

  const [scopePrefix, scopeId] = keyParts;
  if (
    scopePrefix.toUpperCase() !== config.scopeType.toUpperCase() ||
    !scopeId
  ) {
    return undefined;
  }

  return scopeId;
}
