import { describe, expect, it } from "vitest";
import {
  classifyPublicationReasons,
  publicationReasonPresentation,
} from "@/features/academics/timetable/services/timetablePublicationReasons";

describe("classifyPublicationReasons", () => {
  it("groups known reasons and keeps unknown backend reasons visible", () => {
    expect(
      classifyPublicationReasons([
        { code: "room_inactive", message: "Room is inactive" },
        { code: "teacher_allocation_missing", message: "Teacher missing" },
        { code: "future_backend_reason", message: "Backend detail" },
      ]),
    ).toEqual([
      {
        category: "configuration",
        reasons: [{ code: "future_backend_reason", message: "Backend detail" }],
      },
      {
        category: "teachers",
        reasons: [
          { code: "teacher_allocation_missing", message: "Teacher missing" },
        ],
      },
      {
        category: "rooms",
        reasons: [{ code: "room_inactive", message: "Room is inactive" }],
      },
    ]);
  });

  it("localizes known reasons and labels backend details", () => {
    expect(
      publicationReasonPresentation(
        {
          code: "room_capacity_insufficient",
          message: "Scheduled room capacity is insufficient.",
          details: {
            roomId: "room-1",
            roomCapacity: 20,
            classroomCapacity: 30,
          },
        },
        "ar",
      ),
    ).toEqual({
      message: "سعة إحدى الغرف أقل من سعة الفصل الدراسي.",
      details: [
        { label: "الغرفة", value: "room-1" },
        { label: "سعة الغرفة", value: "20" },
        { label: "سعة الفصل", value: "30" },
      ],
    });
  });

  it("keeps unknown backend messages and details visible", () => {
    expect(
      publicationReasonPresentation(
        {
          code: "future_backend_reason",
          message: "Backend detail",
          details: { futureReference: "reference-1" },
        },
        "en",
      ),
    ).toEqual({
      message: "Backend detail",
      details: [{ label: "futureReference", value: "reference-1" }],
    });
  });
});
