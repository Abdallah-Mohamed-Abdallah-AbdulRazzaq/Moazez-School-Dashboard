import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMocks = vi.hoisted(() => ({
  apiPost: vi.fn(),
}));

const studentMocks = vi.hoisted(() => ({
  createStudent: vi.fn(),
}));

const guardianMocks = vi.hoisted(() => ({
  linkGuardianToStudent: vi.fn(),
}));

const enrollmentMocks = vi.hoisted(() => ({
  createEnrollment: vi.fn(),
}));

vi.mock("@/lib/api", () => apiMocks);
vi.mock(
  "@/features/students-guardians/students/services/studentsApiService",
  () => studentMocks,
);
vi.mock(
  "@/features/students-guardians/guardians/services/guardiansApiService",
  () => guardianMocks,
);
vi.mock(
  "@/features/students-guardians/enrollments/services/enrollmentsApiService",
  () => enrollmentMocks,
);

import { submitRegistration } from "@/features/students-guardians/registration/services/registrationApiService";
import type { RegistrationWizardFormState } from "@/features/students-guardians/registration/types/registration";

const formState: RegistrationWizardFormState = {
  student: {
    fullNameEn: "Student One",
  },
  studentAccount: {
    mode: "create",
    username: "student.one",
  },
  guardians: [{
    key: "guardian-1",
    mode: "create",
    fullName: "Guardian One",
    relation: "father",
    phonePrimary: "555",
    isPrimary: true,
    account: { mode: "create", username: "guardian.one" },
  }],
  enrollment: {
    academicYearId: "00000000-0000-4000-8000-000000000001",
    classroomId: "classroom-1",
    enrollmentDate: "2026-07-02",
  },
};

describe("registrationApiService", () => {
  beforeEach(() => {
    apiMocks.apiPost.mockReset();
    studentMocks.createStudent.mockReset();
    guardianMocks.linkGuardianToStudent.mockReset();
    enrollmentMocks.createEnrollment.mockReset();
  });

  it("submits create-guardian registration through the composite endpoint", async () => {
    apiMocks.apiPost.mockResolvedValue({
      data: {
        student: {
          id: "student-1",
          full_name_en: "Student One",
          status: "active",
        },
        guardians: [],
        enrollment: {
          enrollmentId: "enrollment-1",
          studentId: "student-1",
          academicYear: "2026-2027",
          grade: "Grade 1",
          section: "A",
          classroom: "1/A",
          enrollmentDate: "2026-07-02",
          status: "active",
        },
        parentAccounts: [],
        studentAccount: { target: "student", mode: "create", status: "created" },
        warnings: ["Student account was not created."],
      },
      warnings: ["Guardian account was not created."],
    });

    const result = await submitRegistration(formState);

    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/students-guardians/registrations",
      expect.objectContaining({
        student: expect.objectContaining({ full_name_en: "Student One" }),
        guardians: expect.any(Array),
      }),
    );
    expect(result.status).toBe("success");
    expect(result.warnings).toEqual([
      "Guardian account was not created.",
      "Student account was not created.",
    ]);
  });

  it("returns partial-created state when existing guardian linking fails", async () => {
    studentMocks.createStudent.mockResolvedValue({
      id: "student-1",
      full_name_en: "Student One",
      status: "Active",
    });
    guardianMocks.linkGuardianToStudent.mockRejectedValue(
      new Error("Guardian link failed"),
    );

    const result = await submitRegistration({
      ...formState,
      guardians: [{
        key: "guardian-1",
        mode: "existing",
        existingGuardianId: "guardian-1",
        isPrimary: true,
        account: { mode: "link", userId: "user-1" },
      }],
    });

    expect(result).toMatchObject({
      status: "partial",
      student: { id: "student-1" },
      failedStep: "guardian_link",
      errorMessage: "Guardian link failed",
    });
    expect(enrollmentMocks.createEnrollment).not.toHaveBeenCalled();
  });

  it("returns partial-created state when enrollment fails after existing guardian linking", async () => {
    studentMocks.createStudent.mockResolvedValue({
      id: "student-1",
      full_name_en: "Student One",
      status: "Active",
    });
    guardianMocks.linkGuardianToStudent.mockResolvedValue({});
    enrollmentMocks.createEnrollment.mockRejectedValue(
      new Error("Enrollment failed"),
    );

    const result = await submitRegistration({
      ...formState,
      guardians: [{
        key: "guardian-1",
        mode: "existing",
        existingGuardianId: "guardian-1",
        isPrimary: true,
        account: { mode: "link", userId: "user-1" },
      }],
    });

    expect(guardianMocks.linkGuardianToStudent).toHaveBeenCalledWith(
      "student-1",
      {
        guardianId: "guardian-1",
        is_primary: true,
      },
    );
    expect(result).toMatchObject({
      status: "partial",
      student: { id: "student-1" },
      failedStep: "enrollment",
      errorMessage: "Enrollment failed",
    });
  });

  it("preserves backend account user summaries in a staged existing-guardian registration", async () => {
    studentMocks.createStudent.mockResolvedValue({
      id: "student-1",
      full_name_en: "Student One",
      status: "active",
    });
    guardianMocks.linkGuardianToStudent.mockResolvedValue({});
    enrollmentMocks.createEnrollment.mockResolvedValue({
      enrollmentId: "enrollment-1",
      studentId: "student-1",
      status: "active",
    });
    apiMocks.apiPost.mockImplementation((path: string) => {
      if (path.includes("/guardians/")) {
        return Promise.resolve({
          guardianId: "guardian-1",
          linked: true,
          temporaryPassword: "parent-secret",
          user: {
            fullName: "Guardian One",
            username: "guardian.one",
            loginEmail: "guardian.one@school.test",
            contactEmail: "guardian@example.com",
            userType: "parent",
            roleKey: "parent",
            roleName: "Parent",
            status: "must_change",
            hasPassword: true,
            mustChangePassword: true,
          },
        });
      }

      return Promise.resolve({
        studentId: "student-1",
        linked: true,
        user: {
          fullName: "Student One",
          username: "student.one",
          loginEmail: "student.one@school.test",
          contactEmail: null,
          userType: "student",
          roleKey: "student",
          roleName: "Student",
          status: "active",
          hasPassword: false,
          mustChangePassword: false,
        },
      });
    });

    const result = await submitRegistration({
      ...formState,
      guardians: [{
        key: "guardian-1",
        mode: "existing",
        existingGuardianId: "guardian-1",
        existingGuardianLabel: "Guardian One",
        isPrimary: true,
        account: { mode: "create", username: "guardian.one" },
      }],
    });

    expect(result).toMatchObject({
      status: "success",
      parentAccounts: [{
        guardianId: "guardian-1",
        status: "created",
        temporaryPassword: "parent-secret",
        user: {
          fullName: "Guardian One",
          username: "guardian.one",
          loginEmail: "guardian.one@school.test",
          credentialStatus: "must_change",
        },
      }],
      studentAccount: {
        status: "created",
        user: {
          fullName: "Student One",
          username: "student.one",
          loginEmail: "student.one@school.test",
        },
      },
    });
  });
});
