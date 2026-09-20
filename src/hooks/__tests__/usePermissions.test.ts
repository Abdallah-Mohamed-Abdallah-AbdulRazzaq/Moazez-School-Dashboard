import { describe, expect, it } from "vitest";
import { navigationPermissionByKey } from "../usePermissions";

describe("attendance navigation permissions", () => {
  it("requires absence read access for the Late/Early page", () => {
    expect(navigationPermissionByKey["attendance-late-early"]).toBe(
      "attendance.absences.view",
    );
  });
});

describe("timetable navigation permissions", () => {
  it("uses the dashboard timetable read permission required by the backend", () => {
    expect(navigationPermissionByKey["academics-timetable"]).toBe(
      "academics.structure.view",
    );
  });
});
