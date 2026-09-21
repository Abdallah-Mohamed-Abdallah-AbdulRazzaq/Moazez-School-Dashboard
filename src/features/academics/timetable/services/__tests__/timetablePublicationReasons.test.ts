import { describe, expect, it } from "vitest";
import {
  classifyPublicationReasons,
  timetableBackendMessage,
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

  it("localizes known reasons with real names for internal identifiers", () => {
    expect(
      publicationReasonPresentation(
        {
          code: "room_capacity_insufficient",
          message: "Scheduled room capacity is insufficient.",
          details: {
            roomId: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
            roomCapacity: 20,
            classroomCapacity: 30,
          },
        },
        "ar",
        {
          roomId: {
            "f47ac10b-58cc-4372-a567-0e02b2c3d479": "معمل العلوم",
          },
        },
      ),
    ).toEqual({
      message: "سعة إحدى الغرف أقل من سعة الفصل الدراسي.",
      details: [
        { label: "الغرفة", value: "معمل العلوم" },
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

  it("removes UUIDs from unknown backend reason messages and details", () => {
    expect(
      publicationReasonPresentation(
        {
          code: "future_backend_reason",
          message:
            "Entry f47ac10b-58cc-4372-a567-0e02b2c3d479 could not be scheduled.",
          details: {
            futureReference: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
            futureDetail:
              "Assignment f47ac10b-58cc-4372-a567-0e02b2c3d479 is unavailable.",
            count: 2,
          },
        },
        "en",
      ),
    ).toEqual({
      message: "Entry … could not be scheduled.",
      details: [
        { label: "futureDetail", value: "Assignment … is unavailable." },
        { label: "Count", value: "2" },
      ],
    });
  });

  it.each([
    ["teacher_conflict", "المعلم مجدول بالفعل في هذا الوقت."],
    ["CLASSROOM_SLOT", "الفصل لديه حصة أخرى في هذا الوقت."],
    [
      "academics.timetable.room_conflict",
      "الغرفة محجوزة بالفعل في هذا الوقت.",
    ],
  ])("localizes backend conflict code %s", (code, expectedMessage) => {
    expect(timetableBackendMessage(code, "ar", "Backend message")).toBe(
      expectedMessage,
    );
  });
});
