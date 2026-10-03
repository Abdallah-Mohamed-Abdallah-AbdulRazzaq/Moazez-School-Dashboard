import type {
  BackendTimetableConfigDto,
  BackendTimetablePeriodDto,
} from "@/features/academics/timetable/services/timetableApiTypes";

type IncompleteSetupKind = "missing_config" | "missing_periods";
type ReadOnlySetupReason = "closed_term" | "missing_permission";

interface SetupRecords {
  config: BackendTimetableConfigDto | null;
  periods: BackendTimetablePeriodDto[];
}

export type TimetableSetupStatus =
  | ({ kind: "missing_config"; config: null; periods: [] })
  | ({ kind: "missing_periods" } & SetupRecords & {
      config: BackendTimetableConfigDto;
    })
  | ({ kind: "ready"; readOnly: boolean } & SetupRecords & {
      config: BackendTimetableConfigDto;
    })
  | ({
      kind: "read_only";
      readiness: IncompleteSetupKind;
      reason: ReadOnlySetupReason;
    } & SetupRecords)
  | { kind: "error"; error: unknown };

export interface TimetableSetupStatusInput extends SetupRecords {
  canManage: boolean;
  termStatus: "open" | "closed";
  error?: unknown;
}

interface ReadySetupInput extends Omit<TimetableSetupStatusInput, "config"> {
  config: BackendTimetableConfigDto;
}

export function resolveTimetableSetupStatus(
  input: TimetableSetupStatusInput,
): TimetableSetupStatus {
  if (input.error !== undefined) {
    return { kind: "error", error: input.error };
  }
  if (!input.config) return missingConfigStatus(input);
  const configuredInput = { ...input, config: input.config };
  if (!hasInstructionalPeriod(input.periods)) {
    return missingPeriodsStatus(configuredInput);
  }
  return readySetupStatus(configuredInput);
}

export function isTimetableSetupReady(
  status: TimetableSetupStatus,
): status is Extract<TimetableSetupStatus, { kind: "ready" }> {
  return status.kind === "ready";
}

function hasInstructionalPeriod(periods: BackendTimetablePeriodDto[]): boolean {
  return periods.some((period) => period.isInstructional);
}

function readySetupStatus(
  input: ReadySetupInput,
): Extract<TimetableSetupStatus, { kind: "ready" }> {
  return {
    kind: "ready",
    ...setupRecords(input),
    config: input.config,
    readOnly:
      input.termStatus === "closed" ||
      !input.canManage ||
      input.config.status.toLowerCase() !== "draft",
  };
}

function missingConfigStatus(
  input: TimetableSetupStatusInput,
): TimetableSetupStatus {
  if (input.termStatus === "open" && input.canManage) {
    return { kind: "missing_config", config: null, periods: [] };
  }
  return {
    kind: "read_only",
    readiness: "missing_config",
    reason:
      input.termStatus === "closed" ? "closed_term" : "missing_permission",
    config: null,
    periods: [],
  };
}

function missingPeriodsStatus(
  input: ReadySetupInput,
): TimetableSetupStatus {
  if (input.termStatus === "open" && input.canManage) {
    return { kind: "missing_periods", ...setupRecords(input), config: input.config };
  }
  return {
    kind: "read_only",
    readiness: "missing_periods",
    reason:
      input.termStatus === "closed" ? "closed_term" : "missing_permission",
    ...setupRecords(input),
  };
}

function setupRecords(input: TimetableSetupStatusInput): SetupRecords {
  return { config: input.config, periods: input.periods };
}
