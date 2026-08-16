import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet, apiPost } from "@/lib/api";
import {
  createEnrollment,
  fetchCurrentEnrollment,
  fetchEnrollment,
  fetchEnrollmentAcademicYears,
  fetchEnrollmentHistory,
  fetchEnrollments,
  promoteEnrollment,
  transferEnrollment,
  upsertEnrollment,
  validateEnrollment,
  withdrawEnrollment,
} from "../enrollmentApi";

vi.mock("@/lib/api", () => ({ apiGet: vi.fn(), apiPost: vi.fn() }));
const get = vi.mocked(apiGet); const post = vi.mocked(apiPost);
const placement = { studentId: "student-1", classroomId: "classroom-1", enrollmentDate: "2026-09-01" };

describe("enrollmentApi", () => {
  beforeEach(() => { get.mockReset().mockResolvedValue([]); post.mockReset().mockResolvedValue({}); });

  it("uses all enrollment read endpoints", async () => {
    get.mockReset()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    await fetchEnrollments({ academicYear: "2026-2027", status: "active" });
    await fetchEnrollment("enrollment/1"); await fetchCurrentEnrollment("student-1"); await fetchEnrollmentHistory("student-1"); await fetchEnrollmentAcademicYears();
    expect(get.mock.calls.map(([url]) => url)).toEqual([
      "/students-guardians/enrollments?academicYear=2026-2027&status=active",
      "/students-guardians/enrollments/enrollment%2F1",
      "/students-guardians/enrollments/current?studentId=student-1",
      "/students-guardians/enrollments/history?studentId=student-1",
      "/students-guardians/enrollments/academic-years",
    ]);
  });

  it("uses validation, create, and upsert endpoints", async () => {
    await validateEnrollment(placement); await createEnrollment(placement); await upsertEnrollment(placement);
    expect(post.mock.calls).toEqual([
      ["/students-guardians/enrollments/validate", placement],
      ["/students-guardians/enrollments", placement],
      ["/students-guardians/enrollments/upsert", placement],
    ]);
  });

  it("uses transfer, withdraw, and promote lifecycle endpoints", async () => {
    const transfer = { studentId: "student-1", targetSectionId: "section-1", targetClassroomId: "classroom-1", effectiveDate: "2026-09-01", reason: "Move" };
    const withdraw = { studentId: "student-1", effectiveDate: "2026-09-01", reason: "Leaving", actionType: "withdrawn" as const };
    const promote = { studentId: "student-1", targetAcademicYear: "2027-2028", effectiveDate: "2027-09-01" };
    await transferEnrollment(transfer); await withdrawEnrollment(withdraw); await promoteEnrollment(promote);
    expect(post.mock.calls).toEqual([
      ["/students-guardians/enrollments/transfer", transfer],
      ["/students-guardians/enrollments/withdraw", withdraw],
      ["/students-guardians/enrollments/promote", promote],
    ]);
  });
});
