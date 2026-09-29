import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api-error";
import { academicContentUiError } from "../academicContentErrors";

describe("academicContentUiError", () => {
  it("preserves backend domain-error context", () => {
    expect(
      academicContentUiError(
        new ApiError(
          "Term is closed",
          409,
          "academic_content.term.closed",
          undefined,
          { termId: "term-1" },
          "trace-1",
        ),
      ),
    ).toEqual({
      code: "academic_content.term.closed",
      message: "Term is closed",
      details: { termId: "term-1" },
      traceId: "trace-1",
    });
  });

  it("normalizes non-API errors without inventing backend metadata", () => {
    expect(academicContentUiError(new Error("Unexpected failure"))).toEqual({
      code: "UNKNOWN_ERROR",
      message: "Unexpected failure",
    });
  });
});
