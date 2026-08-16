import { describe, expect, it } from "vitest";
import type { AxiosError } from "axios";
import { ApiError } from "@/lib/api-error";
import enMessages from "@/messages/en.json";
import arMessages from "@/messages/ar.json";
import { describeGradesApiError, mapGradesApiError } from "../gradesApiErrors";

const backendValidationMessages = [
  "Academic year is required",
  "All required questions must be answered before submission",
  "Assessment approval status is invalid",
  "Assessment context parent ids do not match the selected scope",
  "Assessment date is invalid",
  "Assessment date must be inside the term",
  "Assessment delivery mode is invalid",
  "Assessment max score must be greater than 0",
  "Assessment must be question-based for GradeItem sync",
  "Assessment must be question-based for question management",
  "Assessment must be question-based for question publish validation",
  "Assessment must be question-based for review",
  "Assessment must be question-based for submissions",
  "Assessment type is invalid",
  "Assessment weight budget cannot exceed 100 for this subject and scope",
  "Assessment weight must be greater than 0 and at most 100",
  "Awarded points must be between 0 and the answer max points",
  "Bulk points payload is required",
  "Corrected submission must have totalScore and maxScore before GradeItem sync",
  "Duplicate answer ids are not allowed in bulk review",
  "Duplicate question ids are not allowed",
  "Duplicate question ids are not allowed in bulk answer save",
  "Duplicate selected option ids are not allowed",
  "Duplicate sort orders are not allowed",
  "Duplicate student ids are not allowed in bulk grade entry",
  "Entered grade items require a score",
  "Grade item status is invalid",
  "Grade read-model parent ids do not match the selected scope",
  "Grade rounding mode is invalid",
  "Grade rule context parent ids do not match the selected scope",
  "Grading scale is invalid",
  "Invalid assessment date range",
  "MATCHING questions require metadata when options are not provided",
  "MATCHING questions require options or metadata before publishing",
  "MCQ_MULTI answers require at least one selected option",
  "Pass mark must be between 0 and 100",
  "Question payload is incomplete",
  "Question points are required",
  "Question points must be greater than 0",
  "Question points must be greater than 0 before publishing",
  "Question prompt is required",
  "Question sort order is already in use",
  "Question type is invalid",
  "Question type is required",
  "Question-based assessments are deferred for Sprint 4B",
  "Question-based assessments require at least one active question before publishing",
  "Reorder request must include exactly all active question ids",
  "Scope id aliases do not match",
  "Sort order must be a positive integer",
  "Student id is required",
  "Submission status is invalid",
  "Term is required",
];

describe("Grades API error classification", () => {
  it.each(backendValidationMessages)("classifies backend validation: %s", (message) => {
    const apiError = ApiError.fromAxiosError({
      response: {
        status: 400,
        data: {
          error: {
            code: "validation.failed",
            message,
            details: { field: "date", contextId: "context-1" },
          },
        },
      },
      message: "Request failed",
    } as AxiosError);
    const key = mapGradesApiError(apiError);
    expect(key).not.toBe("validation_failed");
    expect(key).not.toBe("generic");
    expect(enMessages.academics.grades.errors).toHaveProperty(key);
    expect(arMessages.academics.grades.errors).toHaveProperty(key);
  });

  it("preserves field, reason, and trace id for contextual UX", () => {
    const descriptor = describeGradesApiError(new ApiError(
      "Question points are required",
      400,
      "validation.failed",
      undefined,
      { field: "points", reason: "required" },
      "trace-1",
    ));

    expect(descriptor).toMatchObject({
      key: "question_points_required",
      field: "points",
      reason: "required",
      traceId: "trace-1",
      severity: "validation",
    });
  });

  it("classifies DTO validation and extracts the affected field", () => {
    const descriptor = describeGradesApiError(new ApiError(
      "termId must be a UUID",
      400,
      "validation.failed",
      undefined,
      { fields: ["termId must be a UUID"] },
    ));

    expect(descriptor).toMatchObject({ key: "invalid_identifier", field: "termId" });
  });

  it("classifies the real Axios envelope without metadata changing the message", () => {
    const apiError = ApiError.fromAxiosError({
      response: {
        status: 400,
        data: {
          error: {
            code: "validation.failed",
            message: "Assessment date must be inside the term",
            details: {
              field: "date",
              termId: "a5c4fc39-1078-40df-a7eb-1098036a2882",
              startDate: "2026-09-01",
              endDate: "2026-12-31",
              date: "2026-06-21",
            },
            traceId: "trace-date",
          },
        },
      },
      message: "Request failed",
    } as AxiosError);

    expect(apiError.message).toBe("Assessment date must be inside the term");
    expect(describeGradesApiError(apiError)).toMatchObject({
      key: "assessment_date_outside_term",
      field: "date",
      traceId: "trace-date",
    });
  });
});
