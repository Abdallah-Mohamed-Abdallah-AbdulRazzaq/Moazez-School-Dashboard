import { describe, expect, it } from "vitest";
import type {
  BackendTimetableConfigDto,
  BackendTimetablePeriodDto,
} from "@/features/academics/timetable/services/timetableApiTypes";
import {
  isTimetableSetupReady,
  resolveTimetableSetupStatus,
  type TimetableSetupStatusInput,
} from "@/features/academics/timetable/services/timetableSetupStatus";

const config: BackendTimetableConfigDto = {
  id: "term-config",
  academicYearId: "year-1",
  termId: "term-1",
  name: "Term timetable",
  weekStartDay: 0,
  activeDays: [0, 1, 2, 3, 4],
  scopeType: "term",
  scopeKey: "term:term-1",
  stageId: null,
  gradeId: null,
  sectionId: null,
  classroomId: null,
  status: "draft",
  createdAt: "2026-10-02T00:00:00.000Z",
  updatedAt: "2026-10-02T00:00:00.000Z",
};

const instructionalPeriod: BackendTimetablePeriodDto = {
  id: "period-1",
  timetableConfigId: config.id,
  index: 1,
  label: "Period 1",
  startTime: "08:00",
  endTime: "08:45",
  type: "class",
  isInstructional: true,
  createdAt: "2026-10-02T00:00:00.000Z",
  updatedAt: "2026-10-02T00:00:00.000Z",
};

const setupInput = (
  overrides: Partial<TimetableSetupStatusInput> = {},
): TimetableSetupStatusInput => ({
  config,
  periods: [instructionalPeriod],
  canManage: true,
  termStatus: "open",
  ...overrides,
});

describe("resolveTimetableSetupStatus", () => {
  it("keeps load failures distinct from first-run setup", () => {
    const error = new Error("offline");

    expect(resolveTimetableSetupStatus(setupInput({ error }))).toEqual({
      kind: "error",
      error,
    });
  });

  it("requires config setup when a manageable term has no config", () => {
    expect(
      resolveTimetableSetupStatus(
        setupInput({ config: null, periods: [] }),
      ),
    ).toEqual({ kind: "missing_config", config: null, periods: [] });
  });

  it("requires an instructional period when the config has only breaks", () => {
    const breakPeriod = {
      ...instructionalPeriod,
      type: "break",
      isInstructional: false,
    };

    expect(
      resolveTimetableSetupStatus(setupInput({ periods: [breakPeriod] })),
    ).toEqual({
      kind: "missing_periods",
      config,
      periods: [breakPeriod],
    });
  });

  it("allows an editable draft with an instructional period", () => {
    const status = resolveTimetableSetupStatus(setupInput());

    expect(status).toEqual({
      kind: "ready",
      config,
      periods: [instructionalPeriod],
      readOnly: false,
    });
    expect(isTimetableSetupReady(status)).toBe(true);
  });

  it.each([
    ["closed_term", { termStatus: "closed" as const, canManage: true }],
    ["missing_permission", { termStatus: "open" as const, canManage: false }],
  ])(
    "blocks incomplete setup for %s",
    (reason, access: Pick<TimetableSetupStatusInput, "termStatus" | "canManage">) => {
      expect(
        resolveTimetableSetupStatus(
          setupInput({ config: null, periods: [], ...access }),
        ),
      ).toEqual({
        kind: "read_only",
        readiness: "missing_config",
        reason,
        config: null,
        periods: [],
      });
    },
  );

  it.each([
    ["a published config", { status: "active" }, "open", true],
    ["a closed term", {}, "closed", true],
    ["missing manage permission", {}, "open", false],
  ] as const)(
    "marks %s read-only when setup is complete",
    (_scenario, configPatch, termStatus, canManage) => {
      const status = resolveTimetableSetupStatus(
        setupInput({
          config: { ...config, ...configPatch },
          canManage,
          termStatus,
        }),
      );

      expect(status).toMatchObject({ kind: "ready", readOnly: true });
      expect(isTimetableSetupReady(status)).toBe(true);
    },
  );
});
