import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api-error";
import {
  conflictFromTimetableError,
  isTimetableErrorCode,
  publicationBlockingReason,
  timetableErrorMessage,
  timetableFormErrors,
} from "@/features/academics/timetable/services/timetableErrorHandling";

describe("timetableErrorHandling", () => {
  it.each([
    [
      "academics.timetable.period_overlap",
      "Periods cannot overlap.",
    ],
    [
      "academics.timetable.classroom_not_found",
      "The selected classroom no longer exists or is outside this scope.",
    ],
    [
      "academics.timetable.allocation_not_found",
      "The teacher allocation no longer exists or is outside this scope.",
    ],
    [
      "academics.timetable.publication_not_found",
      "No timetable publication exists for this scope.",
    ],
  ])("maps %s to a friendly timetable message", (code, message) => {
    const error = new ApiError("Backend message", 400, code);

    expect(timetableErrorMessage(error)).toBe(message);
  });

  it("uses backend messages when a code has no timetable mapping", () => {
    const error = new ApiError("Backend kept this detail", 400, "UNKNOWN");

    expect(timetableErrorMessage(error)).toBe("Backend kept this detail");
  });

  it("reads nested backend error payloads outside ApiError instances", () => {
    const error = {
      error: {
        code: "academics.timetable.config_not_found",
        message: "Config missing",
      },
    };

    expect(isTimetableErrorCode(error, "academics.timetable.config_not_found")).toBe(true);
    expect(timetableErrorMessage(error)).toBe(
      "No timetable config exists for this scope.",
    );
  });

  it("normalizes field errors from ApiError details", () => {
    const error = new ApiError(
      "Validation failed",
      422,
      "academics.timetable.invalid_time_range",
      undefined,
      {
        startTime: ["Start time is invalid"],
        endTime: "End time is invalid",
      },
    );

    expect(timetableFormErrors(error)).toEqual({
      form: ["Start time must be before end time."],
      fields: {
        startTime: ["Start time is invalid"],
        endTime: ["End time is invalid"],
      },
    });
  });

  it("builds a grid conflict from backend slot details", () => {
    const error = new ApiError(
      "Teacher is already scheduled",
      409,
      "academics.timetable.teacher_conflict",
      undefined,
      {
        dayOfWeek: 2,
        periodIndex: 4,
        teacherId: "teacher-1",
        resourceName: "Ms. Noor",
      },
    );

    expect(conflictFromTimetableError(error)).toEqual(expect.objectContaining({
      type: "TEACHER",
      dayKey: "tue",
      periodIndex: 4,
      resourceId: "teacher-1",
      resourceName: "Ms. Noor",
      sections: [],
    }));
  });

  it("preserves the backend publication blocking reason", () => {
    const error = new ApiError(
      "Timetable publish is blocked by validation failures",
      409,
      "academics.timetable.publish_blocked",
      undefined,
      {
        blockingReasons: [
          { code: "invalid_day", message: "Monday is inactive." },
        ],
      },
    );

    expect(publicationBlockingReason(error)).toBe("Monday is inactive.");
  });
});
