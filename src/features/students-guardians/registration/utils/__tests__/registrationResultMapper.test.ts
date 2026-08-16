import { describe, expect, it } from "vitest";
import { normalizeRegistrationResult } from "@/features/students-guardians/registration/utils/registrationResultMapper";

describe("registration result mapper", () => {
  it("normalizes core records, account statuses, and temporary credentials", () => {
    const result = normalizeRegistrationResult({ data: {
      registrationId: "registration-1",
      student: { id: "student-1", full_name_en: "Student One", status: "active" },
      guardians: [{ guardianId: "guardian-1", full_name: "Guardian One", relation: "father", phone_primary: "+201001112233", is_primary: true }],
      enrollment: { enrollmentId: "enrollment-1", studentId: "student-1", academicYear: "2026-2027", grade: "Grade 1", section: "A", classroom: "1/A", enrollmentDate: "2026-07-02", status: "active" },
      parentAccounts: [{ target: "parent", guardianId: "guardian-1", mode: "create", status: "created", temporaryPassword: "secret", user: { fullName: "Guardian One", username: "guardian.one", loginEmail: "guardian@school.test", userType: "parent" } }],
      studentAccount: { target: "student", mode: "link", status: "linked" }, warnings: [], createdAt: "2026-07-02T08:00:00Z", completedAt: "2026-07-02T08:00:01Z",
    } });

    expect(result.registrationId).toBe("registration-1");
    expect(result.parentAccounts[0]).toMatchObject({ status: "created", temporaryPassword: "secret", user: { username: "guardian.one" } });
    expect(result.studentAccount.status).toBe("linked");
  });
});
