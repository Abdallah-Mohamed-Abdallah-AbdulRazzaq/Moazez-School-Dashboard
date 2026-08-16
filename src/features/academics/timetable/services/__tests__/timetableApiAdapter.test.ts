import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "@/lib/api";
import {
  bulkSaveEntries,
  checkConflicts,
  createTimetableApiAdapter,
  createEntry,
  createPeriod,
  deleteEntry,
  deletePeriod,
  getConfig,
  getConflicts,
  getDashboardTimetable,
  getEntry,
  getPreview,
  getPublication,
  listEntries,
  listPeriods,
  publish,
  unpublish,
  updateEntry,
  updatePeriod,
  upsertConfig,
  validate,
} from "@/features/academics/timetable/services/timetableApiAdapter";

vi.mock("@/lib/api", () => ({
  apiDelete: vi.fn(),
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
}));

const mockedApiDelete = vi.mocked(apiDelete);
const mockedApiGet = vi.mocked(apiGet);
const mockedApiPatch = vi.mocked(apiPatch);
const mockedApiPost = vi.mocked(apiPost);
const mockedApiPut = vi.mocked(apiPut);

const dashboardEntry = (
  id: string,
  classroomId: string,
  dayOfWeek: number,
) => ({
  id,
  timetableConfigId: `config-${classroomId}`,
  periodId: `period-${id}`,
  dayOfWeek,
  period: {
    id: `period-${id}`,
    index: dayOfWeek + 1,
    label: `P${dayOfWeek + 1}`,
    startTime: "08:00",
    endTime: "08:45",
  },
  classroom: {
    id: classroomId,
    nameAr: classroomId,
    nameEn: classroomId,
  },
  subject: {
    id: `subject-${id}`,
    nameAr: `Subject ${id}`,
    nameEn: `Subject ${id}`,
  },
  teacher: {
    userId: `teacher-${id}`,
    fullName: `Teacher ${id}`,
  },
  room: null,
  teacherSubjectAllocationId: `allocation-${id}`,
  notes: null,
  status: "active" as const,
  createdAt: "2026-07-31T08:00:00.000Z",
  updatedAt: "2026-07-31T08:00:00.000Z",
});

describe("timetableApiAdapter", () => {
  beforeEach(() => {
    mockedApiDelete.mockReset();
    mockedApiGet.mockReset();
    mockedApiPatch.mockReset();
    mockedApiPost.mockReset();
    mockedApiPut.mockReset();
  });

  it("uses corrected dashboard and config endpoints with query params", async () => {
    mockedApiGet.mockResolvedValueOnce({ items: [] });
    mockedApiGet.mockResolvedValueOnce({ id: "config-1" });
    mockedApiPut.mockResolvedValueOnce({ id: "config-1" });

    await getDashboardTimetable({
      termId: "term-1",
      gradeId: "grade-1",
      classroomId: "classroom-1",
    });
    await getConfig({
      academicYearId: "year-1",
      termId: "term-1",
      scopeType: "GRADE",
      gradeId: "grade-1",
    });
    await upsertConfig({
      academicYearId: "year-1",
      termId: "term-1",
      name: "Grade timetable",
      weekStartDay: 0,
      activeDays: [0, 1, 2, 3, 4],
    });

    expect(mockedApiGet).toHaveBeenNthCalledWith(
      1,
      "/academics/timetable/all",
      {
        params: {
          termId: "term-1",
          gradeId: "grade-1",
          classroomId: "classroom-1",
        },
      },
    );
    expect(mockedApiGet).toHaveBeenNthCalledWith(
      2,
      "/academics/timetable/config",
      {
        params: {
          academicYearId: "year-1",
          termId: "term-1",
          scopeType: "GRADE",
          gradeId: "grade-1",
        },
      },
    );
    expect(mockedApiPut).toHaveBeenCalledWith("/academics/timetable/config", {
      academicYearId: "year-1",
      termId: "term-1",
      name: "Grade timetable",
      weekStartDay: 0,
      activeDays: [0, 1, 2, 3, 4],
    });
  });

  it("uses corrected period endpoints", async () => {
    mockedApiGet.mockResolvedValueOnce({ items: [] });
    mockedApiPost.mockResolvedValueOnce({ id: "period-1" });
    mockedApiPatch.mockResolvedValueOnce({ id: "period-1" });
    mockedApiDelete.mockResolvedValueOnce(undefined);

    await listPeriods("config-1");
    await createPeriod({
      timetableConfigId: "config-1",
      index: 1,
      label: "P1",
      startTime: "08:00",
      endTime: "08:45",
    });
    await updatePeriod("period-1", { label: "Period 1" });
    await deletePeriod("period-1");

    expect(mockedApiGet).toHaveBeenCalledWith("/academics/timetable/periods", {
      params: { timetableConfigId: "config-1" },
    });
    expect(mockedApiPost).toHaveBeenCalledWith("/academics/timetable/periods", {
      timetableConfigId: "config-1",
      index: 1,
      label: "P1",
      startTime: "08:00",
      endTime: "08:45",
    });
    expect(mockedApiPatch).toHaveBeenCalledWith(
      "/academics/timetable/periods/period-1",
      { label: "Period 1" },
    );
    expect(mockedApiDelete).toHaveBeenCalledWith(
      "/academics/timetable/periods/period-1",
    );
  });

  it("uses corrected entry endpoints", async () => {
    const entryPayload = {
      timetableConfigId: "config-1",
      periodId: "period-1",
      dayOfWeek: 1,
      classroomId: "classroom-1",
      teacherSubjectAllocationId: "allocation-1",
      roomId: null,
    };

    mockedApiGet.mockResolvedValueOnce({ items: [] });
    mockedApiGet.mockResolvedValueOnce({ id: "entry-1" });
    mockedApiPost.mockResolvedValueOnce({ id: "entry-1" });
    mockedApiPatch.mockResolvedValueOnce({ id: "entry-1" });
    mockedApiDelete.mockResolvedValueOnce(undefined);
    mockedApiPut.mockResolvedValueOnce({ items: [] });

    await listEntries({
      timetableConfigId: "config-1",
      classroomId: "classroom-1",
      dayOfWeek: 1,
      status: "ACTIVE",
    });
    await getEntry("entry-1");
    await createEntry(entryPayload);
    await updateEntry("entry-1", { notes: "Updated" });
    await deleteEntry("entry-1");
    await bulkSaveEntries({
      termId: "term-1",
      items: [
        {
          classroomId: "classroom-1",
          dayOfWeek: 1,
          periodId: "period-1",
          teacherSubjectAllocationId: "allocation-1",
        },
      ],
    });

    expect(mockedApiGet).toHaveBeenNthCalledWith(
      1,
      "/academics/timetable/entries",
      {
        params: {
          timetableConfigId: "config-1",
          classroomId: "classroom-1",
          dayOfWeek: 1,
          status: "ACTIVE",
        },
      },
    );
    expect(mockedApiGet).toHaveBeenNthCalledWith(
      2,
      "/academics/timetable/entries/entry-1",
    );
    expect(mockedApiPost).toHaveBeenCalledWith(
      "/academics/timetable/entries",
      entryPayload,
    );
    expect(mockedApiPatch).toHaveBeenCalledWith(
      "/academics/timetable/entries/entry-1",
      { notes: "Updated" },
    );
    expect(mockedApiDelete).toHaveBeenCalledWith(
      "/academics/timetable/entries/entry-1",
    );
    expect(mockedApiPut).toHaveBeenCalledWith(
      "/academics/timetable/entries/bulk",
      {
        termId: "term-1",
        items: [
          {
            classroomId: "classroom-1",
            dayOfWeek: 1,
            periodId: "period-1",
            teacherSubjectAllocationId: "allocation-1",
          },
        ],
      },
    );
  });

  it("uses corrected preview, publication, publish, validate, and conflict endpoints", async () => {
    const bulkPayload = {
      termId: "term-1",
      items: [
        {
          classroomId: "classroom-1",
          dayOfWeek: 1,
          periodId: "period-1",
          teacherSubjectAllocationId: "allocation-1",
          roomId: null,
        },
      ],
    };

    mockedApiGet.mockResolvedValue({});
    mockedApiPost.mockResolvedValue(undefined);

    await getPreview("config-1");
    await getConflicts("config-1");
    await getPublication("config-1");
    await publish("config-1");
    await unpublish({ termId: "term-1", gradeId: "grade-1" });
    await validate({ termId: "term-1", classroomId: "classroom-1" });
    await checkConflicts(bulkPayload);

    expect(mockedApiGet).toHaveBeenNthCalledWith(
      1,
      "/academics/timetable/preview",
      { params: { timetableConfigId: "config-1" } },
    );
    expect(mockedApiGet).toHaveBeenNthCalledWith(
      2,
      "/academics/timetable/conflicts",
      { params: { timetableConfigId: "config-1" } },
    );
    expect(mockedApiGet).toHaveBeenNthCalledWith(
      3,
      "/academics/timetable/publication",
      { params: { timetableConfigId: "config-1" } },
    );
    expect(mockedApiPost).toHaveBeenNthCalledWith(
      1,
      "/academics/timetable/publish",
      { timetableConfigId: "config-1" },
    );
    expect(mockedApiPost).toHaveBeenNthCalledWith(
      2,
      "/academics/timetable/unpublish",
      { termId: "term-1", gradeId: "grade-1" },
    );
    expect(mockedApiGet).toHaveBeenNthCalledWith(
      4,
      "/academics/timetable/validate",
      { params: { termId: "term-1", classroomId: "classroom-1" } },
    );
    expect(mockedApiPost).toHaveBeenNthCalledWith(
      3,
      "/academics/timetable/conflicts/check",
      bulkPayload,
    );
  });

  it("does not send a section id as a grade filter through the legacy adapter", async () => {
    mockedApiGet.mockResolvedValueOnce({
      termId: "term-1",
      academicYearId: "year-1",
      publishedAt: null,
      isPublished: false,
      items: [],
    });

    const adapter = createTimetableApiAdapter(() => []);
    await adapter.fetchTimetable("term-1", "section-1");

    expect(mockedApiGet).toHaveBeenCalledWith("/academics/timetable/all", {
      params: { termId: "term-1" },
    });
  });

  it("preserves the grouped dashboard response and reads entries from its classroom items", async () => {
    const response = {
      termId: "term-1",
      academicYearId: "year-1",
      publishedAt: null,
      isPublished: false,
      items: [
        {
          classroomId: "classroom-1",
          classroom: {
            id: "classroom-1",
            nameAr: "Classroom 1",
            nameEn: "Classroom 1",
          },
          gradeId: "grade-1",
          grade: {
            id: "grade-1",
            nameAr: "Grade 1",
            nameEn: "Grade 1",
          },
          configs: [],
          periods: [],
          entries: [dashboardEntry("entry-1", "classroom-1", 1)],
        },
        {
          classroomId: "classroom-2",
          classroom: {
            id: "classroom-2",
            nameAr: "Classroom 2",
            nameEn: "Classroom 2",
          },
          gradeId: "grade-1",
          grade: {
            id: "grade-1",
            nameAr: "Grade 1",
            nameEn: "Grade 1",
          },
          configs: [],
          periods: [],
          entries: [dashboardEntry("entry-2", "classroom-2", 2)],
        },
      ],
    };
    mockedApiGet
      .mockResolvedValueOnce(response)
      .mockResolvedValueOnce(response)
      .mockResolvedValueOnce(response);

    await expect(
      getDashboardTimetable({ termId: "term-1" }),
    ).resolves.toEqual(response);

    const adapter = createTimetableApiAdapter(() => []);
    await expect(
      adapter.fetchTimetable("term-1", "section-1", "classroom-2"),
    ).resolves.toMatchObject([{ id: "entry-2", classroomId: "classroom-2" }]);
    await expect(adapter.fetchAllTimetablesForTerm("term-1")).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "entry-1" }),
        expect.objectContaining({ id: "entry-2" }),
      ]),
    );
  });
});
