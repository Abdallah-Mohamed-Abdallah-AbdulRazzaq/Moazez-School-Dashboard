import { describe, expect, it } from "vitest";
import type { TeacherDirectoryListItem } from "@/features/teachers/types";
import type { AcademicTargetOptions } from "../../services/academicContentSelectors";
import type { AcademicContentTarget } from "../../types/contracts";
import {
  academicSubjectName,
  academicTargetScopeName,
  localizedAcademicName,
  teacherDisplayName,
} from "../academicContentDisplay";

const options: AcademicTargetOptions = {
  structure: {
    stages: [
      {
        id: "stage-1",
        name: "Primary",
        nameAr: "المرحلة الابتدائية",
        nameEn: "Primary",
        order: 1,
      },
    ],
    grades: [
      {
        id: "grade-1",
        stageId: "stage-1",
        name: "Grade 5",
        nameAr: "الصف الخامس",
        nameEn: "Grade 5",
        capacity: 20,
        order: 1,
      },
    ],
    sections: [],
    classrooms: [],
  },
  subjects: [
    {
      id: "subject-1",
      name: "Mathematics",
      nameAr: "الرياضيات",
      nameEn: "Mathematics",
      code: "MATH",
      color: null,
      isActive: true,
    },
  ],
  subjectAllocations: [],
  teacherAllocations: [],
};

const teacher: TeacherDirectoryListItem = {
  id: "teacher-profile-1",
  userId: "teacher-user-1",
  loginEmail: "mona@example.com",
  username: "mona",
  contactEmail: null,
  phone: null,
  teacherCode: "T-1",
  firstNameAr: "منى",
  lastNameAr: "علي",
  firstNameEn: "Mona",
  lastNameEn: "Ali",
  displayName: { firstName: "Mona", lastName: "Ali", fullName: "Mona Ali" },
  gender: "FEMALE",
  department: null,
  specialization: null,
  accountStatus: "ACTIVE",
  membershipStatus: "ACTIVE",
  membershipEndedAt: null,
  employmentStatus: "ACTIVE",
  profileCompleteness: { isComplete: true, missingFields: [] },
  credentialSummary: {
    hasPassword: true,
    status: "set",
    mustChangePassword: false,
    passwordProvisionedAt: "2026-09-01T00:00:00.000Z",
    passwordChangedAt: null,
    credentialVersion: 1,
  },
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
};

describe("academic content display names", () => {
  it.each([
    ["ar", { nameAr: "الرياضيات", nameEn: "Mathematics" }, "الرياضيات"],
    ["en", { nameAr: "الرياضيات", nameEn: "Mathematics" }, "Mathematics"],
    ["ar", { nameAr: "", nameEn: "Mathematics" }, "Mathematics"],
    ["en", { nameAr: "الرياضيات", nameEn: "" }, "الرياضيات"],
  ])(
    "shows a usable %s timetable label with bilingual-only names",
    (locale, entity, expected) => {
      expect(localizedAcademicName(entity, locale)).toBe(expected);
    },
  );

  it("resolves localized academic, subject, and teacher labels", () => {
    const gradeTarget: AcademicContentTarget = {
      id: "target-1",
      scopeType: "GRADE",
      stageId: null,
      gradeId: "grade-1",
      sectionId: null,
      classroomId: null,
      subjectId: "subject-1",
      teacherSubjectAllocationId: null,
    };

    expect(localizedAcademicName(options.structure.grades[0], "ar")).toBe(
      "الصف الخامس",
    );
    expect(academicTargetScopeName(gradeTarget, options, "en")).toBe("Grade 5");
    expect(academicSubjectName("subject-1", options, "ar")).toBe("الرياضيات");
    expect(teacherDisplayName("teacher-user-1", [teacher])).toBe("Mona Ali");
  });

  it("returns no label when an identifier cannot be resolved", () => {
    expect(
      academicSubjectName("missing-subject", options, "en"),
    ).toBeUndefined();
    expect(teacherDisplayName("missing-user", [teacher])).toBeUndefined();
  });
});
