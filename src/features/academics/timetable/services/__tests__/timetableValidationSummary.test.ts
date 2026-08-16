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

  it("reads conflict lists from common backend response shapes", () => {
    const conflict = {
      type: "ROOM" as const,
      dayKey: "mon",
      periodIndex: 1,
      resourceId: "room-1",
      resourceName: "Room 1",
      sections: [],
    };

    expect(conflictsFromResponse({ conflicts: [conflict] })).toEqual([
      conflict,
    ]);
    expect(conflictsFromResponse({ items: [conflict] })).toEqual([conflict]);
    expect(conflictsFromResponse([conflict])).toEqual([conflict]);
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
});
