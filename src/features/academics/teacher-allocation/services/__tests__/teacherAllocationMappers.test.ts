import { describe, expect, it } from "vitest";
import {
  mapAllocationDtoToUi,
  mapTeacherLoadDtoToViewModel,
  mapValidationDtoToUi,
} from "@/features/academics/teacher-allocation/services/teacherAllocationMappers";
import type {
  TeacherAllocationDto,
  TeacherAllocationValidationResponse,
  TeacherLoadsResponse,
} from "@/features/academics/teacher-allocation/services/teacherAllocationApi.types";

const allocationDto: TeacherAllocationDto = {
  id: "allocation-1",
  teacher: {
    id: "teacher-user-1",
    fullName: "Teacher One",
    email: "teacher@example.test",
  },
  subject: {
    id: "subject-1",
    name: "Math",
    nameAr: "Math AR",
    nameEn: "Math",
    code: "MATH",
  },
  classroom: {
    id: "classroom-1",
    name: "Classroom A",
    nameAr: "Classroom A AR",
    nameEn: "Classroom A",
    sectionId: "section-1",
    roomId: "room-1",
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

const teacherLoadsResponse: TeacherLoadsResponse = {
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
      loads: [
        {
          allocationId: "allocation-1",
          subjectId: "subject-1",
          subject: {
            id: "subject-1",
            nameAr: "Math AR",
            nameEn: "Math",
          },
          classroomId: "classroom-1",
          classroom: {
            id: "classroom-1",
            nameAr: "Classroom A AR",
            nameEn: "Classroom A",
          },
          gradeId: "grade-1",
          grade: {
            id: "grade-1",
            nameAr: "Grade 1 AR",
            nameEn: "Grade 1",
          },
          weeklyHours: 5,
        },
      ],
      warnings: [
        {
          code: "LOAD_WARNING",
          message: "Check this teacher load.",
        },
      ],
    },
  ],
};

const validationResponse: TeacherAllocationValidationResponse = {
  termId: "term-1",
  academicYearId: "year-1",
  summary: {
    gradesChecked: 2,
    subjectAllocationRows: 4,
    teacherAllocationRows: 3,
    missingTeacherAssignments: 1,
    missingSubjectAllocationRows: 1,
    overAllocatedSubjects: 2,
    underAllocatedSubjects: 1,
  },
  items: [
    {
      gradeId: "grade-1",
      grade: {
        id: "grade-1",
        nameAr: "Grade 1 AR",
        nameEn: "Grade 1",
      },
      subjectId: "subject-1",
      subject: {
        id: "subject-1",
        nameAr: "Math AR",
        nameEn: "Math",
      },
      weeklyHours: 5,
      classroomCount: 2,
      allocatedClassroomCount: 1,
      missingClassroomCount: 1,
      status: "incomplete",
      issues: [
        {
          code: "MISSING_TEACHER_ASSIGNMENT",
          message: "One classroom needs a teacher.",
          classroomIds: ["classroom-1"],
        },
      ],
    },
  ],
};

describe("teacherAllocationMappers", () => {
  it("maps backend allocation DTOs into the current allocation model", () => {
    expect(mapAllocationDtoToUi(allocationDto)).toEqual({
      id: "allocation-1",
      termId: "term-1",
      sectionId: "section-1",
      classroomId: "classroom-1",
      subjectId: "subject-1",
      teacherId: "teacher-user-1",
    });
  });

  it("maps backend teacher loads into a view model with backend counts", () => {
    expect(mapTeacherLoadDtoToViewModel(teacherLoadsResponse.items[0])).toEqual({
      teacherId: "teacher-user-1",
      teacherName: "Teacher One",
      totalWeeklyPeriods: 5,
      assignmentCount: 1,
      classroomsCount: 1,
      subjectsCount: 1,
      warningsCount: 1,
      warnings: [
        {
          code: "LOAD_WARNING",
          message: "Check this teacher load.",
        },
      ],
      assignments: [
        {
          allocationId: "allocation-1",
          gradeId: "grade-1",
          gradeNameAr: "Grade 1 AR",
          gradeNameEn: "Grade 1",
          classroomId: "classroom-1",
          classroomNameAr: "Classroom A AR",
          classroomNameEn: "Classroom A",
          subjectId: "subject-1",
          subjectNameAr: "Math AR",
          subjectNameEn: "Math",
          weeklyHours: 5,
        },
      ],
    });
  });

  it("maps validation DTOs without inventing overloaded or unqualified teachers", () => {
    expect(mapValidationDtoToUi(validationResponse)).toMatchObject({
      isValid: false,
      missingCount: 1,
      overloadedCount: 0,
      unqualifiedCount: 0,
      sectionsWithMissing: 0,
      overloadedTeachers: [],
    });
  });
});
