import { describe, expect, it } from "vitest";
import { buildEnrollmentPlacementPayload } from "../enrollmentPlacement";

describe("buildEnrollmentPlacementPayload", () => {
  it("regression: keeps enrollment year and term in one academic context", () => {
    expect(
      buildEnrollmentPlacementPayload({
        studentId: "student-1",
        academicYear: { id: "year-1", name: "2026-2027" },
        termId: "term-1",
        gradeId: "grade-1",
        sectionId: "section-1",
        classroomId: "classroom-1",
        enrollmentDate: "2026-09-01",
        grades: [{ id: "grade-1", name: "Grade 1" }],
        sections: [{ id: "section-1", name: "Section A" }],
        classrooms: [{ id: "classroom-1", name: "Room 101" }],
      }),
    ).toEqual({
      studentId: "student-1",
      academicYearId: "year-1",
      academicYear: "2026-2027",
      termId: "term-1",
      gradeId: "grade-1",
      grade: "Grade 1",
      sectionId: "section-1",
      section: "Section A",
      classroomId: "classroom-1",
      classroom: "Room 101",
      enrollmentDate: "2026-09-01",
      status: "active",
    });
  });
});
