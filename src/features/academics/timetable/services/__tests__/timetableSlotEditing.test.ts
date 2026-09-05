import { describe, expect, it } from "vitest";
import type { Subject } from "@/features/academics/subjects/services/subjectsService";
import type {
  Teacher,
  TeacherAllocation,
} from "@/features/academics/teacher-allocation/services/teacherAllocationService";
import {
  subjectOptionsForGradeAllocations,
  teacherAllocationOptions,
} from "@/features/academics/timetable/services/timetableSlotEditing";

const teachers: Teacher[] = [
  {
    id: "teacher-1",
    nameAr: "معلم الرياضيات",
    nameEn: "Math Teacher",
    isActive: true,
  },
  {
    id: "teacher-2",
    nameAr: "معلم العلوم",
    nameEn: "Science Teacher",
    isActive: true,
  },
];

const subjects: Subject[] = [
  {
    id: "subject-math",
    name: "Math",
    nameAr: "رياضيات",
    nameEn: "Math",
    isActive: true,
  },
  {
    id: "subject-science",
    name: "Science",
    nameAr: "علوم",
    nameEn: "Science",
    isActive: true,
  },
];

const allocations: TeacherAllocation[] = [
  {
    id: "section-math",
    termId: "term-1",
    sectionId: "section-1",
    subjectId: "subject-math",
    teacherId: "teacher-1",
  },
  {
    id: "classroom-math",
    termId: "term-1",
    sectionId: "section-1",
    classroomId: "classroom-1",
    subjectId: "subject-math",
    teacherId: "teacher-1",
  },
  {
    id: "classroom-science",
    termId: "term-1",
    sectionId: "section-1",
    classroomId: "classroom-1",
    subjectId: "subject-science",
    teacherId: "teacher-2",
  },
  {
    id: "other-classroom-math",
    termId: "term-1",
    sectionId: "section-1",
    classroomId: "classroom-2",
    subjectId: "subject-math",
    teacherId: "teacher-1",
  },
  {
    id: "unassigned-math",
    termId: "term-1",
    sectionId: "section-1",
    subjectId: "subject-math",
    teacherId: null,
  },
];

describe("teacherAllocationOptions", () => {
  it("returns classroom allocations for the selected subject", () => {
    expect(
      teacherAllocationOptions({
        teacherAllocations: allocations,
        teachers,
        subjects,
        sectionId: "section-1",
        classroomId: "classroom-1",
        subjectId: "subject-math",
        locale: "en",
      }),
    ).toEqual([
      {
        allocationId: "classroom-math",
        teacherId: "teacher-1",
        subjectId: "subject-math",
        label: "Math Teacher - Math",
      },
    ]);
  });

  it("allows choosing an allocation before a subject has been selected", () => {
    expect(
      teacherAllocationOptions({
        teacherAllocations: allocations,
        teachers,
        subjects,
        sectionId: "section-1",
        classroomId: "classroom-1",
        locale: "en",
      }).map((option) => option.allocationId),
    ).toEqual(["classroom-math", "classroom-science"]);
  });

  it("falls back to the allocation id when display names are unavailable", () => {
    expect(
      teacherAllocationOptions({
        teacherAllocations: [
          {
            id: "allocation-without-label",
            termId: "term-1",
            sectionId: "section-1",
            classroomId: "classroom-1",
            subjectId: "missing-subject",
            teacherId: "missing-teacher",
          },
        ],
        teachers,
        subjects,
        sectionId: "section-1",
        classroomId: "classroom-1",
        locale: "en",
      }),
    ).toEqual([
      {
        allocationId: "allocation-without-label",
        teacherId: "missing-teacher",
        subjectId: "missing-subject",
        label: "allocation-without-label",
      },
    ]);
  });
});

describe("subjectOptionsForGradeAllocations", () => {
  it("returns only subjects allocated to the selected grade", () => {
    expect(
      subjectOptionsForGradeAllocations({
        subjects,
        subjectAllocations: [
          { gradeId: "grade-1", subjectId: "subject-math", weeklyHours: 5 },
          { gradeId: "grade-2", subjectId: "subject-science", weeklyHours: 4 },
        ],
        gradeId: "grade-1",
      }).map((subject) => subject.id),
    ).toEqual(["subject-math"]);
  });

  it("excludes subjects with zero weekly hours", () => {
    expect(
      subjectOptionsForGradeAllocations({
        subjects,
        subjectAllocations: [
          { gradeId: "grade-1", subjectId: "subject-math", weeklyHours: 5 },
          { gradeId: "grade-1", subjectId: "subject-science", weeklyHours: 0 },
        ],
        gradeId: "grade-1",
      }).map((subject) => subject.id),
    ).toEqual(["subject-math"]);
  });
});
