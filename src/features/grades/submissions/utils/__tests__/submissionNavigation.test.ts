import { describe, expect, it } from "vitest";
import { buildAssessmentsHref, buildSubmissionDetailHref, buildSubmissionReturnHref } from "../submissionNavigation";

describe("submission navigation", () => {
  it("returns to assessments with trusted filters only", () => {
    expect(buildAssessmentsHref({ locale: "ar", context: new URLSearchParams("year=year-2026&term=term-1&scopeType=classroom&scopeId=classroom-1&subjectId=subject-1&unknown=drop") })).toBe("/ar/grades/assessments?year=year-2026&term=term-1&scopeType=classroom&scopeId=classroom-1&subjectId=subject-1");
  });

  it("allows only trusted grade context", () => {
    expect(buildSubmissionDetailHref({ locale: "ar", submissionId: "submission", source: "gradebook", context: new URLSearchParams("year=year-2026&term=term-1&unknown=drop") })).toBe("/ar/grades/submissions/submission?year=year-2026&term=term-1&source=gradebook");
    expect(buildSubmissionReturnHref({ locale: "ar", source: "assessment-submissions", assessmentId: "assessment", context: new URLSearchParams("year=year-2026&term=term-1") })).toBe("/ar/grades/assessments/assessment/submissions?year=year-2026&term=term-1");
    expect(buildSubmissionReturnHref({ locale: "ar", source: "unknown", assessmentId: "assessment", context: new URLSearchParams("unknown=drop") })).toBe("/ar/grades/assessments/assessment/submissions");
    expect(buildSubmissionReturnHref({ locale: "ar", source: "gradebook", assessmentId: "assessment", context: new URLSearchParams("returnTo=https://evil.test") })).toBe("/ar/grades/gradebook");
    expect(buildSubmissionReturnHref({ locale: "ar", source: null, assessmentId: null, context: new URLSearchParams("returnTo=https://evil.test") })).toBe("/ar/grades/gradebook");
  });
});
