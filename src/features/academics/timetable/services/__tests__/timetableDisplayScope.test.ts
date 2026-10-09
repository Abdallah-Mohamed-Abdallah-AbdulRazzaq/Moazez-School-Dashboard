import { describe, expect, it } from "vitest";
import { classroomsForTimetableScope } from "@/features/academics/timetable/services/timetableDisplayScope";
import type {
  Classroom,
  Grade,
  Section,
} from "@/features/academics/academic-structure-tree/services/structureService";
import type { TimetableScopeSelection } from "@/features/academics/timetable/services/timetableScope";

const grades = [
  { id: "grade-1", stageId: "stage-1" },
  { id: "grade-2", stageId: "stage-2" },
] as Grade[];
const sections = [
  { id: "section-1", gradeId: "grade-1" },
  { id: "section-2", gradeId: "grade-2" },
] as Section[];
const classrooms = [
  { id: "classroom-1", sectionId: "section-1" },
  { id: "classroom-2", sectionId: "section-2" },
] as Classroom[];

describe("classroomsForTimetableScope", () => {
  it.each([
    ["term", { scopeType: "TERM" }, ["classroom-1", "classroom-2"]],
    ["stage", { scopeType: "STAGE", stageId: "stage-1" }, ["classroom-1"]],
    ["grade", { scopeType: "GRADE", gradeId: "grade-2" }, ["classroom-2"]],
    ["section", { scopeType: "SECTION", sectionId: "section-1" }, ["classroom-1"]],
    [
      "classroom",
      { scopeType: "CLASSROOM", classroomId: "classroom-2" },
      ["classroom-2"],
    ],
  ] as Array<[string, TimetableScopeSelection, string[]]>) (
    "shows only classrooms belonging to the %s scope",
    (_scopeName, scope, expectedIds) => {
      expect(
        classroomsForTimetableScope({ classrooms, grades, sections, scope }).map(
          (classroom) => classroom.id,
        ),
      ).toEqual(expectedIds);
    },
  );
});
