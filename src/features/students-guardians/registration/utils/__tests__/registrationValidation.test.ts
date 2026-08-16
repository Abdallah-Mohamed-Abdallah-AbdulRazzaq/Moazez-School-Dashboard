import { describe, expect, it } from "vitest";
import type { RegistrationWizardFormState } from "@/features/students-guardians/registration/types/registration";
import { validateRegistrationStep } from "@/features/students-guardians/registration/utils/registrationValidation";

const uuid = (suffix: string) => `00000000-0000-4000-8000-${suffix.padStart(12, "0")}`;

function validForm(): RegistrationWizardFormState {
  return {
    student: { fullNameEn: "Student One", dateOfBirth: "2015-05-10", studentPhone: "+201001112233", studentEmail: "student@example.com" },
    studentAccount: { mode: "create", username: "student.one", contactEmail: "student@example.com" },
    guardians: [{ key: "guardian-row", mode: "create", fullName: "Guardian One", relation: "father", phonePrimary: "+201001112234", isPrimary: true, account: { mode: "link", userId: uuid("2") } }],
    enrollment: { academicYearId: uuid("3"), termId: uuid("4"), gradeId: uuid("5"), sectionId: uuid("6"), classroomId: uuid("7"), enrollmentDate: "2026-07-02", status: "active" },
  };
}

describe("registration step validation", () => {
  it("rejects unresolved names and invalid student contact values", () => {
    const form = validForm();
    form.student = { fullNameEn: "Student", studentPhone: "01001112233", studentEmail: "invalid" };

    expect(validateRegistrationStep(form, 0)).toEqual(expect.arrayContaining([
      expect.stringContaining("at least two words"),
      expect.stringContaining("international format"),
      expect.stringContaining("email is invalid"),
    ]));
  });

  it("rejects an incomplete new guardian and multiple primary guardians", () => {
    const form = validForm();
    form.guardians.push({ ...form.guardians[0], key: "second", fullName: "Single", isPrimary: true });

    expect(validateRegistrationStep(form, 1)).toEqual(expect.arrayContaining([
      "Select exactly one primary guardian.",
      expect.stringContaining("full name must contain at least two words"),
    ]));
  });

  it("enforces account mode fields and backend length limits", () => {
    const form = validForm();
    form.studentAccount = { mode: "create", username: "x".repeat(65) };
    form.guardians[0].account = { mode: "link", userId: "not-a-uuid" };

    expect(validateRegistrationStep(form, 2)).toEqual(expect.arrayContaining([
      expect.stringContaining("64 characters or fewer"),
      expect.stringContaining("selected user ID is invalid"),
    ]));
  });

  it("accepts a complete form and rejects invalid enrollment identifiers", () => {
    const form = validForm();
    expect([0, 1, 2, 3].flatMap((step) => validateRegistrationStep(form, step as 0 | 1 | 2 | 3))).toEqual([]);

    form.enrollment.classroomId = "classroom-1";
    expect(validateRegistrationStep(form, 3)).toContain("Classroom ID is invalid.");
  });
});
