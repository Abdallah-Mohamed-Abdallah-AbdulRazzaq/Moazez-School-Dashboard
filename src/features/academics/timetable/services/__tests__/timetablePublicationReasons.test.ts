import { describe, expect, it } from "vitest";
import { classifyPublicationReasons } from "@/features/academics/timetable/services/timetablePublicationReasons";

describe("classifyPublicationReasons", () => {
  it("groups known reasons and keeps unknown backend reasons visible", () => {
    expect(classifyPublicationReasons([
      { code: "room_inactive", message: "Room is inactive" },
      { code: "teacher_allocation_missing", message: "Teacher missing" },
      { code: "future_backend_reason", message: "Backend detail" },
    ])).toEqual([
      { category: "configuration", reasons: [{ code: "future_backend_reason", message: "Backend detail" }] },
      { category: "teachers", reasons: [{ code: "teacher_allocation_missing", message: "Teacher missing" }] },
      { category: "rooms", reasons: [{ code: "room_inactive", message: "Room is inactive" }] },
    ]);
  });
});
