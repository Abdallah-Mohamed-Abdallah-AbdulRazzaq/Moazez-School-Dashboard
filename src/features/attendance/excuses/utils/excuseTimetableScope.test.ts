import { describe, expect, it, vi } from "vitest";
import {
  getExcuseTimetableCandidates,
  resolveExcuseTimetableConfig,
} from "./excuseTimetableScope";

describe("getExcuseTimetableCandidates", () => {
  it("builds a complete classroom-to-term fallback chain", () => {
    expect(
      getExcuseTimetableCandidates("year-1", "term-1", "CLASSROOM", {
        stageId: "stage-1",
        gradeId: "grade-1",
        sectionId: "section-1",
        classroomId: "classroom-1",
      }),
    ).toEqual([
      {
        academicYearId: "year-1",
        termId: "term-1",
        scopeType: "CLASSROOM",
        gradeId: "grade-1",
        sectionId: "section-1",
        classroomId: "classroom-1",
      },
      {
        academicYearId: "year-1",
        termId: "term-1",
        scopeType: "SECTION",
        gradeId: "grade-1",
        sectionId: "section-1",
      },
      {
        academicYearId: "year-1",
        termId: "term-1",
        scopeType: "GRADE",
        gradeId: "grade-1",
      },
      { academicYearId: "year-1", termId: "term-1", scopeType: "TERM" },
    ]);
  });

  it("does not assume a timetable for school-scoped requests", () => {
    expect(
      getExcuseTimetableCandidates("year-1", "term-1", "SCHOOL"),
    ).toEqual([]);
  });

  it("does not guess a timetable for stage scope", () => {
    expect(
      getExcuseTimetableCandidates("year-1", "term-1", "STAGE", {
        stageId: "stage-1",
      }),
    ).toEqual([]);
  });
});

describe("resolveExcuseTimetableConfig", () => {
  it("stops after the first matching configuration", async () => {
    const classroomConfig = { id: "classroom-config", periods: [] };
    const load = vi.fn().mockResolvedValue(classroomConfig);

    await expect(
      resolveExcuseTimetableConfig(
        getExcuseTimetableCandidates("year-1", "term-1", "CLASSROOM", {
          gradeId: "grade-1",
          sectionId: "section-1",
          classroomId: "classroom-1",
        }),
        load,
      ),
    ).resolves.toBe(classroomConfig);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("falls through missing exact configurations in hierarchy order", async () => {
    const termConfig = { id: "term-config", periods: [] };
    const load = vi
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(termConfig);
    const candidates = getExcuseTimetableCandidates(
      "year-1",
      "term-1",
      "SECTION",
      { gradeId: "grade-1", sectionId: "section-1" },
    );

    await expect(resolveExcuseTimetableConfig(candidates, load)).resolves.toBe(
      termConfig,
    );
    expect(load.mock.calls.map(([candidate]) => candidate.scopeType)).toEqual([
      "SECTION",
      "GRADE",
      "TERM",
    ]);
  });
});
