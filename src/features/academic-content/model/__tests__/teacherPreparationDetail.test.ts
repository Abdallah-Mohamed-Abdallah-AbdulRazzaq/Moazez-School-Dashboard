import { describe, expect, it } from "vitest";
import type { TeacherDirectoryListItem } from "@/features/teachers/types";
import type { AcademicContentDetailOptions } from "../../services/academicContentDetailOptions";
import type { AcademicTargetOptions } from "../../services/academicContentSelectors";
import type {
  AcademicContentPreparationDetail,
  AcademicContentTarget,
} from "../../types/contracts";
import {
  emptyTeacherPreparationDetail,
  normalizeTeacherPreparationDetail,
  resolveTeacherPreparationReferences,
  resolveTeacherPreparationTargets,
} from "../teacherPreparationDetail";

const detail: AcademicContentPreparationDetail = {
  ...emptyTeacherPreparationDetail(),
  topic: " Fractions ",
  objectives: [" Compare values "],
  learningOutcomes: [" Model equivalent fractions "],
  teachingStrategies: [" Guided practice "],
  activities: [" Fraction wall "],
  resourceNotes: " Use tiles ",
  assessmentNotes: " Exit ticket ",
  teacherNotes: " Pair support ",
  curriculumId: "curriculum-1",
  curriculumUnitId: "unit-1",
  curriculumLessonId: "lesson-1",
  lessonPlanId: "plan-1",
  lessonPlanItemId: "plan-item-1",
  timetableEntryId: "entry-1",
};

const targets: AcademicContentTarget[] = [
  {
    id: "target-1",
    scopeType: "CLASSROOM",
    stageId: null,
    gradeId: null,
    sectionId: null,
    classroomId: "classroom-1",
    subjectId: "subject-1",
    teacherSubjectAllocationId: "allocation-1",
  },
  {
    id: "target-2",
    scopeType: "GRADE",
    stageId: null,
    gradeId: "grade-2",
    sectionId: null,
    classroomId: null,
    subjectId: "subject-2",
    teacherSubjectAllocationId: null,
  },
];

const targetOptions = {
  structure: {
    stages: [
      { id: "stage-1", name: "Primary", nameAr: "الابتدائي", nameEn: "Primary", order: 1 },
      { id: "stage-2", name: "Secondary", nameAr: "الثانوي", nameEn: "Secondary", order: 2 },
    ],
    grades: [
      { id: "grade-1", stageId: "stage-1", name: "Grade 4", nameAr: "الصف الرابع", nameEn: "Grade 4", capacity: 20, order: 1 },
      { id: "grade-2", stageId: "stage-2", name: "Grade 9", nameAr: "الصف التاسع", nameEn: "Grade 9", capacity: 20, order: 2 },
    ],
    sections: [
      { id: "section-1", gradeId: "grade-1", name: "Section A", nameAr: "الشعبة أ", nameEn: "Section A", capacity: 20, order: 1 },
    ],
    classrooms: [
      { id: "classroom-1", sectionId: "section-1", name: "Class 4A", nameAr: "فصل ٤أ", nameEn: "Class 4A", capacity: 20, order: 1 },
    ],
  },
  subjects: [
    { id: "subject-1", name: "Mathematics", nameAr: "الرياضيات", nameEn: "Mathematics", code: "MATH", color: null, isActive: true },
    { id: "subject-2", name: "Science", nameAr: "العلوم", nameEn: "Science", code: "SCI", color: null, isActive: true },
  ],
  subjectAllocations: [],
  teacherAllocations: [
    { id: "allocation-1", termId: "term-1", sectionId: "section-1", classroomId: "classroom-1", subjectId: "subject-1", teacherId: "teacher-user-1" },
  ],
} satisfies AcademicTargetOptions;

const teachers = [
  {
    userId: "teacher-user-1",
    displayName: { firstName: "Mona", lastName: "Ali", fullName: "Mona Ali" },
  },
] as TeacherDirectoryListItem[];

const referenceOptions = {
  curricula: [
    {
      id: "curriculum-1",
      title: "British Curriculum",
      units: [
        {
          id: "unit-1",
          title: "Number and Algebra",
          lessons: [{ id: "lesson-1", title: "Equivalent Fractions" }],
        },
      ],
    },
  ],
  lessonPlans: [
    {
      id: "plan-1",
      title: "Week 4",
      items: [{ id: "plan-item-1", title: "Fractions", lessonTitle: "Equivalent Fractions" }],
    },
  ],
  timetableEntries: [
    {
      id: "entry-1",
      dayOfWeek: 2,
      period: { label: "Period 3", startTime: "10:00", endTime: "10:45" },
      classroom: { nameAr: "فصل ٤أ", nameEn: "Class 4A" },
      subject: { nameAr: "الرياضيات", nameEn: "Mathematics" },
      teacher: { userId: "teacher-user-1", fullName: "Mona Ali" },
    },
  ],
} as AcademicContentDetailOptions;

describe("teacher preparation detail model", () => {
  it("normalizes and preserves the complete replacement payload", () => {
    expect(normalizeTeacherPreparationDetail(detail)).toEqual({
      topic: "Fractions",
      objectives: ["Compare values"],
      learningOutcomes: ["Model equivalent fractions"],
      teachingStrategies: ["Guided practice"],
      activities: ["Fraction wall"],
      resourceNotes: "Use tiles",
      assessmentNotes: "Exit ticket",
      teacherNotes: "Pair support",
      curriculumId: "curriculum-1",
      curriculumUnitId: "unit-1",
      curriculumLessonId: "lesson-1",
      lessonPlanId: "plan-1",
      lessonPlanItemId: "plan-item-1",
      timetableEntryId: "entry-1",
    });
  });

  it("resolves every target without collapsing the multi-target contract", () => {
    expect(resolveTeacherPreparationTargets(targets, targetOptions, teachers, "en")).toEqual([
      {
        targetId: "target-1",
        scope: "Class 4A",
        subject: "Mathematics",
        assignedTeacher: "Mona Ali",
      },
      {
        targetId: "target-2",
        scope: "Grade 9",
        subject: "Science",
        assignedTeacher: null,
      },
    ]);
  });

  it("resolves selected references and returns null for stale identifiers", () => {
    expect(resolveTeacherPreparationReferences(detail, referenceOptions, "en")).toEqual({
      curriculum: "British Curriculum",
      curriculumUnit: "Number and Algebra",
      curriculumLesson: "Equivalent Fractions",
      lessonPlan: "Week 4",
      lessonPlanItem: "Fractions",
      timetable: {
        classroom: "Class 4A",
        subject: "Mathematics",
        teacher: "Mona Ali",
        period: "Period 3",
        time: "10:00–10:45",
        dayOfWeek: 2,
      },
    });

    expect(
      resolveTeacherPreparationReferences(
        { ...detail, curriculumId: "missing", timetableEntryId: "missing" },
        referenceOptions,
        "en",
      ),
    ).toMatchObject({ curriculum: null, timetable: null });
  });
});
