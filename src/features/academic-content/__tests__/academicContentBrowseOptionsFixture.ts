import type { AcademicContentBrowseOptionsState } from "../hooks/useAcademicContentBrowseOptions";

export const academicContentBrowseOptionsFixture: AcademicContentBrowseOptionsState =
  {
    targetOptions: {
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
        sections: [
          {
            id: "section-1",
            gradeId: "grade-1",
            name: "Section A",
            nameAr: "الشعبة أ",
            nameEn: "Section A",
            capacity: 20,
            order: 1,
          },
        ],
        classrooms: [
          {
            id: "classroom-1",
            sectionId: "section-1",
            name: "Class 5A",
            nameAr: "فصل ٥أ",
            nameEn: "Class 5A",
            capacity: 20,
            order: 1,
          },
        ],
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
    },
    teachers: [
      {
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
        displayName: {
          firstName: "Mona",
          lastName: "Ali",
          fullName: "Mona Ali",
        },
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
      },
    ],
    isLoadingTargets: false,
    isLoadingTeachers: false,
    targetOptionsUnavailable: false,
    teachersUnavailable: false,
  };
