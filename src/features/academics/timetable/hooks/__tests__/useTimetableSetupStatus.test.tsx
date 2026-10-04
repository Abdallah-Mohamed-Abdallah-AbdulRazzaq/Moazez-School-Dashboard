import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api-error";
import {
  getConfig,
  listPeriods,
} from "@/features/academics/timetable/services/timetableApiAdapter";
import type {
  BackendTimetableConfigDto,
  BackendTimetablePeriodDto,
} from "@/features/academics/timetable/services/timetableApiTypes";
import { useTimetableSetupStatus } from "@/features/academics/timetable/hooks/useTimetableSetupStatus";

vi.mock("@/features/academics/timetable/services/timetableApiAdapter", () => ({
  getConfig: vi.fn(),
  listPeriods: vi.fn(),
}));

const mockedGetConfig = vi.mocked(getConfig);
const mockedListPeriods = vi.mocked(listPeriods);

const termConfig: BackendTimetableConfigDto = {
  id: "term-config-1",
  academicYearId: "year-1",
  termId: "term-1",
  name: "Term 1 timetable",
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
  timetableConfigId: termConfig.id,
  index: 1,
  label: "Period 1",
  startTime: "08:00",
  endTime: "08:45",
  type: "class",
  isInstructional: true,
  createdAt: "2026-10-02T00:00:00.000Z",
  updatedAt: "2026-10-02T00:00:00.000Z",
};

const hookParams = {
  academicYearId: "year-1",
  termId: "term-1",
  termStatus: "open" as const,
  canManage: true,
  enabled: true,
};

describe("useTimetableSetupStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetConfig.mockResolvedValue(termConfig);
    mockedListPeriods.mockResolvedValue({ items: [instructionalPeriod] });
  });

  it("loads readiness from the exact term config", async () => {
    const { result } = renderHook(() =>
      useTimetableSetupStatus(hookParams),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockedGetConfig).toHaveBeenCalledWith({
      academicYearId: "year-1",
      termId: "term-1",
      scopeType: "TERM",
    });
    expect(result.current.status).toMatchObject({
      kind: "ready",
      config: termConfig,
      periods: [instructionalPeriod],
    });
  });

  it("treats only config-not-found as first-run setup", async () => {
    mockedGetConfig.mockRejectedValue(
      new ApiError(
        "Config not found",
        404,
        "academics.timetable.config_not_found",
      ),
    );

    const { result } = renderHook(() =>
      useTimetableSetupStatus(hookParams),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.status).toEqual({
      kind: "missing_config",
      config: null,
      periods: [],
    });
    expect(mockedListPeriods).not.toHaveBeenCalled();
  });

  it("surfaces unrelated request failures as setup errors", async () => {
    const error = new ApiError("Server unavailable", 503, "UNKNOWN");
    mockedGetConfig.mockRejectedValue(error);

    const { result } = renderHook(() =>
      useTimetableSetupStatus(hookParams),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.status).toEqual({ kind: "error", error });
  });

  it("reloads setup after a recoverable failure", async () => {
    mockedGetConfig
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(termConfig);
    const { result } = renderHook(() =>
      useTimetableSetupStatus(hookParams),
    );
    await waitFor(() =>
      expect(result.current.status?.kind).toBe("error"),
    );

    await act(async () => result.current.reload());

    expect(result.current.status?.kind).toBe("ready");
  });

  it("ignores a stale response after the term changes", async () => {
    let resolveFirstRequest!: (config: BackendTimetableConfigDto) => void;
    mockedGetConfig
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveFirstRequest = resolve;
        }),
      )
      .mockResolvedValueOnce({
        ...termConfig,
        id: "term-config-2",
        termId: "term-2",
        scopeKey: "term:term-2",
      });

    const { rerender, result } = renderHook(
      ({ termId }) => useTimetableSetupStatus({ ...hookParams, termId }),
      { initialProps: { termId: "term-1" } },
    );
    rerender({ termId: "term-2" });

    await waitFor(() =>
      expect(result.current.status).toMatchObject({
        config: { id: "term-config-2" },
      }),
    );
    resolveFirstRequest(termConfig);

    await waitFor(() =>
      expect(result.current.status).toMatchObject({
        config: { id: "term-config-2" },
      }),
    );
  });
});
