import { describe, expect, it } from "vitest";
import {
  allowedAudiences,
  formatByteCount,
  isAcademicContentMutableStatus,
  parseByteCount,
  requiresSubject,
  validateTargetDraft,
} from "../academicContentPolicy";
import { ACADEMIC_CONTENT_STATUSES } from "../../types/contracts";

describe("academic content policy", () => {
  it("restricts teacher preparation to internal staff", () => {
    expect(allowedAudiences("TEACHER_PREPARATION")).toEqual(["INTERNAL_STAFF"]);
  });

  it("requires a subject for online-session targets", () => {
    expect(requiresSubject("ONLINE_SESSION")).toBe(true);
    expect(
      validateTargetDraft(
        { scopeType: "GRADE", gradeId: "grade-1" },
        "ONLINE_SESSION",
      ),
    ).toContain("subjectId");
  });

  it("keeps byte counts outside number arithmetic", () => {
    expect(parseByteCount("10737418240")).toBe(10737418240n);
    expect(formatByteCount("10737418240")).toBe("10 GiB");
  });

  it.each(ACADEMIC_CONTENT_STATUSES)(
    "classifies %s using the backend mutable-state contract",
    (status) => {
      expect(isAcademicContentMutableStatus(status)).toBe(
        status === "DRAFT" || status === "CHANGES_REQUESTED",
      );
    },
  );
});
