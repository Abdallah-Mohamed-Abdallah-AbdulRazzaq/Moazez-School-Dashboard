import { describe, expect, it } from "vitest";
import {
  conflictsFromResponse,
  hasBlockingValidation,
  normalizeConflictCheckResponse,
  normalizePersistedConflicts,
  validationIssueText,
  validationSummaryFromResponse,
} from "@/features/academics/timetable/services/timetableValidationSummary";

describe("timetableValidationSummary", () => {
  it("normalizes backend validation buckets for the validation panel", () => {
    const summary = validationSummaryFromResponse({
      termId: "term-1",
      academicYearId: "year-1",
      summary: {
        classroomsChecked: 1,
        expectedWeeklySlots: 4,
        actualScheduledSlots: 2,
        missingTeacherAllocations: 1,
        underScheduledSubjects: 1,
        overScheduledSubjects: 0,
        teacherConflicts: 0,
        classroomConflicts: 0,
        roomConflicts: 1,
        missingSubjectAllocationRows: 0,
      },
      items: [
        {
          classroomId: "classroom-1",
          classroom: { id: "classroom-1", nameAr: "101", nameEn: "101" },
          gradeId: "grade-1",
          grade: { id: "grade-1", nameAr: "Grade 1", nameEn: "Grade 1" },
          subjectId: "subject-1",
          subject: {
            id: "subject-1",
            nameAr: "Math",
            nameEn: "Math",
            code: null,
            color: null,
          },
          expectedWeeklyHours: 4,
          scheduledWeeklyHours: 2,
          status: "missing_teacher_allocation",
          issues: [
            {
              code: "missing_teacher_allocation",
              message: "Subject is missing a teacher allocation.",
            },
            {
              code: "under_scheduled_subject",
              message: "Scheduled periods are below weekly hours.",
            },
          ],
        },
      ],
    });

    expect(summary.canPublish).toBe(false);
    expect(summary.backendSummary?.expectedWeeklySlots).toBe(4);
    expect(summary.items).toHaveLength(1);
    expect(summary.items[0]).toEqual(
      expect.objectContaining({
        classroomId: "classroom-1",
        status: "missing_teacher_allocation",
      }),
    );
    expect(summary.blockingReasons).toEqual([
      "Resolve timetable validation issues before publishing.",
    ]);
    expect(summary.warnings).toEqual([]);
    expect(summary.missingTeacherAllocations).toEqual([
      expect.objectContaining({
        subjectName: "Math",
        classroomId: "classroom-1",
      }),
    ]);
    expect(summary.underScheduledSubjects).toEqual([
      expect.objectContaining({ subjectName: "Math", actual: 2, expected: 4 }),
    ]);
    expect(summary.roomConflicts).toEqual([]);
    expect(hasBlockingValidation(summary)).toBe(true);
  });

  it("formats validation issues with messages or entity names", () => {
    expect(validationIssueText({ message: "Teacher missing" })).toBe(
      "Teacher missing",
    );
    expect(
      validationIssueText({ subjectName: "Science", actual: 2, expected: 4 }),
    ).toBe("Science (2/4)");
  });

  it("retains room validity failures when overlap count is zero", () => {
    const response = validationSummaryFromResponse({
      termId: "term-1", academicYearId: "year-1",
      summary: { classroomsChecked: 1, expectedWeeklySlots: 1, actualScheduledSlots: 1, missingTeacherAllocations: 0, underScheduledSubjects: 0, overScheduledSubjects: 0, teacherConflicts: 0, classroomConflicts: 0, roomConflicts: 0, missingSubjectAllocationRows: 0 },
      items: [{ classroomId: "class-1", classroom: { id: "class-1", nameAr: "A", nameEn: "A" }, gradeId: "grade-1", grade: { id: "grade-1", nameAr: "G", nameEn: "G" }, subjectId: "subject-1", subject: { id: "subject-1", nameAr: "S", nameEn: "S", code: null, color: null }, expectedWeeklyHours: 1, scheduledWeeklyHours: 1, status: "complete", issues: [{ code: "room_inactive", message: "Room is inactive" }] }],
    });

    expect(response.roomIntegrityIssues).toHaveLength(1);
    expect(hasBlockingValidation(response)).toBe(true);
  });

  it("reads conflict lists from common backend response shapes", () => {
    const conflict = {
      code: "room_conflict",
      message: "Room intervals overlap.",
      severity: "blocking",
      dayOfWeek: 1,
      periodId: "period-1",
      roomId: "room-1",
      entryIds: ["entry-1"],
      proposedIndexes: [],
    };
    const expectedConflict = expect.objectContaining({
      type: "ROOM",
      code: "room_conflict",
      dayKey: "mon",
      periodId: "period-1",
      resourceId: "room-1",
    });

    expect(conflictsFromResponse({ conflicts: [conflict] })).toEqual([
      expectedConflict,
    ]);
    expect(conflictsFromResponse({ items: [conflict] })).toEqual([
      expectedConflict,
    ]);
    expect(conflictsFromResponse([conflict])).toEqual([expectedConflict]);
  });

  it("preserves the source-specific conflict category", () => {
    expect(
      normalizeConflictCheckResponse({
        conflicts: [
          { code: "classroom_conflict", message: "Classroom is occupied" },
        ],
      }).conflicts[0],
    ).toMatchObject({ type: "CLASSROOM", code: "classroom_conflict" });

    expect(
      normalizePersistedConflicts({
        conflicts: [
          { type: "CLASSROOM_SLOT", message: "Classroom is occupied" },
        ],
      }).conflicts[0],
    ).toMatchObject({ type: "CLASSROOM", code: "CLASSROOM_SLOT" });

    expect(
      normalizeConflictCheckResponse({
        conflicts: [{ code: "future_conflict", message: "Backend detail" }],
      }).conflicts[0],
    ).toMatchObject({ type: "UNKNOWN", code: "future_conflict" });
  });

  it("preserves unresolved backend period IDs without inventing an index", () => {
    const conflict = normalizePersistedConflicts(
      {
        conflicts: [
          {
            type: "TEACHER",
            message: "Teacher intervals overlap.",
            severity: "blocking",
            dayOfWeek: 2,
            periodId: "deleted-period",
            teacherUserId: "teacher-1",
            entryIds: ["entry-1"],
          },
        ],
      },
      [],
    ).conflicts[0];

    expect(conflict).toMatchObject({
      periodId: "deleted-period",
      message: "Teacher intervals overlap.",
    });
    expect(conflict).not.toHaveProperty("periodIndex");
  });
});
