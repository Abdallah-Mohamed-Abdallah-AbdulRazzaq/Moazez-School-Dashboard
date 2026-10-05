import { describe, expect, it } from "vitest";
import en from "../en.json";
import ar from "../ar.json";

function keyPaths(translationNode: unknown, prefix = ""): string[] {
  if (!translationNode || typeof translationNode !== "object" || Array.isArray(translationNode)) {
    return [prefix];
  }
  return Object.entries(translationNode).flatMap(([key, child]) =>
    keyPaths(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe("teacher preparation detail translations", () => {
  it("keeps English and Arabic keys aligned", () => {
    const english = en.academic_content.teacher_preparation_detail;
    const arabic = ar.academic_content.teacher_preparation_detail;

    expect(english).toBeDefined();
    expect(arabic).toBeDefined();
    expect(keyPaths(arabic).sort()).toEqual(keyPaths(english).sort());
  });
});
