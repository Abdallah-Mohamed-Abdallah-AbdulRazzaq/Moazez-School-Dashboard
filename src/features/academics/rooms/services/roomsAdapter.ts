import type { Room } from "@/features/academics/timetable/types/timetable";

export interface RoomsAdapter {
  fetchRooms(schoolId: string): Promise<Room[]>;
  createRoom(
    schoolId: string,
    room: Omit<Room, "id" | "schoolId" | "createdAt" | "updatedAt">
  ): Promise<Room>;
  updateRoom(
    roomId: string,
    updates: Partial<Omit<Room, "id" | "schoolId" | "createdAt">>
  ): Promise<Room>;
  deleteRoom(roomId: string): Promise<void>;
}
