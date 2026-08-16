import { describe, expect, it } from "vitest";
import en from "../en.json";
import ar from "../ar.json";

describe("Admissions workflow policy translations", () => {
  it("keeps the complete namespace in both locales", () => {
    expect(en.admissions.workflowPolicy).toBeDefined();
    expect(ar.admissions.workflowPolicy).toBeDefined();
    expect(Object.keys(ar.admissions.workflowPolicy).sort()).toEqual(Object.keys(en.admissions.workflowPolicy).sort());
  });

  it("keeps application profile tab labels available in both locales", () => {
    expect(Object.keys(ar.admissions.application360.tabs).sort()).toEqual(
      Object.keys(en.admissions.application360.tabs).sort(),
    );
  });
});
