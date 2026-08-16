import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet } from "@/lib/api";
import { fetchStudentsWithEnrollmentForContext } from "@/features/students-guardians/students/services/studentsService";
import { fetchStudents } from "@/features/students-guardians/students/services/studentsApiService";

vi.mock("@/lib/api", () => ({
  apiGet: vi.fn(),
  apiWithToken: vi.fn(),
}));

describe("studentsService enrollment context", () => {
  beforeEach(() => {
    vi.mocked(apiGet).mockReset().mockImplementation((path: string) => {
      if (path === "/students-guardians/students") {
        return Promise.resolve([
          {
            id: "student-1",
            studentCode: "ST-1",
            studentName: "Student One",
            status: "active",
          },
        ]);
      }
      if (
        path ===
        "/students-guardians/students?search=Ahmed+Mostafa&status=Active"
      ) {
        return Promise.resolve([]);
      }
      if (
        path ===
        "/students-guardians/enrollments?academicYearId=year-1&status=active"
      ) {
        return Promise.resolve([
          {
            id: "enrollment-1",
            studentId: "student-1",
            academicYearId: "year-1",
            academicYear: "2026-2027",
            grade: "Grade 1",
            section: "A",
            enrollmentDate: "2026-09-01",
            status: "active",
          },
        ]);
      }
      throw new Error(`Unexpected request: ${path}`);
    });
  });

  it("loads year-scoped students and enrollments with two collection requests", async () => {
    const students = await fetchStudentsWithEnrollmentForContext("year-1");

    expect(apiGet).toHaveBeenCalledTimes(2);
    expect(students[0].enrollment?.enrollmentId).toBe("enrollment-1");
  });

  it("sends search and status filters to the students collection endpoint", async () => {
    await fetchStudents({ search: "Ahmed Mostafa", status: "Active" });

    expect(apiGet).toHaveBeenCalledWith(
      "/students-guardians/students?search=Ahmed+Mostafa&status=Active",
    );
  });
});
