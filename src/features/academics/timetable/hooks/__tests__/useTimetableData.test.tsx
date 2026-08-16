import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api-error";
import {
  fetchAcademicYears,
  fetchStructureTree,
} from "@/features/academics/academic-structure-tree/services/structureService";
import {
  fetchSubjectAllocations,
  fetchSubjects,
} from "@/features/academics/subjects/services/subjectsService";
import {
  fetchTeacherAllocations,
  fetchTeachers,
} from "@/features/academics/teacher-allocation/services/teacherAllocationService";
import { fetchRooms } from "@/features/academics/rooms/services/roomsService";
import {
  bulkSaveEntries,
  checkConflicts,
  deleteEntry,
  getConfig,
  getPublication,
  listEntries,
  listPeriods,
  publish,
  unpublish,
  validate,
} from "@/features/academics/timetable/services/timetableApiAdapter";
import { useTimetableData } from "@/features/academics/timetable/hooks/useTimetableData";
import type {
  BackendTimetableConfigDto,
  BackendTimetableEntryDto,
  BackendTimetablePeriodDto,
  PublicationResponse,
  TimetableValidationResponse,
} from "@/features/academics/timetable/services/timetableApiTypes";
import {
  validationSummaryFromResponse,
} from "@/features/academics/timetable/services/timetableValidationSummary";

vi.mock("@/features/academics/academic-structure-tree/services/structureService", () => ({
  fetchAcademicYears: vi.fn(),
  fetchStructureTree: vi.fn(),
}));

vi.mock("@/features/academics/subjects/services/subjectsService", () => ({
  fetchSubjectAllocations: vi.fn(),
  fetchSubjects: vi.fn(),
}));

vi.mock("@/features/academics/teacher-allocation/services/teacherAllocationService", () => ({
  fetchTeacherAllocations: vi.fn(),
  fetchTeachers: vi.fn(),
}));

vi.mock("@/features/academics/rooms/services/roomsService", () => ({
  fetchRooms: vi.fn(),
}));

vi.mock("@/features/academics/timetable/services/timetableApiAdapter", () => ({
  bulkSaveEntries: vi.fn(),
  checkConflicts: vi.fn(),
  deleteEntry: vi.fn(),
  getConfig: vi.fn(),
  getConflicts: vi.fn(),
  getPublication: vi.fn(),
  listEntries: vi.fn(),
  listPeriods: vi.fn(),
  publish: vi.fn(),
  unpublish: vi.fn(),
  validate: vi.fn(),
}));

const mockedFetchAcademicYears = vi.mocked(fetchAcademicYears);
const mockedFetchStructureTree = vi.mocked(fetchStructureTree);
const mockedFetchSubjectAllocations = vi.mocked(fetchSubjectAllocations);
const mockedFetchSubjects = vi.mocked(fetchSubjects);
const mockedFetchTeacherAllocations = vi.mocked(fetchTeacherAllocations);
const mockedFetchTeachers = vi.mocked(fetchTeachers);
const mockedFetchRooms = vi.mocked(fetchRooms);
const mockedBulkSaveEntries = vi.mocked(bulkSaveEntries);
const mockedCheckConflicts = vi.mocked(checkConflicts);
const mockedDeleteEntry = vi.mocked(deleteEntry);
const mockedGetConfig = vi.mocked(getConfig);
const mockedGetPublication = vi.mocked(getPublication);
const mockedListEntries = vi.mocked(listEntries);
const mockedListPeriods = vi.mocked(listPeriods);
const mockedPublish = vi.mocked(publish);
const mockedUnpublish = vi.mocked(unpublish);
const mockedValidate = vi.mocked(validate);

const backendConfig: BackendTimetableConfigDto = {
  id: "config-1",
  academicYearId: "year-1",
  termId: "term-1",
  name: "Classroom timetable",
  weekStartDay: 0,
  activeDays: [0, 1, 2, 3, 4],
  scopeType: "classroom",
  scopeKey: "classroom-1",
  gradeId: null,
  sectionId: null,
  classroomId: "classroom-1",
  status: "draft",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
};

const backendPeriod: BackendTimetablePeriodDto = {
  id: "period-1",
  timetableConfigId: "config-1",
  index: 1,
  label: "Period 1",
  startTime: "08:00",
  endTime: "08:45",
  type: "class",
  isInstructional: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const backendEntry: BackendTimetableEntryDto = {
  id: "entry-1",
  timetableConfigId: "config-1",
  periodId: "period-1",
  dayOfWeek: 1,
  period: {
    id: "period-1",
    index: 1,
    label: "Period 1",
    startTime: "08:00",
    endTime: "08:45",
  },
  classroom: {
    id: "classroom-1",
    nameAr: "الفصل 1",
    nameEn: "Classroom 1",
  },
  subject: {
    id: "subject-1",
    nameAr: "رياضيات",
    nameEn: "Math",
  },
  teacher: {
    userId: "teacher-1",
    fullName: "Teacher One",
  },
  room: {
    id: "room-1",
    nameAr: "غرفة 1",
    nameEn: "Room 1",
  },
  teacherSubjectAllocationId: "allocation-1",
  notes: null,
  status: "draft",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const activePublication: PublicationResponse = {
  status: "active",
  isPublished: true,
  canPublish: true,
  blockingReasons: [],
  warnings: [],
};

const validTimetableResponse: TimetableValidationResponse = {
  termId: "term-1",
  academicYearId: "year-1",
  summary: {
    classroomsChecked: 1,
    expectedWeeklySlots: 1,
    actualScheduledSlots: 1,
    missingTeacherAllocations: 0,
    underScheduledSubjects: 0,
    overScheduledSubjects: 0,
    teacherConflicts: 0,
    classroomConflicts: 0,
    roomConflicts: 0,
    missingSubjectAllocationRows: 0,
  },
  items: [],
};

const hookParams = {
  schoolId: "school-1",
  termId: "term-1",
  academicYearId: "year-1",
  selectedGradeId: "grade-1",
  selectedSectionId: "section-1",
  selectedClassroomId: "classroom-1",
  isScopeSelectionNormalized: true,
  showToast: vi.fn(),
};

describe("useTimetableData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockAcademicDependencies();
    mockTimetableLoad(activePublication);
  });

  it("loads backend config, periods, entries, and publication state for the selected scope", async () => {
    const { result } = renderHook(() => useTimetableData(hookParams));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockedGetConfig).toHaveBeenCalledWith({
      academicYearId: "year-1",
      termId: "term-1",
      scopeType: "CLASSROOM",
      classroomId: "classroom-1",
    });
    expect(mockedListPeriods).toHaveBeenCalledWith("config-1");
    expect(mockedListEntries).toHaveBeenCalledWith({
      timetableConfigId: "config-1",
      classroomId: "classroom-1",
    });
    expect(result.current.timetableEntries).toEqual([
      expect.objectContaining({
        id: "entry-1",
        dayKey: "mon",
        periodIndex: 1,
      }),
    ]);
    expect(result.current.isPublished).toBe(true);
    expect(result.current.rooms).toEqual([
      expect.objectContaining({ id: "room-1", isActive: true }),
    ]);
  });

  it("loads a term-wide config when no grade, section, or classroom is selected", async () => {
    const { result } = renderHook(() =>
      useTimetableData({
        ...hookParams,
        selectedGradeId: "",
        selectedSectionId: "",
        selectedClassroomId: "",
      }),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockedGetConfig).toHaveBeenCalledWith({
      academicYearId: "year-1",
      termId: "term-1",
      scopeType: "TERM",
    });
  });

  it("bulk saves filled slots with resolved teacher-subject allocation ids", async () => {
    mockedCheckConflicts.mockResolvedValueOnce({ conflicts: [] });
    mockedBulkSaveEntries.mockResolvedValueOnce({ items: [backendEntry] });
    const { result } = renderHook(() => useTimetableData(hookParams));

    await waitFor(() => expect(result.current.config?.id).toBe("config-1"));
    let saveResult: Awaited<ReturnType<typeof result.current.saveTimetable>>;
    await act(async () => {
      saveResult = await result.current.saveTimetable(result.current.timetableEntries);
    });

    expect(saveResult!).toEqual({ ok: true });
    expect(mockedBulkSaveEntries).toHaveBeenCalledWith({
      termId: "term-1",
      items: [
        {
          classroomId: "classroom-1",
          dayOfWeek: 1,
          periodId: "period-1",
          teacherSubjectAllocationId: "allocation-1",
          roomId: "room-1",
        },
      ],
    });
  });

  it("does not delete cleared entries when another slot has a conflict", async () => {
    mockedCheckConflicts.mockResolvedValueOnce({
      conflicts: [{ code: "academics.timetable.entry_conflict" }],
    });
    const { result } = renderHook(() => useTimetableData(hookParams));

    await waitFor(() => expect(result.current.config?.id).toBe("config-1"));
    const entriesWithClearedSlot = [
      {
        ...result.current.timetableEntries[0],
        subjectId: null,
        teacherId: null,
      },
      { ...result.current.timetableEntries[0], id: "entry-2", dayKey: "tue" },
    ];

    let saveResult: Awaited<ReturnType<typeof result.current.saveTimetable>>;
    await act(async () => {
      saveResult = await result.current.saveTimetable(entriesWithClearedSlot);
    });

    expect(saveResult!).toMatchObject({
      ok: false,
      hasConflicts: true,
      changesWereNotSaved: true,
    });
    expect(mockedDeleteEntry).not.toHaveBeenCalled();
    expect(mockedBulkSaveEntries).not.toHaveBeenCalled();
  });

  it("surfaces backend error messages from timetable load failures", async () => {
    mockedGetConfig.mockRejectedValueOnce(
      new ApiError("Backend says timetable failed", 500, "UNKNOWN"),
    );

    const { result } = renderHook(() => useTimetableData(hookParams));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.apiError).toBe("Backend says timetable failed");
  });

  it("treats only the exact backend code as an absent config", async () => {
    mockedGetConfig.mockRejectedValueOnce(
      new ApiError(
        "Config not found",
        404,
        "academics.timetable.config_not_found",
      ),
    );

    const { result } = renderHook(() => useTimetableData(hookParams));

    await waitFor(() => expect(result.current.timetableLoading).toBe(false));
    expect(result.current.config).toBeNull();
    expect(result.current.apiError).toBeNull();
  });

  it("surfaces hierarchy 404 errors instead of clearing them as absent configs", async () => {
    mockedGetConfig.mockRejectedValueOnce(
      new ApiError(
        "Classroom not found",
        404,
        "academics.timetable.classroom_not_found",
      ),
    );

    const { result } = renderHook(() => useTimetableData(hookParams));

    await waitFor(() => expect(result.current.timetableLoading).toBe(false));
    expect(result.current.apiError).toBe(
      "The selected classroom no longer exists or is outside this scope.",
    );
  });

  it("marks the loaded config active after publishing", async () => {
    mockedGetPublication.mockResolvedValueOnce(activePublication);
    mockedCheckConflicts.mockResolvedValueOnce({ conflicts: [] });
    mockedPublish.mockResolvedValueOnce(undefined);
    mockedGetPublication.mockResolvedValueOnce(activePublication);

    const { result } = renderHook(() => useTimetableData(hookParams));

    await waitFor(() => expect(result.current.config?.status).toBe("draft"));

    await act(async () => {
      await result.current.publishCurrentTimetable(
        result.current.timetableEntries,
        validationSummaryFromResponse(validTimetableResponse),
      );
    });

    expect(result.current.config?.status).toBe("active");
    expect(mockedValidate).not.toHaveBeenCalled();
  });

  it("marks the loaded config draft after unpublishing", async () => {
    mockedGetConfig.mockResolvedValueOnce({
      ...backendConfig,
      status: "active",
    });
    mockedUnpublish.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useTimetableData(hookParams));

    await waitFor(() => expect(result.current.config?.status).toBe("active"));
    mockedGetPublication.mockResolvedValueOnce({
      ...activePublication,
      status: "draft",
      isPublished: false,
    });

    await act(async () => {
      await result.current.unpublishCurrentTimetable();
    });

    expect(result.current.config?.status).toBe("draft");
    expect(result.current.isPublished).toBe(false);
  });

  it("does not unpublish a section config through the grade-scoped endpoint", async () => {
    mockedGetConfig.mockResolvedValueOnce({
      ...backendConfig,
      scopeType: "section",
      classroomId: null,
      sectionId: "section-1",
    });
    const { result } = renderHook(() => useTimetableData(hookParams));

    await waitFor(() => expect(result.current.config?.scopeType).toBe("section"));
    await act(async () => {
      await result.current.unpublishCurrentTimetable();
    });

    expect(mockedUnpublish).not.toHaveBeenCalled();
    expect(result.current.apiError).toBe(
      "Unpublish is unavailable for section timetables.",
    );
  });
});

function mockAcademicDependencies() {
  mockedFetchAcademicYears.mockResolvedValue([]);
  mockedFetchStructureTree.mockResolvedValue({
    stages: [
      {
        id: "stage-1",
        name: "Stage 1",
        nameAr: "مرحلة 1",
        nameEn: "Stage 1",
        order: 1,
      },
    ],
    grades: [
      {
        id: "grade-1",
        name: "Grade 1",
        nameAr: "صف 1",
        nameEn: "Grade 1",
        stageId: "stage-1",
        order: 1,
      },
    ],
    sections: [
      {
        id: "section-1",
        name: "Section 1",
        nameAr: "شعبة 1",
        nameEn: "Section 1",
        gradeId: "grade-1",
        capacity: 30,
        order: 1,
      },
    ],
    classrooms: [
      {
        id: "classroom-1",
        name: "Classroom 1",
        nameAr: "فصل 1",
        nameEn: "Classroom 1",
        sectionId: "section-1",
        capacity: 30,
        order: 1,
      },
    ],
  });
  mockedFetchSubjects.mockResolvedValue([
    {
      id: "subject-1",
      termId: "term-1",
      name: "Math",
      nameAr: "رياضيات",
      nameEn: "Math",
      isActive: true,
    },
  ]);
  mockedFetchSubjectAllocations.mockResolvedValue([
    { gradeId: "grade-1", subjectId: "subject-1", weeklyHours: 5 },
  ]);
  mockedFetchTeachers.mockResolvedValue([
    {
      id: "teacher-1",
      nameAr: "المعلم 1",
      nameEn: "Teacher One",
      isActive: true,
    },
  ]);
  mockedFetchTeacherAllocations.mockResolvedValue([
    {
      id: "allocation-1",
      termId: "term-1",
      sectionId: "section-1",
      classroomId: "classroom-1",
      subjectId: "subject-1",
      teacherId: "teacher-1",
    },
  ]);
  mockedFetchRooms.mockResolvedValue([
    {
      id: "room-1",
      schoolId: "school-1",
      nameAr: "غرفة 1",
      nameEn: "Room 1",
      capacity: 30,
      isActive: true,
    },
    {
      id: "room-closed",
      schoolId: "school-1",
      nameAr: "غرفة مغلقة",
      nameEn: "Closed Room",
      capacity: 30,
      isActive: false,
    },
  ]);
}

function mockTimetableLoad(publication: PublicationResponse) {
  mockedGetConfig.mockResolvedValue(backendConfig);
  mockedListPeriods.mockResolvedValue({ items: [backendPeriod] });
  mockedListEntries.mockResolvedValue({ items: [backendEntry] });
  mockedGetPublication.mockResolvedValue(publication);
}
