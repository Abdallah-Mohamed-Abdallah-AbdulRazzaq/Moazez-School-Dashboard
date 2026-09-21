import { Room } from "@/features/academics/timetable/types/timetable";
import { roomsApiAdapter } from "@/features/academics/rooms/services/roomsApiAdapter";

export type RoomAssignmentSource = "RECOMMENDED" | "MANUAL";

export const fetchRooms = (schoolId: string): Promise<Room[]> =>
  roomsApiAdapter.fetchRooms(schoolId);

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
