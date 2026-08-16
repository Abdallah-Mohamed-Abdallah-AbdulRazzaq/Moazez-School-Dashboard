import { describe, expect, it } from "vitest";
import {
  mapLessonPlanDetailDto,
  mapLessonPlanItemDto,
  mapLessonPlanSummaryDto,
  mapLessonPlanWeeksDto,
} from "../lessonPlansMappers";

const itemDto = {
  id: "item-1",
  itemId: "item-1",
  lessonPlanId: "plan-1",
  curriculumId: "curriculum-1",
  unitId: "unit-1",
  lessonId: "lesson-1",
  unitTitle: "Unit",
  lessonTitle: "Lesson",
  timetableEntryId: null,
  plannedDate: "2026-09-02",
  dayOfWeek: 2,
  periodId: null,
  periodLabel: null,
  title: "Lesson",
  notes: "Prepare examples",
  status: "in_progress",
  sortOrder: 3,
  startedAt: null,
  completedAt: null,
  skippedAt: null,
  cancelledAt: null,
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
};

const planDto = {
  id: "plan-1",
  lessonPlanId: "plan-1",
  academicYearId: "year-1",
  termId: "term-1",
  teacherSubjectAllocationId: "allocation-1",
  teacherUserId: "teacher-1",
  classroomId: "class-1",
  subjectId: "subject-1",
  curriculumId: "curriculum-1",
  title: "Week 1",
  description: null,
  status: "active",
  weekStartDate: "2026-09-01",
  weekEndDate: "2026-09-07",
  activatedAt: null,
  archivedAt: null,
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
  academicYear: { id: "year-1", name: "Year", nameAr: "سنة", nameEn: "Year" },
  term: { id: "term-1", name: "Term", nameAr: "فصل", nameEn: "Term" },
  teacher: {
    id: "teacher-1",
    name: "Teacher",
    firstName: "T",
    lastName: "One",
    email: null,
  },
  classroom: { id: "class-1", name: "Class", nameAr: "فصل", nameEn: "Class" },
  subject: {
    id: "subject-1",
    name: "Math",
    nameAr: "رياضيات",
    nameEn: "Math",
    code: null,
    color: null,
  },
  curriculum: { curriculumId: "curriculum-1", title: "Math", status: "active" },
  itemCount: 1,
  items: [itemDto],
};

describe("lesson plan mappers", () => {
  it("maps backend detail into the weekly board model", () => {
    const plan = mapLessonPlanDetailDto(planDto, [
      {
        weekIndex: 1,
        startsAt: "2026-09-01",
        endsAt: "2026-09-07",
        plannedItemsCount: 1,
        instructionalDays: ["2026-09-02"],
        holidayDays: [],
      },
    ]);
    expect(plan).toMatchObject({
      id: "plan-1",
      status: "ACTIVE",
      rawStatus: "active",
      weekIndex: 1,
    });
    expect(plan.items[0]).toMatchObject({
      id: "item-1",
      planId: "plan-1",
      unitTitle: "Unit",
      lessonTitle: "Lesson",
      status: "IN_PROGRESS",
      order: 3,
      notes: "Prepare examples",
      timetableEntryId: undefined,
      dayOfWeek: 2,
      createdAt: "2026-09-01T00:00:00.000Z",
      updatedAt: "2026-09-01T00:00:00.000Z",
    });
  });

  it("maps unknown statuses without throwing", () => {
    expect(
      mapLessonPlanDetailDto({ ...planDto, status: "paused" }, []).status,
    ).toBe("UNKNOWN");
    expect(mapLessonPlanItemDto({ ...itemDto, status: "blocked" }).status).toBe(
      "UNKNOWN",
    );
    expect(
      mapLessonPlanItemDto({ ...itemDto, status: "rescheduled" }).status,
    ).toBe("RESCHEDULED");
    expect(
      mapLessonPlanItemDto({ ...itemDto, status: "future_status" }).status,
    ).toBe("UNKNOWN");
    expect(
      mapLessonPlanItemDto({ ...itemDto, status: "blocked" }).rawStatus,
    ).toBe("blocked");
  });

  it("maps backend weeks and summary fields exactly", () => {
    expect(
      mapLessonPlanWeeksDto({
        termId: "term-1",
        academicYearId: "year-1",
        weeks: [
          {
            weekIndex: 1,
            startsAt: "2026-09-01",
            endsAt: "2026-09-07",
            instructionalDays: ["2026-09-02"],
            holidayDays: [
              { date: "2026-09-03", eventId: "holiday-1", title: "Holiday" },
            ],
            plannedItemsCount: 2,
          },
        ],
      })[0],
    ).toMatchObject({
      startDate: "2026-09-01",
      endDate: "2026-09-07",
      plannedItemsCount: 2,
      instructionalDays: ["2026-09-02"],
      holidayDays: [{ date: "2026-09-03" }],
      hasHolidays: true,
      lostTeachingDays: 1,
    });
    const response = {
        termId: "term-1",
        academicYearId: "year-1",
        summary: {
          lessonPlansCount: 2,
          itemsCount: 10,
          plannedItemsCount: 7,
          completedItemsCount: 3,
          unplannedLessonsCount: 4,
          coveragePercent: 42,
        },
        byTeacherAllocation: [
          {
            teacherSubjectAllocationId: "allocation-1",
            teacher: {
              id: "teacher-1",
              name: "Teacher One",
              firstName: "Teacher",
              lastName: "One",
            },
            subject: {
              id: "subject-1",
              name: "Math",
              nameAr: "رياضيات",
              nameEn: "Math",
              code: "MATH",
              color: "#123456",
            },
            classroom: {
              id: "classroom-1",
              name: "Classroom 1",
              nameAr: "الفصل 1",
              nameEn: "Classroom 1",
            },
            plannedItemsCount: 7,
            completedItemsCount: 3,
            unplannedLessonsCount: 4,
            coveragePercent: 42,
          },
        ],
      };
    expect(mapLessonPlanSummaryDto(response)).toEqual({
      ...response.summary,
      byTeacherAllocation: response.byTeacherAllocation,
    });
  });
});
