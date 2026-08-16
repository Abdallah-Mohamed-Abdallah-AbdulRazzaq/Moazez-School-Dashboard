import { describe, expect, it } from "vitest";
import { resolveDashboardActionTarget } from "./resolveDashboardActionTarget";

describe("resolveDashboardActionTarget", () => {
  it.each([
    ["/students", "/students-guardians/students"],
    ["/homework/submissions", "/academics/homework"],
    ["/grades/submissions", "/grades/gradebook"],
    ["/behavior/review", "/behavior/reviews"],
  ])("maps the backend source route %s to the available frontend route %s", (sourceRoute, frontendRoute) => {
    expect(resolveDashboardActionTarget(sourceRoute)).toBe(frontendRoute);
  });

  it("keeps an existing source route unchanged", () => {
    expect(resolveDashboardActionTarget("/attendance/roll-call")).toBe(
      "/attendance/roll-call",
    );
  });
});
