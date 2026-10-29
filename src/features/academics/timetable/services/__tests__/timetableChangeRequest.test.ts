import { describe, expect, it } from "vitest";
import type { BackendTimetableEntryDto, BulkSaveTimetableRequest, TimetableConflictCheckResponse } from "../timetableApiTypes";
import { buildTimetableChangeRequest, remapTimetableConflictResponse } from "../timetableChangeRequest";

const saved: BackendTimetableEntryDto = {
  id: "entry-1", timetableConfigId: "config-1", periodId: "period-1", dayOfWeek: 1,
  period: { id: "period-1", index: 1, label: "First", startTime: "08:00", endTime: "08:45" },
  classroom: { id: "classroom-1", nameAr: "فصل 1", nameEn: "Classroom 1" },
  subject: { id: "math", nameAr: "رياضيات", nameEn: "Math" },
  teacher: { userId: "teacher-1", fullName: "Teacher" },
  room: { id: "room-1", nameAr: "قاعة 1", nameEn: "Room 1" },
  teacherSubjectAllocationId: "allocation-1", notes: null, status: "draft",
  createdAt: "2026-10-27T08:00:00Z", updatedAt: "2026-10-27T08:00:00Z",
};
const unchanged: BulkSaveTimetableRequest["items"][number] = {
  classroomId: "classroom-1", periodId: "period-1", dayOfWeek: 1,
  teacherSubjectAllocationId: "allocation-1", roomId: "room-1",
};

describe("timetable change requests", () => {
  it("reduces a 442-entry draft to the single added entry without changing the input", () => {
    const persistedEntries = Array.from({ length: 441 }, (_, index) => ({
      ...saved, id: `entry-${index}`, classroom: { ...saved.classroom, id: `classroom-${index}` },
    }));
    const added = { ...unchanged, classroomId: "new-classroom" };
    const payload = { termId: "term-1", items: [
      ...persistedEntries.map((entry) => ({ ...unchanged, classroomId: entry.classroom.id })), added,
    ] };
    const snapshot = JSON.stringify(payload);
    expect(buildTimetableChangeRequest({ payload, persistedEntries })).toEqual({
      payload: { termId: "term-1", items: [added] }, originalIndexes: [441],
    });
    expect(JSON.stringify(payload)).toBe(snapshot);
  });

  it.each([
    ["room change", { roomId: "other-room" }],
    ["room removal", { roomId: null }],
    ["allocation change", { teacherSubjectAllocationId: "other-allocation" }],
    ["day change", { dayOfWeek: 2 }],
    ["period change", { periodId: "other-config-period" }],
    ["classroom change", { classroomId: "other-classroom" }],
  ] as const)("retains a %s", (_scenario, changes) => {
    const proposed = { ...unchanged, ...changes };
    expect(buildTimetableChangeRequest({
      payload: { termId: "term-1", items: [proposed] }, persistedEntries: [saved],
    }).payload.items).toEqual([proposed]);
  });

  it("omits reverted edits and treats an omitted room as unchanged when the saved room is null", () => {
    expect(buildTimetableChangeRequest({
      payload: { termId: "term-1", items: [unchanged, { ...unchanged, dayOfWeek: 2, roomId: undefined }] },
      persistedEntries: [saved, { ...saved, id: "empty-room", dayOfWeek: 2, room: null }],
    })).toEqual({ payload: { termId: "term-1", items: [] }, originalIndexes: [] });
  });

  it("keeps both sides of an unsaved room swap together", () => {
    const second = { ...saved, id: "entry-2", dayOfWeek: 2, room: { ...saved.room!, id: "room-2" } };
    const proposals = [{ ...unchanged, roomId: "room-2" }, { ...unchanged, dayOfWeek: 2 }];
    expect(buildTimetableChangeRequest({
      payload: { termId: "term-1", items: proposals }, persistedEntries: [saved, second],
    }).payload.items).toEqual(proposals);
  });

  it("does not hide duplicate proposal slots behind unchanged values", () => {
    expect(buildTimetableChangeRequest({
      payload: { termId: "term-1", items: [unchanged, { ...unchanged }] }, persistedEntries: [saved],
    }).originalIndexes).toEqual([0, 1]);
  });

  it.each(["cancelled", "duplicate"])("rechecks a slot with a %s saved record", (scenario) => {
    const persistedEntries = scenario === "cancelled" ? [{ ...saved, status: "cancelled" as const }] :
      [saved, { ...saved, id: "duplicate-id" }];
    expect(buildTimetableChangeRequest({
      payload: { termId: "term-1", items: [unchanged] }, persistedEntries,
    }).originalIndexes).toEqual([0]);
  });

  it("includes an explicitly requested transfer destination even when its values match the saved slot", () => {
    expect(buildTimetableChangeRequest({
      payload: { termId: "term-1", items: [unchanged] }, persistedEntries: [saved], requiredIndexes: [0],
    }).originalIndexes).toEqual([0]);
  });

  it("restores indexes for conflicts between changes and persisted lessons without mutating the backend response", () => {
    const response: TimetableConflictCheckResponse = {
      termId: "term-1", academicYearId: "year-1", hasConflicts: true,
      conflicts: [{ code: "room_conflict", message: "Occupied", severity: "blocking", dayOfWeek: 1,
        periodId: "period-1", classroomId: null, teacherUserId: null, roomId: "room-1",
        entryIds: ["existing"], proposedIndexes: [0, 1] }],
    };
    const mapped = remapTimetableConflictResponse(response, [5, 441]);
    expect(mapped.conflicts[0]).toEqual({ ...response.conflicts[0], proposedIndexes: [5, 441] });
    expect(response.conflicts[0].proposedIndexes).toEqual([0, 1]);
  });
});
