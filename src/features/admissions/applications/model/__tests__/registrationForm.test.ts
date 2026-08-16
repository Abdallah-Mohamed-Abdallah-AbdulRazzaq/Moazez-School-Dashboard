import { describe, expect, it } from "vitest";
import {
  buildRegistrationRequest,
  getRegistrationValidationIssues,
  isRegistrationFormValid,
  type RegistrationFormState,
} from "../registrationForm";

const completeForm: RegistrationFormState = {
  firstNameEn: "Omar",
  fatherNameEn: "Ahmed",
  grandfatherNameEn: "",
  familyNameEn: "Mostafa",
  firstNameAr: "عمر",
  fatherNameAr: "أحمد",
  grandfatherNameAr: "",
  familyNameAr: "مصطفى",
  fullNameEn: " Omar Ahmed ",
  fullNameAr: "عمر أحمد",
  dateOfBirth: "2017-05-10",
  gender: "male",
  nationality: " Egyptian ",
  addressLine: "Street 1",
  city: "Cairo",
  district: "Nasr City",
  studentPhone: "",
  studentEmail: "",
  guardians: [{
    fullName: " Ahmed Mostafa ",
    firstName: "Ahmed",
    lastName: "Mostafa",
    relation: "father",
    phonePrimary: " +201001112233 ",
    phoneSecondary: "",
    email: "parent@example.com",
    nationalId: "1234567890",
    jobTitle: "Engineer",
    workplace: "Company",
    isPrimary: true,
    canPickup: true,
    canReceiveNotifications: true,
  }],
  gradeId: "grade-1",
  sectionId: "section-1",
  classroomId: "classroom-1",
  enrollmentDate: "2026-09-01",
};

describe("registration form mapping", () => {
  it("requires complete placement and identity fields", () => {
    expect(isRegistrationFormValid(completeForm, "year-1", "term-1")).toBe(true);
    expect(
      isRegistrationFormValid({ ...completeForm, classroomId: "" }, "year-1", "term-1"),
    ).toBe(false);
  });

  it("mirrors backend name and phone validation before submit", () => {
    const issues = getRegistrationValidationIssues(
      {
        ...completeForm,
        fullNameEn: "Omar",
        fullNameAr: "",
        firstNameEn: "",
        familyNameEn: "",
        firstNameAr: "",
        familyNameAr: "",
        guardians: [{
          ...completeForm.guardians[0],
          fullName: "Ahmed",
          firstName: "",
          lastName: "",
          phonePrimary: "01001112233",
        }],
      },
      "year-1",
      "term-1",
    );

    expect(issues).toEqual(expect.arrayContaining([
      "student_name_two_parts",
      "guardian_name_two_parts",
      "guardian_phone_invalid",
    ]));
  });

  it("requires the dashboard academic placement fields", () => {
    expect(
      getRegistrationValidationIssues(
        { ...completeForm, sectionId: "", enrollmentDate: "invalid" },
        "year-1",
        null,
      ),
    ).toEqual(expect.arrayContaining([
      "term_required",
      "section_required",
      "enrollment_date_invalid",
    ]));
  });

  it("builds the source-bound registration payload without an application id", () => {
    const request = buildRegistrationRequest(completeForm, "year-1", "term-1");
    expect(request).toMatchObject({
      student: {
        name: "Omar Ahmed",
        first_name_en: "Omar",
        full_name_ar: "عمر أحمد",
        nationality: "Egyptian",
        contact: { address_line: "Street 1", city: "Cairo" },
      },
      guardians: [{
        profile: {
          full_name: "Ahmed Mostafa",
          phone_primary: "+201001112233",
          national_id: "1234567890",
        },
      }],
      enrollment: {
        academicYearId: "year-1",
        termId: "term-1",
        classroomId: "classroom-1",
      },
    });
    expect(request).not.toHaveProperty("applicationId");
  });
});
