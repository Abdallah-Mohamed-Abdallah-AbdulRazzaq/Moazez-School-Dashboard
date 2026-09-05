import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet, apiPost } from "@/lib/api";
import * as enrollmentApi from "../enrollmentApi";
import {
  createEnrollment,
  fetchCurrentEnrollment,
  fetchEnrollmentAcademicYears,
  fetchEnrollmentHistory,
  fetchEnrollments,
  promoteEnrollment,
  transferEnrollment,
  validateEnrollment,
  withdrawEnrollment,
} from "../enrollmentApi";

vi.mock("@/lib/api", () => ({ apiGet: vi.fn(), apiPost: vi.fn() }));
const get = vi.mocked(apiGet); const post = vi.mocked(apiPost);
const placement = { studentId: "student-1", classroomId: "classroom-1", enrollmentDate: "2026-09-01" };

describe("enrollmentApi", () => {
  beforeEach(() => { get.mockReset().mockResolvedValue([]); post.mockReset().mockResolvedValue({}); });

  it("uses supported enrollment read endpoints without requesting enrollment detail records", async () => {
    get.mockReset()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    await fetchEnrollments({ academicYear: "2026-2027", status: "active" });
    await fetchCurrentEnrollment("student-1"); await fetchEnrollmentHistory("student-1"); await fetchEnrollmentAcademicYears();
    expect(get.mock.calls.map(([url]) => url)).toEqual([
      "/students-guardians/enrollments?academicYear=2026-2027&status=active",
      "/students-guardians/enrollments/current?studentId=student-1",
      "/students-guardians/enrollments/history?studentId=student-1",
      "/students-guardians/enrollments/academic-years",
    ]);
    expect(enrollmentApi).not.toHaveProperty("fetchEnrollment");
  });

  it.each(["", "  ", [], {}, { data: [] }, { data: null }])(
    "treats an empty current enrollment response as no active enrollment",
    async (response) => {
      get.mockReset().mockResolvedValue(response);

      await expect(fetchCurrentEnrollment("student-1")).resolves.toBeNull();
    },
  );

  it.each(["", "  ", null, {}, { data: null }])(
    "treats an empty enrollment history response as an empty history",
    async (response) => {
      get.mockReset().mockResolvedValue(response);

      await expect(fetchEnrollmentHistory("student-1")).resolves.toEqual([]);
    },
  );

  it("uses validation and create endpoints without exposing unsupported placement updates", async () => {
    await validateEnrollment(placement); await createEnrollment(placement);
    expect(post.mock.calls).toEqual([
      ["/students-guardians/enrollments/validate", placement],
      ["/students-guardians/enrollments", placement],
    ]);
    expect(enrollmentApi).not.toHaveProperty("upsertEnrollment");
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
