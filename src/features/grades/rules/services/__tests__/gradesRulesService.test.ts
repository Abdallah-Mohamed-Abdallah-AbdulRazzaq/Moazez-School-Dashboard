import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiGet, apiPost, apiPatch } = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
}));

vi.mock("@/lib/api", () => ({ apiGet, apiPost, apiPatch }));

import {
  fetchEffectiveGradeRule,
  fetchGradeRules,
  saveGradeRule,
  updateGradeRule,
} from "../gradesRulesService";

describe("gradesRulesService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("maps the backend list contract and preserves list filters", async () => {
    apiGet.mockResolvedValue({
      items: [{
        id: "rule-1",
        yearId: "year-1",
        termId: "term-1",
        scopeType: "grade",
        scopeKey: "grade-1",
        gradeId: "grade-1",
        gradingScale: "percentage",
        passMark: 62.5,
        rounding: "decimal_1",
      }],
    });

    const rules = await fetchGradeRules("year-1", "term-1", {
      scopeType: "grade",
      gradeId: "grade-1",
    });

    expect(apiGet).toHaveBeenCalledWith("/grades/rules", {
      params: {
        academicYearId: "year-1",
        termId: "term-1",
        scopeType: "grade",
        gradeId: "grade-1",
      },
    });
    expect(rules).toEqual([expect.objectContaining({
      id: "rule-1",
      academicYearId: "year-1",
      scopeId: "grade-1",
      gradingScale: "PERCENTAGE",
      rounding: "DECIMAL_1",
    })]);
  });

  it("maps an effective default without inventing a rule id", async () => {
    apiGet.mockResolvedValue({
      source: "DEFAULT",
      id: null,
      ruleId: null,
      scopeType: "classroom",
      scopeKey: "classroom-1",
      gradeId: "grade-1",
      gradingScale: "percentage",
      passMark: 50,
      rounding: "decimal_2",
    });

    const rule = await fetchEffectiveGradeRule({
      academicYearId: "year-1",
      termId: "term-1",
      scopeType: "classroom",
      scopeId: "classroom-1",
    });

    expect(rule).toEqual(expect.objectContaining({
      id: "",
      ruleId: null,
      source: "DEFAULT",
      scopeId: "classroom-1",
      rounding: "DECIMAL_2",
    }));
  });

  it("sends the writable school or grade rule contract", async () => {
    apiPost.mockResolvedValue({ id: "rule-1", gradingScale: "percentage", rounding: "none" });
    const payload = {
      academicYearId: "year-1",
      termId: "term-1",
      scopeType: "grade" as const,
      gradeId: "grade-1",
      passMark: 60,
      gradingScale: "PERCENTAGE" as const,
      rounding: "NONE" as const,
    };

    await saveGradeRule(payload);

    expect(apiPost).toHaveBeenCalledWith("/grades/rules", payload);
  });

  it("patches only editable values by rule UUID", async () => {
    apiPatch.mockResolvedValue({ id: "rule-1", gradingScale: "percentage", rounding: "decimal_0" });
    const payload = { passMark: 70, gradingScale: "PERCENTAGE" as const, rounding: "DECIMAL_0" as const };

    await updateGradeRule("rule-1", payload);

    expect(apiPatch).toHaveBeenCalledWith("/grades/rules/rule-1", payload);
  });
});
