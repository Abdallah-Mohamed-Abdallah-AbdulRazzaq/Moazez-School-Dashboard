import { describe, expect, it } from "vitest";
import {
  resolveTimetableScopeSelection,
  timetableConfigScopeId,
} from "@/features/academics/timetable/services/timetableScope";

describe("timetable scope", () => {
  it.each([
    [
      { stageId: "stage-1", gradeId: "", sectionId: "", classroomId: "" },
      { scopeType: "STAGE", stageId: "stage-1" },
    ],
    [
      {
        stageId: "stage-1",
        gradeId: "grade-1",
        sectionId: "",
        classroomId: "",
      },
      { scopeType: "GRADE", gradeId: "grade-1" },
    ],
    [
      {
        stageId: "stage-1",
        gradeId: "grade-1",
        sectionId: "section-1",
        classroomId: "",
      },
      { scopeType: "SECTION", sectionId: "section-1" },
    ],
    [
      {
        stageId: "stage-1",
        gradeId: "grade-1",
        sectionId: "section-1",
        classroomId: "classroom-1",
      },
      { scopeType: "CLASSROOM", classroomId: "classroom-1" },
    ],
    [
      { stageId: "", gradeId: "", sectionId: "", classroomId: "" },
      { scopeType: "TERM" },
    ],
  ] as const)("selects the narrowest populated scope", (input, expected) => {
    expect(resolveTimetableScopeSelection(input)).toEqual(expected);
  });

  it.each([
    [
      {
        scopeType: "stage",
        stageId: "stage-1",
        gradeId: null,
        sectionId: null,
        classroomId: null,
      },
      "stage-1",
    ],
    [
      {
        scopeType: "grade",
        stageId: "stage-1",
        gradeId: "grade-1",
        sectionId: null,
        classroomId: null,
      },
      "grade-1",
    ],
    [
      {
        scopeType: "section",
        stageId: "stage-1",
        gradeId: "grade-1",
        sectionId: "section-1",
        classroomId: null,
      },
      "section-1",
    ],
    [
      {
        scopeType: "classroom",
        stageId: "stage-1",
        gradeId: "grade-1",
        sectionId: "section-1",
        classroomId: "classroom-1",
      },
      "classroom-1",
    ],
    [
      {
        scopeType: "term",
        stageId: null,
        gradeId: null,
        sectionId: null,
        classroomId: null,
      },
      undefined,
    ],
  ] as const)("uses the identifier belonging to the config scope", (config, expected) => {
    expect(timetableConfigScopeId(config)).toBe(expected);
  });
});
