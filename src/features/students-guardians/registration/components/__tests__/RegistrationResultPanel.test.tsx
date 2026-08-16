import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { RegistrationResult } from "@/features/students-guardians/registration/types/registration";

const translations: Record<string, string> = {
  "needs_followup": "Registration needs follow-up",
  "completed_with_warnings": "Registration completed with warnings",
  "completed": "Registration completed",
  "id": "Registration ID: {id}",
  "created": "Created {date}",
  "completed_at": "Completed {date}",
  "student": "Student",
  "enrollment": "Enrollment",
  "guardians": "Guardians",
  "primary": "Primary",
  "can_pickup": "Can pickup",
  "receives_notifications": "Receives notifications",
  "accounts": "Accounts",
  "warnings": "Warnings",
  "acknowledged_checkbox": "I have copied or safely saved the temporary credentials.",
  "back_to_students": "Back to students",
  "view_student_profile": "View student profile",

  "student_account": "Student account",
  "parent_account": "Parent account",
  "guardian_account": "{name} account",
  "username": "Username",
  "login_email": "Login email",
  "contact_email": "Contact email",
  "role": "Role",
  "must_change_password": "Password change required at next sign-in",
  "temporary_password": "Temporary password",
  "copy_all": "Copy all credentials",
  "copied": "Copied",
  "copied_status": "Copied",
  "failed_note": "The core registration remains saved. Complete this account from the student or guardian profile."
};

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string, values?: Record<string, unknown>) => {
    const part = key.split(".").pop() || key;
    let text = translations[part] || part;
    if (values) {
      Object.entries(values).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  },
}));

import RegistrationResultPanel from "@/features/students-guardians/registration/components/RegistrationResultPanel";

const successfulResult: RegistrationResult = {
  status: "success", registrationId: "registration-1", student: { id: "student-1", full_name_en: "Student One" } as never,
  guardians: [], enrollment: { enrollmentId: "enrollment-1", enrollmentDate: "2026-07-02", status: "active" } as never,
  parentAccounts: [], studentAccount: { target: "student", mode: "create", status: "created", temporaryPassword: "secret", user: { fullName: "Student One", username: "student.one", loginEmail: "student@school.test", contactEmail: null, userType: "student", roleKey: "student", roleName: "Student", credentialStatus: "must_change", hasPassword: true, mustChangePassword: true } }, warnings: [],
};

describe("RegistrationResultPanel", () => {
  it("masks temporary credentials and requires acknowledgement before returning", () => {
    const onBack = vi.fn();
    render(<RegistrationResultPanel result={successfulResult} onViewStudentProfile={vi.fn()} onBackToStudents={onBack} />);

    expect(screen.queryByText("secret")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back to students" })).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Back to students" }));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it("labels a durable core registration with account failures as completed with warnings", () => {
    const warningResult: RegistrationResult = { ...successfulResult, studentAccount: { target: "student", mode: "create", status: "failed" }, warnings: ["student_account_failed"] };
    render(<RegistrationResultPanel result={warningResult} onViewStudentProfile={vi.fn()} onBackToStudents={vi.fn()} />);
    expect(screen.getByRole("heading", { name: "Registration completed with warnings" })).toBeInTheDocument();
    expect(screen.queryByText("Registration failed")).not.toBeInTheDocument();
  });

  it("shows the backend account summary for an existing guardian", () => {
    const result: RegistrationResult = {
      ...successfulResult,
      studentAccount: null,
      parentAccounts: [{
        target: "parent",
        guardianId: "guardian-1",
        mode: "create",
        status: "created",
        user: {
          fullName: "Guardian One",
          username: "guardian.one",
          loginEmail: "guardian.one@school.test",
          contactEmail: "guardian@example.com",
          userType: "parent",
          roleKey: "parent",
          roleName: "Parent",
          credentialStatus: "must_change",
          hasPassword: true,
          mustChangePassword: true,
        },
      }],
    };

    render(<RegistrationResultPanel result={result} onViewStudentProfile={vi.fn()} onBackToStudents={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Guardian One account" })).toBeInTheDocument();
    expect(screen.getByText("guardian.one@school.test")).toBeInTheDocument();
    expect(screen.getByText("guardian@example.com")).toBeInTheDocument();
    expect(screen.getByText("Parent")).toBeInTheDocument();
    expect(screen.getByText("Password change required at next sign-in")).toBeInTheDocument();
  });
});
