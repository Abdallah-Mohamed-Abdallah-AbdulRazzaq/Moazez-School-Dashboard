import { describe, expect, it } from "vitest";
import { buildRulesLocation, findRuleForEditor } from "../rulesRoute";

describe("grade rules editor routing", () => {
  it("selects only the rule addressed by the edit route", () => {
    const rule = { id: "rule-2", scopeType: "grade" };
    expect(findRuleForEditor([{ id: "rule-1" }, rule], "rule-2")).toBe(rule);
  });

  it("keeps the editor pathname while synchronizing context", () => {
    expect(buildRulesLocation("/en/grades/rules/rule-2", "year=year-1&term=term-1")).toBe(
      "/en/grades/rules/rule-2?year=year-1&term=term-1",
    );
  });
});
