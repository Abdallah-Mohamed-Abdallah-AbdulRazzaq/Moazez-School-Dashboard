import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api-error";
import {
  dashboardEntriesForScope,
  timetableConfigCandidates,
  type TimetableSlotScope,
} from "@/features/academics/lesson-plans/services/lessonPlanTimetable";
import { isTimetableConfigNotFound } from "@/features/academics/timetable/services/timetableErrorHandling";
import type {
  BackendTimetableEntryDto,
  TimetableDashboardAllResponseDto,
} from "@/features/academics/timetable/services/timetableApiTypes";

const scope: TimetableSlotScope = {
  academicYearId: "year-1",
  termId: "term-1",
  gradeId: "grade-1",
  sectionId: "section-1",
  classroomId: "classroom-1",
  teacherUserId: "teacher-1",
  subjectId: "subject-1",
  teacherSubjectAllocationId: "allocation-1",
};

const entry = (
  id: string,
  overrides: Partial<BackendTimetableEntryDto> = {},
): BackendTimetableEntryDto => ({
  id,
  timetableConfigId: "config-1",
  periodId: `period-${id}`,
  dayOfWeek: 1,
  period: {
    id: `period-${id}`,
    index: 1,
    label: "P1",
    startTime: "08:00",
    endTime: "08:45",
  },
  classroom: {
    id: "classroom-1",
    nameAr: "Classroom 1",
    nameEn: "Classroom 1",
  },
  subject: {
    id: "subject-1",
    nameAr: "Subject 1",
    nameEn: "Subject 1",
  },
  teacher: {
    userId: "teacher-1",
    fullName: "Teacher 1",
  },
  room: null,
  teacherSubjectAllocationId: "allocation-1",
  notes: null,
  status: "active",
  createdAt: "2026-07-31T08:00:00.000Z",
  updatedAt: "2026-07-31T08:00:00.000Z",
  ...overrides,
});

describe("lessonPlanTimetable", () => {
  it("resolves timetable configs from the narrowest scope through the term", () => {
    expect(timetableConfigCandidates(scope)).toEqual([
      {
        academicYearId: "year-1",
        termId: "term-1",
        scopeType: "CLASSROOM",
        gradeId: "grade-1",
        sectionId: "section-1",
        classroomId: "classroom-1",
      },
      {
        academicYearId: "year-1",
        termId: "term-1",
        scopeType: "SECTION",
        gradeId: "grade-1",
        sectionId: "section-1",
      },
      {
        academicYearId: "year-1",
        termId: "term-1",
        scopeType: "GRADE",
        gradeId: "grade-1",
      },
      {
        academicYearId: "year-1",
        termId: "term-1",
        scopeType: "TERM",
      },
    ]);
  });

  it("recognizes only the backend config-not-found code", () => {
    expect(
      isTimetableConfigNotFound(
        new ApiError(
          "Config not found",
          404,
          "academics.timetable.config_not_found",
        ),
      ),
    ).toBe(true);
    expect(
      isTimetableConfigNotFound(
        new ApiError(
          "Classroom not found",
          404,
          "academics.timetable.classroom_not_found",
        ),
      ),
    ).toBe(false);
    expect(isTimetableConfigNotFound(ApiError.network())).toBe(false);
  });

  it("selects only matching classroom, day, status, and allocation entries", () => {
    const response: TimetableDashboardAllResponseDto = {
      termId: "term-1",
      academicYearId: "year-1",
      publishedAt: null,
      isPublished: false,
      items: [
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
          entries: [entry("wrong-classroom")],
        },
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
          entries: [
            entry("matching"),
            entry("other-config", { timetableConfigId: "config-2" }),
            entry("wrong-day", { dayOfWeek: 2 }),
            entry("cancelled", { status: "cancelled" }),
            entry("wrong-allocation", {
              teacherSubjectAllocationId: "allocation-2",
            }),
            entry("missing-allocation", {
              teacherSubjectAllocationId: "",
            }),
          ],
        },
      ],
    };

    expect(dashboardEntriesForScope(response, scope, 1).map(({ id }) => id))
      .toEqual(["matching", "other-config"]);
  });
});
