import { describe, expect, it } from "vitest";
import type { SubjectAllocation } from "@/features/academics/subjects/services/subjectsService";
import type {
  Teacher,
  TeacherAllocation,
} from "@/features/academics/teacher-allocation/services/teacherAllocationService";
import type { Room, TimetableEntry } from "@/features/academics/timetable/types/timetable";
import type { ResolvedTimetableConfig } from "@/features/academics/timetable/types/timetableConfig";
import { generateTimetable } from "@/features/academics/timetable/utils/generator";

const subjects = [
  {
    id: "subject-math",
    termId: "term-1",
    name: "Math",
    nameAr: "Math",
    nameEn: "Math",
    isActive: true,
  },
];

const subjectAllocations: SubjectAllocation[] = [
  {
    gradeId: "grade-1",
    subjectId: "subject-math",
    weeklyHours: 4,
  },
];

const teachers: Teacher[] = [
  {
    id: "teacher-1",
    nameAr: "Teacher",
    nameEn: "Teacher",
    isActive: true,
  },
];

const teacherAllocations: TeacherAllocation[] = [
  {
    id: "allocation-1",
    termId: "term-1",
    sectionId: "section-1",
    classroomId: "classroom-1",
    subjectId: "subject-math",
    teacherId: "teacher-1",
  },
];

const config: ResolvedTimetableConfig = {
  days: [
    { key: "sun", index: 0, nameAr: "Sunday", nameEn: "Sunday", isActive: true },
    { key: "mon", index: 1, nameAr: "Monday", nameEn: "Monday", isActive: true },
  ],
  periods: [
    {
      id: "period-1",
      index: 1,
      nameAr: "P1",
      nameEn: "P1",
      type: "CLASS",
      isInstructional: true,
    },
    {
      id: "period-2",
      index: 2,
      nameAr: "Break",
      nameEn: "Break",
      type: "BREAK",
      isInstructional: false,
    },
    {
      id: "period-3",
      index: 3,
      nameAr: "P3",
      nameEn: "P3",
      type: "CLASS",
      isInstructional: true,
    },
  ],
  source: { scope: "CLASSROOM", id: "classroom-1" },
};

const existingEntries: TimetableEntry[] = [
  {
    id: "entry-1",
    termId: "term-1",
    sectionId: "section-1",
    classroomId: "classroom-1",
    dayKey: "sun",
    periodIndex: 1,
    subjectId: "subject-math",
    teacherId: "teacher-1",
    roomId: null,
    status: "DRAFT",
  },
  {
    id: "entry-2",
    termId: "term-1",
    sectionId: "section-1",
    classroomId: "classroom-1",
    dayKey: "mon",
    periodIndex: 1,
    subjectId: "subject-math",
    teacherId: "teacher-1",
    roomId: null,
    status: "DRAFT",
  },
];

describe("generateTimetable", () => {
  it("generates only missing periods for the selected classroom", async () => {
    const result = await generateTimetable(
      {
        sectionId: "section-1",
        classroomId: "classroom-1",
        gradeId: "grade-1",
        termId: "term-1",
        strictMode: false,
        distributeEvenly: true,
        avoidConsecutive: true,
        excludeDays: [],
      },
      subjects,
      subjectAllocations,
      teacherAllocations,
      teachers,
      [] as Room[],
      [],
      existingEntries,
      config,
    );

    expect(result.entries).toHaveLength(2);
    expect(result.unresolved).toEqual([]);
    expect(result.entries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          classroomId: "classroom-1",
          subjectId: "subject-math",
          teacherId: "teacher-1",
        }),
      ]),
    );
    expect(
      result.entries.some(
        (entry) =>
          entry.dayKey === "sun" && entry.periodIndex === 1,
      ),
    ).toBe(false);
    expect(result.entries.some((entry) => entry.periodIndex === 2)).toBe(false);
  });

  it("does not generate unsavable periods without a classroom teacher allocation", async () => {
    const result = await generateTimetable(
      {
        sectionId: "section-1",
        classroomId: "classroom-1",
        gradeId: "grade-1",
        termId: "term-1",
        strictMode: false,
        distributeEvenly: true,
        avoidConsecutive: true,
        excludeDays: [],
      },
      subjects,
      subjectAllocations,
      [],
      teachers,
      [] as Room[],
      [],
      [],
      config,
    );

    expect(result.entries).toEqual([]);
    expect(result.unresolved).toEqual([
      {
        subjectId: "subject-math",
        subjectName: "Math",
        required: 4,
        placed: 0,
      },
    ]);
  });
});
