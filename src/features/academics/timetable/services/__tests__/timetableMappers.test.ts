import { describe, expect, it } from "vitest";
import type { BackendTimetableEntryDto } from "@/features/academics/timetable/services/timetableApiTypes";
import type { TimetableEntry } from "@/features/academics/timetable/types/timetable";
import {
  dayIndexToKey,
  dayKeyToIndex,
  mapBackendEntriesToUi,
  mapBackendEntryToMeta,
  mapBackendEntryToUi,
  mapUiEntriesToBulkSaveRequest,
  mapUiEntryToCreateEntryRequest,
} from "@/features/academics/timetable/services/timetableMappers";

const backendEntry: BackendTimetableEntryDto = {
  id: "entry-1",
  timetableConfigId: "config-1",
  periodId: "period-2",
  dayOfWeek: 2,
  period: {
    id: "period-2",
    index: 3,
    label: "P3",
    startTime: "09:00",
    endTime: "09:45",
  },
  classroom: {
    id: "classroom-1",
    nameAr: "Classroom AR",
    nameEn: "Classroom EN",
  },
  subject: {
    id: "subject-1",
    nameAr: "Subject AR",
    nameEn: "Subject EN",
    code: "MATH",
  },
  teacher: {
    userId: "teacher-1",
    fullName: "Teacher One",
  },
  room: {
    id: "room-1",
    nameAr: "Room AR",
    nameEn: "Room EN",
  },
  teacherSubjectAllocationId: "allocation-1",
  notes: "Needs projector",
  status: "active",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
};

describe("timetableMappers", () => {
  it.each([
    [0, "sun"],
    [3, "wed"],
    [6, "sat"],
    [9, "sun"],
  ])("maps day index %i to day key %s", (dayIndex, dayKey) => {
    expect(dayIndexToKey(dayIndex)).toBe(dayKey);
  });

  it.each([
    ["sun", 0],
    ["thu", 4],
    ["sat", 6],
    ["unknown", 0],
  ])("maps day key %s to day index %i", (dayKey, dayIndex) => {
    expect(dayKeyToIndex(dayKey)).toBe(dayIndex);
  });

  it("maps backend timetable entries to the current UI model", () => {
    expect(mapBackendEntryToUi(backendEntry)).toEqual({
      id: "entry-1",
      termId: "",
      sectionId: "",
      classroomId: "classroom-1",
      dayKey: "tue",
      periodIndex: 3,
      subjectId: "subject-1",
      teacherId: "teacher-1",
      roomId: "room-1",
      status: "PUBLISHED",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
      day: 2,
      period: 3,
    });
  });

  it("keeps backend-only metadata by entry id", () => {
    const mappedEntries = mapBackendEntriesToUi([backendEntry]);

    expect(mappedEntries.entries).toEqual([mapBackendEntryToUi(backendEntry)]);
    expect(mappedEntries.backendMetaByEntryId).toEqual({
      "entry-1": mapBackendEntryToMeta(backendEntry),
    });
  });

  it("builds backend create and bulk-save payloads from UI entries and metadata", () => {
    const entry: TimetableEntry = mapBackendEntryToUi(backendEntry);
    const backendMeta = mapBackendEntryToMeta(backendEntry);

    expect(mapUiEntryToCreateEntryRequest(entry, backendMeta)).toEqual({
      timetableConfigId: "config-1",
      periodId: "period-2",
      dayOfWeek: 2,
      classroomId: "classroom-1",
      subjectId: "subject-1",
      teacherSubjectAllocationId: "allocation-1",
      roomId: "room-1",
      notes: "Needs projector",
    });
    expect(
      mapUiEntriesToBulkSaveRequest("term-1", [entry], {
        "entry-1": backendMeta,
      }),
    ).toEqual({
      termId: "term-1",
      items: [
        {
          classroomId: "classroom-1",
          dayOfWeek: 2,
          periodId: "period-2",
          teacherSubjectAllocationId: "allocation-1",
          roomId: "room-1",
        },
      ],
    });
  });

  it("requires teacher-subject allocation metadata before save payloads are built", () => {
    const entry = mapBackendEntryToUi(backendEntry);
    const backendMeta = {
      ...mapBackendEntryToMeta(backendEntry),
      teacherSubjectAllocationId: null,
    };

    expect(() => mapUiEntryToCreateEntryRequest(entry, backendMeta)).toThrow(
      "Missing teacherSubjectAllocationId for timetable entry entry-1",
    );
  });
});
