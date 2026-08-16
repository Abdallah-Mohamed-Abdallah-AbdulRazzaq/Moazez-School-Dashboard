import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import {
  createTimetablePeriod,
  createTimetablePeriodDto,
  deleteTimetablePeriod,
  listTimetablePeriodDtos,
  listTimetablePeriods,
  updateTimetablePeriod,
  updateTimetablePeriodDto,
} from "@/features/academics/timetable/services/timetablePeriodsService";

vi.mock("@/lib/api", () => ({
  apiDelete: vi.fn(),
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  apiPost: vi.fn(),
}));

const mockedApiDelete = vi.mocked(apiDelete);
const mockedApiGet = vi.mocked(apiGet);
const mockedApiPatch = vi.mocked(apiPatch);
const mockedApiPost = vi.mocked(apiPost);

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

describe("timetablePeriodsService", () => {
  beforeEach(() => {
    mockedApiDelete.mockReset();
    mockedApiGet.mockReset();
    mockedApiPatch.mockReset();
    mockedApiPost.mockReset();
  });

  it("lists periods from the backend periods endpoint", async () => {
    mockedApiGet.mockResolvedValueOnce({ items: [backendPeriod] });

    await expect(listTimetablePeriods("config-1")).resolves.toEqual([
      {
        id: "period-1",
        index: 1,
        nameAr: "Period 1",
        nameEn: "Period 1",
        startTime: "08:00",
        endTime: "08:45",
      },
    ]);
    expect(mockedApiGet).toHaveBeenCalledWith("/academics/timetable/periods", {
      params: { timetableConfigId: "config-1" },
    });
  });

  it("lists backend period DTOs without dropping backend-only fields", async () => {
    mockedApiGet.mockResolvedValueOnce({ items: [backendPeriod] });

    await expect(listTimetablePeriodDtos("config-1")).resolves.toEqual([
      backendPeriod,
    ]);
  });

  it("creates, updates, and deletes periods with real backend period endpoints", async () => {
    mockedApiPost.mockResolvedValueOnce(backendPeriod);
    mockedApiPatch.mockResolvedValueOnce({ ...backendPeriod, label: "Updated" });
    mockedApiDelete.mockResolvedValueOnce(undefined);

    await createTimetablePeriod({
      timetableConfigId: "config-1",
      index: 1,
      label: "Period 1",
      startTime: "08:00",
      endTime: "08:45",
    });
    await updateTimetablePeriod("period-1", { label: "Updated" });
    await deleteTimetablePeriod("period-1");

    expect(mockedApiPost).toHaveBeenCalledWith("/academics/timetable/periods", {
      timetableConfigId: "config-1",
      index: 1,
      label: "Period 1",
      startTime: "08:00",
      endTime: "08:45",
    });
    expect(mockedApiPatch).toHaveBeenCalledWith(
      "/academics/timetable/periods/period-1",
      { label: "Updated" },
    );
    expect(mockedApiDelete).toHaveBeenCalledWith(
      "/academics/timetable/periods/period-1",
    );
  });

  it("creates and updates backend period DTOs without UI mapping", async () => {
    mockedApiPost.mockResolvedValueOnce(backendPeriod);
    mockedApiPatch.mockResolvedValueOnce({ ...backendPeriod, type: "break" });

    await expect(
      createTimetablePeriodDto({
        timetableConfigId: "config-1",
        index: 1,
        label: "Period 1",
        startTime: "08:00",
        endTime: "08:45",
        type: "CLASS",
        isInstructional: true,
      }),
    ).resolves.toEqual(backendPeriod);
    await expect(
      updateTimetablePeriodDto("period-1", {
        type: "BREAK",
        isInstructional: false,
      }),
    ).resolves.toEqual({ ...backendPeriod, type: "break" });
  });
});
