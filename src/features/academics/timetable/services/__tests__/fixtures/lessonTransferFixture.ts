import type { LessonTransferInput } from "../../timetableLessonTransfer";

export function lessonTransferFixture(): LessonTransferInput {
  const source = {
    id: "entry-1",
    termId: "term-1",
    sectionId: "section-1",
    classroomId: "classroom-1",
    dayKey: "mon",
    periodIndex: 1,
    subjectId: "math",
    teacherId: "teacher-1",
    roomId: "room-1",
  };
  return {
    mode: "copy",
    sourceId: source.id,
    target: {
      classroomId: "classroom-1",
      sectionId: "section-1",
      dayKey: "mon",
      periodIndex: 2,
    },
    entries: [source],
    allTermEntries: [source],
    readOnly: false,
    classrooms: [1, 2].map((number) => ({
      id: `classroom-${number}`,
      sectionId: "section-1",
      name: `Classroom ${number}`,
      nameEn: `Classroom ${number}`,
      nameAr: `الفصل ${number}`,
      capacity: 25,
      order: number,
    })),
    sections: [
      {
        id: "section-1",
        gradeId: "grade-1",
        name: "Section 1",
        nameAr: "الشعبة 1",
        nameEn: "Section 1",
        capacity: 30,
        order: 1,
      },
    ],
    teacherAllocations: [1, 2].map((number) => ({
      id: `allocation-${number}`,
      termId: "term-1",
      sectionId: "section-1",
      classroomId: `classroom-${number}`,
      subjectId: "math",
      teacherId: "teacher-1",
    })),
    subjectAllocations: [
      { gradeId: "grade-1", subjectId: "math", weeklyHours: 5 },
    ],
    rooms: [
      {
        id: "room-1",
        schoolId: "school-1",
        nameAr: "الغرفة 1",
        nameEn: "Room 1",
        capacity: 30,
        isActive: true,
      },
    ],
    config: {
      days: [
        {
          key: "mon",
          index: 1,
          nameAr: "الإثنين",
          nameEn: "Monday",
          isActive: true,
        },
        {
          key: "tue",
          index: 2,
          nameAr: "الثلاثاء",
          nameEn: "Tuesday",
          isActive: true,
        },
        {
          key: "fri",
          index: 5,
          nameAr: "الجمعة",
          nameEn: "Friday",
          isActive: false,
        },
      ],
      periods: [
        {
          id: "period-1",
          index: 1,
          nameAr: "الحصة 1",
          nameEn: "Period 1",
          startTime: "08:00",
          endTime: "08:45",
          isInstructional: true,
        },
        {
          id: "period-2",
          index: 2,
          nameAr: "الحصة 2",
          nameEn: "Period 2",
          startTime: "08:45",
          endTime: "09:30",
          isInstructional: true,
        },
        {
          id: "break",
          index: 3,
          nameAr: "استراحة",
          nameEn: "Break",
          isInstructional: false,
        },
      ],
      source: { scope: "TERM", id: "term-1" },
    },
    createEntryId: () => "temp-transfer-1",
  };
}
