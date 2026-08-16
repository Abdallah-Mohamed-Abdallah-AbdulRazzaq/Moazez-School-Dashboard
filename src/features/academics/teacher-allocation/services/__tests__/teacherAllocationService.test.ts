import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  applyTeacherToGrade,
  bulkSaveTeacherAllocations,
  clearSubjectAllocations,
  deleteTeacherAllocation,
  getTeacherAllocationValidation,
  getTeacherLoads,
  listTeacherAllocations,
} from "@/features/academics/teacher-allocation/services/teacherAllocationApiAdapter";
import {
  applyTeacherToGrade as applyTeacherToGradeService,
  bulkCreateTeacherAllocations,
  clearSubjectAllocations as clearSubjectAllocationsService,
  fetchTeacherAllocationValidation,
  fetchTeacherAllocations,
  fetchTeacherAllocationsByClassroom,
  fetchTeacherLoads,
  isTeacherAllocationClearConflict,
  saveTeacherAllocationChanges,
  teacherAllocationConflictDetails,
} from "@/features/academics/teacher-allocation/services/teacherAllocationService";
import { ApiError } from "@/lib/api-error";

vi.mock(
  "@/features/academics/teacher-allocation/services/teacherAllocationApiAdapter",
  () => ({
    bulkSaveTeacherAllocations: vi.fn(),
    applyTeacherToGrade: vi.fn(),
    clearSubjectAllocations: vi.fn(),
    deleteTeacherAllocation: vi.fn(),
    getTeacherAllocationValidation: vi.fn(),
    getTeacherLoads: vi.fn(),
    listTeacherAllocations: vi.fn(),
  }),
);

const mockedApplyTeacherToGrade = vi.mocked(applyTeacherToGrade);
const mockedBulkSaveTeacherAllocations = vi.mocked(bulkSaveTeacherAllocations);
const mockedClearSubjectAllocations = vi.mocked(clearSubjectAllocations);
const mockedDeleteTeacherAllocation = vi.mocked(deleteTeacherAllocation);
const mockedGetTeacherAllocationValidation = vi.mocked(getTeacherAllocationValidation);
const mockedGetTeacherLoads = vi.mocked(getTeacherLoads);
const mockedListTeacherAllocations = vi.mocked(listTeacherAllocations);

const backendAllocation = {
  id: "allocation-1",
  teacher: { id: "teacher-user-1", fullName: "Teacher One" },
  subject: {
    id: "subject-1",
    name: "Math",
    nameAr: "Math AR",
    nameEn: "Math",
  },
  classroom: {
    id: "classroom-1",
    name: "Classroom A",
    nameAr: "Classroom A AR",
    nameEn: "Classroom A",
    sectionId: "section-1",
  },
  term: {
    id: "term-1",
    academicYearId: "year-1",
    name: "Term 1",
    nameAr: "Term 1 AR",
    nameEn: "Term 1",
    status: "open",
  },
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("teacherAllocationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches term allocations and maps backend DTOs to the app model", async () => {
    mockedListTeacherAllocations.mockResolvedValueOnce({
      items: [backendAllocation],
    });

    await expect(fetchTeacherAllocations("term-1")).resolves.toEqual([
      {
        id: "allocation-1",
        termId: "term-1",
        sectionId: "section-1",
        classroomId: "classroom-1",
        subjectId: "subject-1",
        teacherId: "teacher-user-1",
      },
    ]);

    expect(mockedListTeacherAllocations).toHaveBeenCalledWith({
      termId: "term-1",
    });
  });

  it("fetches classroom-scoped allocations with term and classroom filters", async () => {
    mockedListTeacherAllocations.mockResolvedValueOnce({ items: [] });

    await fetchTeacherAllocationsByClassroom("term-1", "classroom-1");

    expect(mockedListTeacherAllocations).toHaveBeenCalledWith({
      termId: "term-1",
      classroomId: "classroom-1",
    });
  });

  it("bulk creates only classroom allocations that have teachers", async () => {
    mockedBulkSaveTeacherAllocations.mockResolvedValueOnce({
      items: [],
      summary: { requestedCount: 1, createdCount: 1, existingCount: 0 },
    });

    await bulkCreateTeacherAllocations("term-1", [
      {
        id: "allocation-1",
        termId: "term-1",
        sectionId: "section-1",
        classroomId: "classroom-1",
        subjectId: "subject-1",
        teacherId: "teacher-user-1",
      },
      {
        id: "allocation-2",
        termId: "term-1",
        sectionId: "section-1",
        subjectId: "subject-2",
        teacherId: "teacher-user-2",
      },
      {
        id: "allocation-3",
        termId: "term-1",
        sectionId: "section-1",
        classroomId: "classroom-2",
        subjectId: "subject-3",
        teacherId: null,
      },
    ]);

    expect(mockedBulkSaveTeacherAllocations).toHaveBeenCalledWith({
      termId: "term-1",
      items: [
        {
          teacherUserId: "teacher-user-1",
          subjectId: "subject-1",
          classroomId: "classroom-1",
        },
      ],
    });
  });

  it("saves new assignments with the backend bulk payload shape", async () => {
    mockedBulkSaveTeacherAllocations.mockResolvedValueOnce({
      items: [],
      summary: { requestedCount: 1, createdCount: 1, existingCount: 0 },
    });

    await saveTeacherAllocationChanges({
      termId: "term-1",
      originalAllocations: [],
      localAllocations: [
        {
          id: "temp-1",
          termId: "term-1",
          sectionId: "section-1",
          classroomId: "classroom-1",
          subjectId: "subject-1",
          teacherId: "teacher-user-1",
        },
      ],
    });

    expect(mockedBulkSaveTeacherAllocations).toHaveBeenCalledWith({
      termId: "term-1",
      items: [
        {
          teacherUserId: "teacher-user-1",
          subjectId: "subject-1",
          classroomId: "classroom-1",
        },
      ],
    });
    expect(mockedDeleteTeacherAllocation).not.toHaveBeenCalled();
  });

  it("deletes removed assignments without sending null teachers to bulk save", async () => {
    await saveTeacherAllocationChanges({
      termId: "term-1",
      originalAllocations: [
        {
          id: "allocation-1",
          termId: "term-1",
          sectionId: "section-1",
          classroomId: "classroom-1",
          subjectId: "subject-1",
          teacherId: "teacher-user-1",
        },
      ],
      localAllocations: [
        {
          id: "allocation-1",
          termId: "term-1",
          sectionId: "section-1",
          classroomId: "classroom-1",
          subjectId: "subject-1",
          teacherId: null,
        },
      ],
    });

    expect(mockedDeleteTeacherAllocation).toHaveBeenCalledWith("allocation-1");
    expect(mockedBulkSaveTeacherAllocations).not.toHaveBeenCalled();
  });

  it("deletes changed assignments before bulk creating replacements", async () => {
    mockedBulkSaveTeacherAllocations.mockResolvedValueOnce({
      items: [],
      summary: { requestedCount: 1, createdCount: 1, existingCount: 0 },
    });

    await saveTeacherAllocationChanges({
      termId: "term-1",
      originalAllocations: [
        {
          id: "allocation-1",
          termId: "term-1",
          sectionId: "section-1",
          classroomId: "classroom-1",
          subjectId: "subject-1",
          teacherId: "teacher-user-1",
        },
      ],
      localAllocations: [
        {
          id: "allocation-1",
          termId: "term-1",
          sectionId: "section-1",
          classroomId: "classroom-1",
          subjectId: "subject-1",
          teacherId: "teacher-user-2",
        },
      ],
    });

    expect(mockedDeleteTeacherAllocation).toHaveBeenCalledWith("allocation-1");
    expect(mockedBulkSaveTeacherAllocations).toHaveBeenCalledWith({
      termId: "term-1",
      items: [
        {
          teacherUserId: "teacher-user-2",
          subjectId: "subject-1",
          classroomId: "classroom-1",
        },
      ],
    });
  });

  it("does not create a replacement when deleting the old assignment conflicts", async () => {
    mockedDeleteTeacherAllocation.mockRejectedValueOnce(
      new ApiError(
        "Allocation has dependencies",
        409,
        "academics.allocation.delete_conflict",
      ),
    );

    await expect(
      saveTeacherAllocationChanges({
        termId: "term-1",
        originalAllocations: [
          {
            id: "allocation-1",
            termId: "term-1",
            sectionId: "section-1",
            classroomId: "classroom-1",
            subjectId: "subject-1",
            teacherId: "teacher-user-1",
          },
        ],
        localAllocations: [
          {
            id: "allocation-1",
            termId: "term-1",
            sectionId: "section-1",
            classroomId: "classroom-1",
            subjectId: "subject-1",
            teacherId: "teacher-user-2",
          },
        ],
      }),
    ).rejects.toMatchObject({
      code: "academics.allocation.delete_conflict",
    });

    expect(mockedBulkSaveTeacherAllocations).not.toHaveBeenCalled();
  });

  it("clears subject allocations and returns the deleted count", async () => {
    mockedClearSubjectAllocations.mockResolvedValueOnce({
      ok: true,
      deletedCount: 3,
    });

    await expect(
      clearSubjectAllocationsService({
        termId: "term-1",
        subjectId: "subject-1",
        gradeId: "grade-1",
      }),
    ).resolves.toEqual({
      ok: true,
      deletedCount: 3,
    });

    expect(mockedClearSubjectAllocations).toHaveBeenCalledWith({
      termId: "term-1",
      subjectId: "subject-1",
      gradeId: "grade-1",
    });
  });

  it("recognizes clear conflicts and extracts backend details", () => {
    const error = new ApiError(
      "Clear blocked",
      409,
      "academics.allocation.clear_conflict",
      undefined,
      {
        timetableEntries: ["Grade 1 A has timetable entries"],
        homeworkAssignments: ["Homework depends on this allocation"],
      },
    );

    expect(isTeacherAllocationClearConflict(error)).toBe(true);
    expect(teacherAllocationConflictDetails(error)).toEqual([
      "Grade 1 A has timetable entries",
      "Homework depends on this allocation",
    ]);
  });

  it("fetches backend validation with grade and subject filters", async () => {
    mockedGetTeacherAllocationValidation.mockResolvedValueOnce({
      termId: "term-1",
      academicYearId: "year-1",
      summary: {
        gradesChecked: 1,
        subjectAllocationRows: 2,
        teacherAllocationRows: 1,
        missingTeacherAssignments: 1,
        missingSubjectAllocationRows: 0,
        overAllocatedSubjects: 0,
        underAllocatedSubjects: 0,
      },
      items: [],
    });

    await fetchTeacherAllocationValidation({
      termId: "term-1",
      gradeId: "grade-1",
      subjectId: "subject-1",
    });

    expect(mockedGetTeacherAllocationValidation).toHaveBeenCalledWith({
      termId: "term-1",
      gradeId: "grade-1",
      subjectId: "subject-1",
    });
  });

  it("fetches backend teacher loads with an optional teacher filter", async () => {
    mockedGetTeacherLoads.mockResolvedValueOnce({
      termId: "term-1",
      academicYearId: "year-1",
      items: [
        {
          teacherUserId: "teacher-user-1",
          teacher: {
            id: "teacher-user-1",
            firstName: "Teacher",
            lastName: "One",
          },
          allocationCount: 1,
          totalWeeklyHours: 5,
          classroomsCount: 1,
          subjectsCount: 1,
          loads: [],
          warnings: [],
        },
      ],
    });

    await expect(
      fetchTeacherLoads({
        termId: "term-1",
        teacherUserId: "teacher-user-1",
      }),
    ).resolves.toEqual([
      {
        teacherId: "teacher-user-1",
        teacherName: "Teacher One",
        totalWeeklyPeriods: 5,
        assignmentCount: 1,
        classroomsCount: 1,
        subjectsCount: 1,
        warningsCount: 0,
        warnings: [],
        assignments: [],
      },
    ]);

    expect(mockedGetTeacherLoads).toHaveBeenCalledWith({
      termId: "term-1",
      teacherUserId: "teacher-user-1",
    });
  });

  it("applies a teacher to grade and returns the backend summary", async () => {
    mockedApplyTeacherToGrade.mockResolvedValueOnce({
      items: [backendAllocation],
      summary: {
        requestedClassrooms: 3,
        createdCount: 2,
        existingCount: 1,
      },
    });

    await expect(
      applyTeacherToGradeService({
        termId: "term-1",
        gradeId: "grade-1",
        subjectId: "subject-1",
        teacherUserId: "teacher-user-1",
        classroomIds: ["classroom-1", "classroom-2", "classroom-3"],
      }),
    ).resolves.toEqual({
      items: [backendAllocation],
      summary: {
        requestedClassrooms: 3,
        createdCount: 2,
        existingCount: 1,
      },
    });
  });
});
