import type {
  BackendTimetableConfigDto,
  TimetableDashboardConfigSummaryDto,
} from "@/features/academics/timetable/services/timetableApiTypes";

export type TimetableWorkspaceMode = "exact" | "inherited" | "unconfigured";

export interface TimetableWorkspaceState {
  mode: TimetableWorkspaceMode;
  exactConfig: BackendTimetableConfigDto | null;
  effectiveConfig: TimetableDashboardConfigSummaryDto | null;
  displayConfigId: string | null;
  isInherited: boolean;
  canEdit: boolean;
}

interface TimetableWorkspaceConfigs {
  exactConfig: BackendTimetableConfigDto | null;
  effectiveConfig: TimetableDashboardConfigSummaryDto | null;
}

export function resolveTimetableWorkspaceState({
  exactConfig,
  effectiveConfig,
}: TimetableWorkspaceConfigs): TimetableWorkspaceState {
  if (exactConfig) {
    return {
      mode: "exact",
      exactConfig,
      effectiveConfig,
      displayConfigId: exactConfig.id,
      isInherited: false,
      canEdit: true,
    };
  }
  if (effectiveConfig) {
    return {
      mode: "inherited",
      exactConfig: null,
      effectiveConfig,
      displayConfigId: effectiveConfig.id,
      isInherited: true,
      canEdit: false,
    };
  }
  return {
    mode: "unconfigured",
    exactConfig: null,
    effectiveConfig: null,
    displayConfigId: null,
    isInherited: false,
    canEdit: false,
  };
}
