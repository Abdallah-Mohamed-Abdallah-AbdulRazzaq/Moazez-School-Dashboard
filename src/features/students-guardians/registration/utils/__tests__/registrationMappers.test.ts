import { describe, expect, it } from "vitest";
import {
  mapRegistrationToCompositePayload,
  mapRegistrationToEnrollmentPayload,
} from "@/features/students-guardians/registration/utils/registrationMappers";
import type { RegistrationWizardFormState } from "@/features/students-guardians/registration/types/registration";

const baseFormState: RegistrationWizardFormState = {
  student: {
    fullNameEn: "Student One",
    fullNameAr: "طالب واحد",
    dateOfBirth: "2015-05-10",
    nationality: "Egyptian",
    studentEmail: "student@example.com",
  },
  studentAccount: { mode: "create", username: "student.one" },
  guardians: [{
    key: "guardian-1",
    mode: "create",
    fullName: "Guardian One",
    relation: "father",
    phonePrimary: "555",
    jobTitle: "Engineer",
    canPickup: true,
    canReceiveNotifications: true,
    isPrimary: true,
    account: { mode: "create", username: "guardian.one" },
  }],
  enrollment: {
    academicYearId: "year-1",
    gradeId: "grade-1",
    sectionId: "section-1",
    classroomId: "classroom-1",
    termId: "term-1",
    enrollmentDate: "2026-07-02",
    status: "active",
  },
};

describe("registrationMappers", () => {
  it("maps create-guardian wizard state to the composite registration DTO", () => {
    const payload = mapRegistrationToCompositePayload(baseFormState);

    expect(payload).toMatchObject({
      student: {
        full_name_en: "Student One",
        full_name_ar: "طالب واحد",
        dateOfBirth: "2015-05-10",
        nationality: "Egyptian",
        contact: {
          student_email: "student@example.com",
        },
      },
      guardians: [
        {
          profile: {
            full_name: "Guardian One",
            relation: "father",
            phone_primary: "555",
            job_title: "Engineer",
            can_pickup: true,
            can_receive_notifications: true,
          },
          relationship: {
            is_primary: true,
          },
          account: expect.objectContaining({ mode: "create", username: "guardian.one" }),
        },
      ],
      enrollment: {
        academicYearId: "year-1",
        gradeId: "grade-1",
        sectionId: "section-1",
        classroomId: "classroom-1",
        termId: "term-1",
        enrollmentDate: "2026-07-02",
      },
    });
  });

  it("keeps guardian profile flags out of the relationship DTO", () => {
    const payload = mapRegistrationToCompositePayload(baseFormState);

    expect(payload.guardians[0].relationship).toEqual({ is_primary: true });
  });

  it("does not allow unsupported guardianId in the composite DTO", () => {
    expect(() =>
      mapRegistrationToCompositePayload({
        ...baseFormState,
        guardians: [{
          key: "guardian-1",
          mode: "existing",
          existingGuardianId: "guardian-1",
          isPrimary: true,
          account: { mode: "link", userId: "user-1" },
        }],
      }),
    ).toThrow(/staged flow/);
  });

  it("maps enrollment payload for the existing-guardian multi-call flow", () => {
    expect(
      mapRegistrationToEnrollmentPayload(baseFormState, "student-1"),
    ).toMatchObject({
      studentId: "student-1",
      classroomId: "classroom-1",
      termId: "term-1",
      enrollmentDate: "2026-07-02",
    });
  });
});
