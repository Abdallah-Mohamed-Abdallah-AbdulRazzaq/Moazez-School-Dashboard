import { describe, expect, it } from "vitest";
import {
  buildDismissalGatesListParams,
  buildDismissalStaffAssignmentsListParams,
} from "@/features/nedaa/utils/nedaaFilters";

describe("nedaaFilters", () => {
  it("builds server-side gate params without empty filter values", () => {
    expect(
      buildDismissalGatesListParams({
        q: "  main gate  ",
        status: "open",
        active: "true",
        page: 2,
        limit: 25,
      }),
    ).toEqual({
      q: "main gate",
      status: "open",
      active: true,
      page: 2,
      limit: 25,
    });

    expect(
      buildDismissalGatesListParams({
        q: " ",
        status: "",
        active: "",
        page: 1,
        limit: 10,
      }),
    ).toEqual({ page: 1, limit: 10 });
  });

  it("builds server-side staff assignment params from searchable ID filters", () => {
    expect(
      buildDismissalStaffAssignmentsListParams({
        q: "  operator  ",
        staffUserId: "staff-1",
        gateId: "gate-1",
        stageId: "stage-1",
        gradeId: "grade-1",
        sectionId: "section-1",
        classroomId: "classroom-1",
        active: "false",
        lead: "true",
        page: 3,
        limit: 50,
      }),
    ).toEqual({
      q: "operator",
      staffUserId: "staff-1",
      gateId: "gate-1",
      stageId: "stage-1",
      gradeId: "grade-1",
      sectionId: "section-1",
      classroomId: "classroom-1",
      active: false,
      lead: true,
      page: 3,
      limit: 50,
    });
  });
});
