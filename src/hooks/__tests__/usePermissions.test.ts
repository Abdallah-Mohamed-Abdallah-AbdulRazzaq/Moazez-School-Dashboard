import { describe, expect, it } from "vitest";
import {
  filterNavigationItemsByPermission,
  navigationPermissionByKey,
} from "../usePermissions";

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

describe("academic content navigation permissions", () => {
  it("requires Academic Content view access for the workspace", () => {
    expect(navigationPermissionByKey["academic-content-hub"]).toBe(
      "academics.academic_content.view",
    );

    const academicContentItem = [{ key: "academic-content-hub" }];
    expect(
      filterNavigationItemsByPermission(academicContentItem, () => false),
    ).toEqual([]);
    expect(
      filterNavigationItemsByPermission(academicContentItem, (permission) =>
        permission === "academics.academic_content.view",
      ),
    ).toEqual(academicContentItem);
  });
});
