import { describe, expect, it } from "vitest";
import type { Room, TimetableEntry } from "../../types/timetable";
import { hasTimetableRoomConflict, mergeTimetableEntriesForValidation } from "../../services/timetableDragDrop";
import { getDefaultRoomSuggestion, getRoomRecommendations } from "../roomRecommendations";

const classroom = { id: "classroom-1", nameAr: "فصل 1", nameEn: "Classroom 1", capacity: 25 };

function room(id: string, overrides: Partial<Room> = {}): Room {
  return { id, schoolId: "school-1", nameAr: id, nameEn: id, capacity: 30, isActive: true, ...overrides };
}

function lesson(overrides: Partial<TimetableEntry> = {}): TimetableEntry {
  return { id: "lesson-1", termId: "term-1", sectionId: "section-1", classroomId: classroom.id,
    subjectId: "math", teacherId: null, roomId: "usual", dayKey: "mon", periodIndex: 1, ...overrides };
}

describe("room recommendations", () => {
  it("prefers subject history within the classroom over name matching and spare capacity", () => {
    const recommendations = getRoomRecommendations({
      subjectId: "math", selectedClassroom: classroom,
      rooms: [room("small", { capacity: 25 }), room("named", { nameEn: classroom.nameEn }), room("usual", { capacity: 50 })],
      entries: [lesson(), lesson({ id: "lesson-2", dayKey: "tue" }),
        lesson({ id: "other-subject", subjectId: "science", roomId: "small" }),
        lesson({ id: "other-classroom", classroomId: "other", roomId: "small" }),
        lesson({ id: "break", slotType: "BREAK", roomId: "small" })],
    });
    expect(recommendations.map(({ room }) => room.id)).toEqual(["usual", "named", "small"]);
    expect(recommendations[0].previousLessons).toBe(2);
    expect(recommendations[2].previousLessons).toBe(0);
  });

  it("chooses the smallest sufficient room and gives unknown capacities and ties a stable order", () => {
    const recommendations = getRoomRecommendations({
      subjectId: "math", selectedClassroom: classroom, entries: [],
      rooms: [room("unknown-z", { capacity: null }), room("large", { capacity: 50 }),
        room("unknown-a", { capacity: null }), room("fit-b", { capacity: 25 }), room("fit-a", { capacity: 25 })],
    });
    expect(recommendations.map(({ room }) => room.id)).toEqual(["fit-a", "fit-b", "large", "unknown-a", "unknown-z"]);
  });

  it("never defaults to an inactive, undersized or occupied room even with previous use", () => {
    expect(getDefaultRoomSuggestion({
      subjectId: "math", selectedClassroom: classroom, entries: [lesson()],
      rooms: [room("inactive", { isActive: false }), room("small", { capacity: 24 }), room("usual")],
      isRoomUnavailable: (roomId) => roomId === "usual",
    })).toEqual({ roomId: null, source: null });
  });

  it.each([
    ["overlap across configurations", "mon", "08:30", "09:15", 7, "alternative"],
    ["adjacent lesson", "mon", "09:00", "10:00", 7, "usual"],
    ["different day", "tue", "08:30", "09:15", 7, "usual"],
    ["missing times with matching period", "mon", undefined, undefined, 1, "alternative"],
  ] as const)("suggests available rooms for %s", (_scenario, dayKey, startTime, endTime, periodIndex, expectedRoomId) => {
    const hiddenLesson = lesson({ id: "hidden", classroomId: "other", timetableConfigId: "other-config",
      dayKey, startTime, endTime, periodIndex });
    const availability = { allEntries: [hiddenLesson], editableEntries: [],
      target: { dayKey: "mon", periodIndex: 1 }, periods: [{ index: 1, startTime: "08:00", endTime: "09:00" }] };
    expect(getDefaultRoomSuggestion({
      subjectId: "math", selectedClassroom: classroom, entries: [],
      rooms: [room("usual", { capacity: 25 }), room("alternative")],
      isRoomUnavailable: (roomId) => hasTimetableRoomConflict({ ...availability, roomId }),
    }).roomId).toBe(expectedRoomId);
  });

  it.each(["new", "changed", "cleared"] as const)("uses %s unsaved room assignments instead of persisted bookings", (edit) => {
    const saved = lesson({ id: "saved", dayKey: "tue" });
    const edited = edit === "new" ? lesson({ id: "temp-new", roomId: "alternative" }) :
      { ...saved, roomId: edit === "cleared" ? null : "alternative", subjectId: edit === "cleared" ? null : "math" };
    const allEntries = edit === "new" ? [] : [saved];
    const editableEntries = [edited];
    const recommendations = getRoomRecommendations({
      subjectId: "math", selectedClassroom: classroom,
      rooms: [room("usual", { capacity: 25 }), room("alternative")],
      entries: mergeTimetableEntriesForValidation(allEntries, editableEntries),
      isRoomUnavailable: (roomId) => hasTimetableRoomConflict({ allEntries, editableEntries, roomId,
        target: { dayKey: edited.dayKey, periodIndex: 1 } }),
    });
    expect(recommendations.map(({ room }) => room.id)).toEqual(edit === "cleared" ? ["usual", "alternative"] : ["usual"]);
  });

  it("does not treat the room of the lesson being edited as occupied", () => {
    const current = lesson();
    expect(getDefaultRoomSuggestion({
      subjectId: "math", selectedClassroom: classroom, rooms: [room("usual")], entries: [],
      isRoomUnavailable: (roomId) => hasTimetableRoomConflict({ allEntries: [current], editableEntries: [current],
        roomId, excludeEntryId: current.id, target: { dayKey: current.dayKey, periodIndex: current.periodIndex } }),
    }).roomId).toBe("usual");
  });
});
