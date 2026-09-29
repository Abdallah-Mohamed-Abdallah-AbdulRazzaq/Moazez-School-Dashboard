import { describe, expect, it } from "vitest";
import {
  allowedAudiences,
  formatByteCount,
  parseByteCount,
  requiresSubject,
  validateTargetDraft,
} from "../academicContentPolicy";

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
});
