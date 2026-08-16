import { describe, expect, it } from "vitest";
import { navigationPermissionByKey } from "../usePermissions";

describe("attendance navigation permissions", () => {
  it("requires absence read access for the Late/Early page", () => {
    expect(navigationPermissionByKey["attendance-late-early"]).toBe(
      "attendance.absences.view",
    );
  });
});
