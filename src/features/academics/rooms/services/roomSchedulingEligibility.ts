export type RoomEligibility =
  | { eligible: true }
  | {
      eligible: false;
      reason: "inactive" | "capacity_insufficient";
      roomCapacity?: number;
      classroomCapacity?: number;
    };

type SchedulableRoom = {
  isActive: boolean;
  capacity: number | null;
};

type SchedulableClassroom = {
  capacity?: number | null;
};

export function evaluateRoomEligibility(
  room: SchedulableRoom,
  classroom?: SchedulableClassroom,
): RoomEligibility {
  if (!room.isActive) {
    return { eligible: false, reason: "inactive" };
  }

  if (
    room.capacity !== null &&
    classroom?.capacity != null &&
    room.capacity < classroom.capacity
  ) {
    return {
      eligible: false,
      reason: "capacity_insufficient",
      roomCapacity: room.capacity,
      classroomCapacity: classroom.capacity,
    };
  }

  return { eligible: true };
}
