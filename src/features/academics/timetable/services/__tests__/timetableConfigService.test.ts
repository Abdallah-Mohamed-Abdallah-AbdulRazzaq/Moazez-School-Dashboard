import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet, apiPut } from "@/lib/api";
import { ApiError } from "@/lib/api-error";
import {
  fetchTimetableConfig,
  fetchTimetableConfigs,
  upsertTimetableConfig,
} from "@/features/academics/timetable/services/timetableConfigService";

vi.mock("@/lib/api", () => ({
  apiGet: vi.fn(),
  apiPut: vi.fn(),
}));

const mockedApiGet = vi.mocked(apiGet);
const mockedApiPut = vi.mocked(apiPut);

const backendConfig = {
  id: "config-1",
  academicYearId: "year-1",
  termId: "term-1",
  name: "Term timetable",
  weekStartDay: 0,
  activeDays: [0, 1, 2, 3, 4],
  scopeType: "term" as const,
  scopeKey: "term-1",
  gradeId: null,
  sectionId: null,
  classroomId: null,
  status: "draft",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
};

const backendPeriod = {
  id: "period-1",
  timetableConfigId: "config-1",
  index: 1,
  label: "Period 1",
  startTime: "08:00",
  endTime: "08:45",
  type: "class",
  isInstructional: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
};

describe("timetableConfigService", () => {
  beforeEach(() => {
    mockedApiGet.mockReset();
    mockedApiPut.mockReset();
  });

  it("fetches a real backend config and its periods", async () => {
    mockedApiGet.mockResolvedValueOnce({ data: backendConfig });
    mockedApiGet.mockResolvedValueOnce({ items: [backendPeriod] });

    await expect(
      fetchTimetableConfig({
        academicYearId: "year-1",
        termId: "term-1",
        scopeType: "TERM",
      }),
    ).resolves.toEqual({
      id: "config-1",
      termId: "term-1",
      scopeType: "TERM",
      scopeId: undefined,
      days: expect.arrayContaining([
        expect.objectContaining({ key: "sun", index: 0, isActive: true }),
        expect.objectContaining({ key: "fri", index: 5, isActive: false }),
      ]),
      periods: [
        {
          id: "period-1",
          index: 1,
          nameAr: "Period 1",
          nameEn: "Period 1",
          startTime: "08:00",
          endTime: "08:45",
        },
      ],
      updatedAt: "2026-01-02T00:00:00.000Z",
    });
    expect(mockedApiGet).toHaveBeenNthCalledWith(
      1,
      "/academics/timetable/config",
      {
        params: {
          academicYearId: "year-1",
          termId: "term-1",
          scopeType: "TERM",
        },
      },
    );
    expect(mockedApiGet).toHaveBeenNthCalledWith(
      2,
      "/academics/timetable/periods",
      { params: { timetableConfigId: "config-1" } },
    );
  });

  it("returns null instead of inventing a default config when backend has none", async () => {
    mockedApiGet.mockRejectedValueOnce(
      new ApiError(
        "Config not found",
        404,
        "academics.timetable.config_not_found",
      ),
    );

    await expect(
      fetchTimetableConfig({
        academicYearId: "year-1",
        termId: "term-1",
        scopeType: "TERM",
      }),
    ).resolves.toBeNull();
    expect(mockedApiGet).toHaveBeenCalledTimes(1);
  });

  it("propagates other 404 errors instead of treating them as a missing config", async () => {
    const error = new ApiError(
      "Classroom not found",
      404,
      "academics.timetable.classroom_not_found",
    );
    mockedApiGet.mockRejectedValueOnce(error);

    await expect(
      fetchTimetableConfig({
        academicYearId: "year-1",
        termId: "term-1",
        scopeType: "CLASSROOM",
        gradeId: "grade-1",
        sectionId: "section-1",
        classroomId: "classroom-1",
      }),
    ).rejects.toBe(error);
  });

  it("fetches only real scope configs for the selected timetable target", async () => {
    mockedApiGet.mockImplementation(async (url, config) => {
      if (url === "/academics/timetable/periods") {
        return { items: [] };
      }
      if (
        url === "/academics/timetable/config" &&
        config?.params?.scopeType === "TERM"
      ) {
        return backendConfig;
      }
      throw new ApiError(
        "Config not found",
        404,
        "academics.timetable.config_not_found",
      );
    });

    await expect(
      fetchTimetableConfigs({
        academicYearId: "year-1",
        termId: "term-1",
        gradeId: "grade-1",
      }),
    ).resolves.toEqual([
      expect.objectContaining({ id: "config-1", scopeType: "TERM" }),
    ]);

    expect(mockedApiGet).toHaveBeenCalledWith("/academics/timetable/config", {
      params: {
        academicYearId: "year-1",
        termId: "term-1",
        scopeType: "GRADE",
        gradeId: "grade-1",
      },
    });
  });

  it("preserves grade and section ancestors in narrow config lookups", async () => {
    mockedApiGet.mockRejectedValue(
      new ApiError(
        "Config not found",
        404,
        "academics.timetable.config_not_found",
      ),
    );

    await fetchTimetableConfigs({
      academicYearId: "year-1",
      termId: "term-1",
      gradeId: "grade-1",
      sectionId: "section-1",
      classroomId: "classroom-1",
    });

    expect(mockedApiGet).toHaveBeenCalledWith("/academics/timetable/config", {
      params: {
        academicYearId: "year-1",
        termId: "term-1",
        scopeType: "SECTION",
        gradeId: "grade-1",
        sectionId: "section-1",
      },
    });
    expect(mockedApiGet).toHaveBeenCalledWith("/academics/timetable/config", {
      params: {
        academicYearId: "year-1",
        termId: "term-1",
        scopeType: "CLASSROOM",
        gradeId: "grade-1",
        sectionId: "section-1",
        classroomId: "classroom-1",
      },
    });
  });

  it("upserts config through the backend without local ids or default config storage", async () => {
    mockedApiPut.mockResolvedValueOnce({ data: backendConfig });
    mockedApiGet.mockResolvedValueOnce({ items: [] });

    await upsertTimetableConfig({
      academicYearId: "year-1",
      termId: "term-1",
      scopeType: "TERM",
      days: [
        { key: "sun", index: 0, nameAr: "Sunday", nameEn: "Sunday", isActive: true },
        { key: "mon", index: 1, nameAr: "Monday", nameEn: "Monday", isActive: true },
      ],
      periods: [],
    });

    expect(mockedApiPut).toHaveBeenCalledWith("/academics/timetable/config", {
      academicYearId: "year-1",
      termId: "term-1",
      scopeType: "TERM",
      gradeId: undefined,
      sectionId: undefined,
      classroomId: undefined,
      name: "TERM timetable config",
      weekStartDay: 0,
      activeDays: [0, 1],
      status: "DRAFT",
    });
  });
});
