import { Room } from "@/features/academics/timetable/types/timetable";
import { roomsApiAdapter } from "@/features/academics/rooms/services/roomsApiAdapter";

export interface RoomDefaultAssignment {
  id: string;
  schoolId: string;
  scopeType: "SECTION" | "CLASSROOM";
  scopeId: string;
  roomId: string;
}

export type RoomAssignmentSource =
  | "CLASSROOM_DEFAULT"
  | "SECTION_DEFAULT"
  | "RECOMMENDED"
  | "MANUAL";

export function resolveDefaultRoomAssignmentForTarget(
  defaults: RoomDefaultAssignment[],
  params: {
    schoolId: string;
    sectionId: string;
    classroomId?: string;
  }
): RoomDefaultAssignment | null {
  const { schoolId, sectionId, classroomId } = params;

  const classroomDefault = classroomId
    ? defaults.find(
        (item) =>
          item.schoolId === schoolId &&
          item.scopeType === "CLASSROOM" &&
          item.scopeId === classroomId
      )
    : undefined;

  if (classroomDefault) {
    return classroomDefault;
  }

  return (
    defaults.find(
      (item) =>
        item.schoolId === schoolId &&
        item.scopeType === "SECTION" &&
        item.scopeId === sectionId
    ) || null
  );
}

export function resolveDefaultRoomSourceForTarget(
  defaults: RoomDefaultAssignment[],
  params: {
    schoolId: string;
    sectionId: string;
    classroomId?: string;
  }
): Extract<RoomAssignmentSource, "CLASSROOM_DEFAULT" | "SECTION_DEFAULT"> | null {
  const assignment = resolveDefaultRoomAssignmentForTarget(defaults, params);

  if (!assignment) {
    return null;
  }

  return assignment.scopeType === "CLASSROOM"
    ? "CLASSROOM_DEFAULT"
    : "SECTION_DEFAULT";
}

export function resolveDefaultRoomForTarget(
  rooms: Room[],
  defaults: RoomDefaultAssignment[],
  params: {
    schoolId: string;
    sectionId: string;
    classroomId?: string;
  }
): Room | null {
  const assignment = resolveDefaultRoomAssignmentForTarget(defaults, params);
  return assignment ? rooms.find((room) => room.id === assignment.roomId) || null : null;
}

export const fetchRooms = (schoolId: string): Promise<Room[]> =>
  roomsApiAdapter.fetchRooms(schoolId);

export const fetchRoomDefaultAssignments = (
  schoolId: string
): Promise<RoomDefaultAssignment[]> =>
  roomsApiAdapter.fetchRoomDefaultAssignments(schoolId);

export const createRoom = (
  schoolId: string,
  room: Omit<Room, "id" | "schoolId" | "createdAt" | "updatedAt">
): Promise<Room> => roomsApiAdapter.createRoom(schoolId, room);

export const updateRoom = (
  roomId: string,
  updates: Partial<Omit<Room, "id" | "schoolId" | "createdAt">>
): Promise<Room> => roomsApiAdapter.updateRoom(roomId, updates);

export const deleteRoom = (roomId: string): Promise<void> =>
  roomsApiAdapter.deleteRoom(roomId);
