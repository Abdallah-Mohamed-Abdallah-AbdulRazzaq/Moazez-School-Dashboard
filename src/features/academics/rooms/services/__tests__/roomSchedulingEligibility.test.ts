import { describe, expect, it } from "vitest";
import { evaluateRoomEligibility } from "@/features/academics/rooms/services/roomSchedulingEligibility";

const activeRoom = { id: "room-1", isActive: true, capacity: 30 };
const classroom = { id: "classroom-1", capacity: 25 };

describe("evaluateRoomEligibility", () => {
  it("rejects inactive rooms regardless of capacity", () => {
    expect(
      evaluateRoomEligibility({ ...activeRoom, isActive: false }, classroom),
    ).toMatchObject({ eligible: false, reason: "inactive" });
  });

  it.each([
    [30, 25, true],
    [20, 25, false],
    [null, 25, true],
    [30, undefined, true],
  ])(
    "uses capacity only when both room and classroom capacities are known",
    (roomCapacity, classroomCapacity, eligible) => {
      expect(
        evaluateRoomEligibility(
          { ...activeRoom, capacity: roomCapacity },
          { ...classroom, capacity: classroomCapacity },
        ).eligible,
      ).toBe(eligible);
    },
  );
});
