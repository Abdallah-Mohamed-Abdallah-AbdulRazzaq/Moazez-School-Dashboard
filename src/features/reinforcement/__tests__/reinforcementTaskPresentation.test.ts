import { describe, expect, it } from "vitest";
import { getReinforcementTaskTargetLabel } from "@/features/reinforcement/utils/reinforcementTaskPresentation";
import type {
  ReinforcementFilterOptions,
  ReinforcementTaskTarget,
} from "@/features/reinforcement/types";

describe("reinforcement task response presentation", () => {
  it("resolves backend scopeKey targets through filter option names", () => {
    const target: ReinforcementTaskTarget = {
      id: "target-1",
      scopeType: "grade",
      scopeKey: "grade-1",
      stageId: null,
      gradeId: "grade-1",
      sectionId: null,
      classroomId: null,
      studentId: null,
    };
    const options: ReinforcementFilterOptions = {
      grades: [
        {
          id: "grade-1",
          name: "Grade One",
          nameEn: "Grade One",
          nameAr: "الصف الأول",
        },
      ],
    };

    expect(getReinforcementTaskTargetLabel(target, options, "en")).toBe(
      "Grade One",
    );
    expect(getReinforcementTaskTargetLabel(target, options, "ar")).toBe(
      "الصف الأول",
    );
  });

  it("falls back to scopeKey when filter options cannot resolve a target", () => {
    const target: ReinforcementTaskTarget = {
      id: "target-1",
      scopeType: "student",
      scopeKey: "student-1",
      stageId: null,
      gradeId: null,
      sectionId: null,
      classroomId: null,
      studentId: "student-1",
    };

    expect(getReinforcementTaskTargetLabel(target, {}, "en")).toBe(
      "student-1",
    );
  });
});
