import { describe, expect, it } from "vitest";
import type {
  BackendTimetableConfigDto,
  TimetableDashboardConfigSummaryDto,
} from "@/features/academics/timetable/services/timetableApiTypes";
import { resolveTimetableWorkspaceState } from "@/features/academics/timetable/services/timetableWorkspaceState";

const exactConfig = {
  id: "exact-config",
} as BackendTimetableConfigDto;

const effectiveConfig = {
  id: "effective-config",
  scopeType: "stage",
} as TimetableDashboardConfigSummaryDto;

describe("resolveTimetableWorkspaceState", () => {
  it("uses an exact config as the editable display config", () => {
    expect(
      resolveTimetableWorkspaceState({ exactConfig, effectiveConfig }),
    ).toEqual({
      mode: "exact",
      exactConfig,
      effectiveConfig,
      displayConfigId: "exact-config",
      isInherited: false,
      canEdit: true,
    });
  });

  it("uses the backend-selected effective config as a read-only inherited display", () => {
    expect(
      resolveTimetableWorkspaceState({ exactConfig: null, effectiveConfig }),
    ).toEqual({
      mode: "inherited",
      exactConfig: null,
      effectiveConfig,
      displayConfigId: "effective-config",
      isInherited: true,
      canEdit: false,
    });
  });

  it("reports an unconfigured scope when neither config exists", () => {
    expect(
      resolveTimetableWorkspaceState({
        exactConfig: null,
        effectiveConfig: null,
      }),
    ).toEqual({
      mode: "unconfigured",
      exactConfig: null,
      effectiveConfig: null,
      displayConfigId: null,
      isInherited: false,
      canEdit: false,
    });
  });
});
