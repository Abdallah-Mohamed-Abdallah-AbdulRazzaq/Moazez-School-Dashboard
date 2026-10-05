import { describe, expect, it } from "vitest";
import en from "../en.json";
import ar from "../ar.json";

function keyPaths(value: unknown, prefix = ""): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    keyPaths(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe("teacher preparations translations", () => {
  it("keeps English and Arabic keys aligned", () => {
    const english = en.academic_content.teacher_preparations;
    const arabic = ar.academic_content.teacher_preparations;

    expect(keyPaths(arabic).sort()).toEqual(keyPaths(english).sort());
    expect(english.stats.pending_approval).toBe("Pending approval");
    expect(arabic.stats.pending_approval).toBe("بانتظار الموافقة");
  });
});
