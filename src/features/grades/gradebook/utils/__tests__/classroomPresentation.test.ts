import { describe, expect, it } from "vitest";
import { applyScopedClassroomName, hasClassroomNames } from "../classroomPresentation";

describe("classroom presentation", () => {
  it("adds the known classroom name without replacing row-specific data", () => {
    const rows = [
      { studentId: "student-1" },
      { studentId: "student-2", classroomName: "Existing classroom" },
    ];

    expect(applyScopedClassroomName(rows, "Classroom A")).toEqual([
      { studentId: "student-1", classroomName: "Classroom A" },
      { studentId: "student-2", classroomName: "Existing classroom" },
    ]);
  });

  it("does not expose a classroom column when the API provides no classroom names", () => {
    expect(hasClassroomNames([{ studentId: "student-1" }, { studentId: "student-2" }])).toBe(false);
    expect(hasClassroomNames([{ studentId: "student-1", classroomName: "Classroom A" }])).toBe(true);
  });
});
