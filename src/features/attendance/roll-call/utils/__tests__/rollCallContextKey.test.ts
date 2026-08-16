import { describe, expect, it } from "vitest";
import { getRollCallContextKey } from "../rollCallContextKey";

describe("getRollCallContextKey", () => {
  it("changes immediately when the selected scope changes", () => {
    const classroom = getRollCallContextKey({
      yearId: "year-1",
      termId: "term-1",
      date: "2026-08-08",
      scopeType: "CLASSROOM",
      scopeIds: { classroomId: "classroom-1" },
    });
    const school = getRollCallContextKey({
      yearId: "year-1",
      termId: "term-1",
      date: "2026-08-08",
      scopeType: "SCHOOL",
      scopeIds: {},
    });

    expect(school).not.toBe(classroom);
  });
});
