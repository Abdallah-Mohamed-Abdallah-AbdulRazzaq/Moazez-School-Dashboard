import { describe, expect, it } from "vitest";
import { findTimetableLessons } from "../timetableLessonSearch";
import type { TimetableEntry } from "../../types/timetable";

const lesson: TimetableEntry = {
  id: "lesson-1",
  termId: "term-1",
  classroomId: "classroom-1",
  sectionId: "section-1",
  dayKey: "mon",
  periodIndex: 1,
  subjectId: "math",
  teacherId: "ahmed",
  roomId: "lab",
};
const searchInput = {
  entries: [
    lesson,
    { ...lesson, id: "empty", subjectId: null },
    { ...lesson, id: "break", slotType: "BREAK" as const },
  ],
  subjects: [{ id: "math", nameAr: "الرِّياضِيَّات", nameEn: "Mathematics" }],
  teachers: [{ id: "ahmed", nameAr: "أحمد", nameEn: "Ahmed Hassan" }],
  rooms: [{ id: "lab", nameAr: "معمل العلوم", nameEn: "Science lab" }],
};

describe("timetable lesson search", () => {
  it.each([
    "  MATH  ",
    "AHMED",
    "Science lab",
    "احمد",
    "الرياضيات",
    "math hassan",
    "معمل احمد",
  ])("finds a lesson across bilingual fields for %s", (query) => {
    expect(findTimetableLessons({ ...searchInput, query })).toEqual([lesson]);
  });
  it.each(["   ", "unknown", "math unknown"])(
    "does not match lessons for %s",
    (query) => {
      expect(findTimetableLessons({ ...searchInput, query })).toEqual([]);
    },
  );
});
