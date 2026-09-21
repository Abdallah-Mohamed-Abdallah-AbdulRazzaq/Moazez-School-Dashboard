import { describe, expect, it } from "vitest";
import { roomSchedulingUiError } from "../roomSchedulingErrors";
import { ApiError } from "@/lib/api-error";

describe("roomSchedulingUiError", () => {
  it("maps the backend reason and known numeric details", () => {
    const error = new ApiError(
      "Room is required by current scheduling state",
      409,
      "academics.rooms.scheduling_dependency",
      undefined,
      {
        reason: "capacity_insufficient",
        roomId: "room-1",
        activeTimetableEntryCount: 2,
        incompatibleClassroomCount: 4,
        proposedRoomCapacity: 20,
      },
      "trace-1",
    );

    expect(roomSchedulingUiError(error)).toEqual({
      code: "academics.rooms.scheduling_dependency",
      reason: "capacity_insufficient",
      details: {
        activeTimetableEntryCount: 2,
        incompatibleClassroomCount: 4,
        proposedRoomCapacity: 20,
      },
      traceId: "trace-1",
    });
  });

  it("does not convert unrelated API errors into scheduling dependencies", () => {
    const error = new ApiError(
      "Room not found",
      404,
      "academics.rooms.not_found",
    );

    expect(roomSchedulingUiError(error)).toBeNull();
  });
});
