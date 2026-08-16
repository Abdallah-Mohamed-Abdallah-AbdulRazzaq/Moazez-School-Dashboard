import { describe, expect, it } from "vitest";
import {
  formatTimetableTime,
  formatTimetableTimeRange,
} from "@/features/academics/timetable/services/timetableTimeFormat";

describe("timetableTimeFormat", () => {
  it("formats 24-hour timetable values as 12-hour AM/PM time", () => {
    expect(formatTimetableTime("13:23")).toBe("1:23 PM");
    expect(formatTimetableTime("03:20")).toBe("3:20 AM");
    expect(formatTimetableTime("00:05")).toBe("12:05 AM");
    expect(formatTimetableTime("12:00")).toBe("12:00 PM");
  });

  it("formats timetable time ranges", () => {
    expect(formatTimetableTimeRange("13:23", "03:20")).toBe(
      "1:23 PM - 3:20 AM",
    );
  });

  it("leaves unexpected values unchanged", () => {
    expect(formatTimetableTime("not-a-time")).toBe("not-a-time");
  });
});
