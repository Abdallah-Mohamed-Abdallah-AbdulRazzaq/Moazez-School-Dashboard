import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import type { Room } from "@/features/academics/timetable/types/timetable";
import type { RoomsAdapter } from "@/features/academics/rooms/services/roomsAdapter";

export interface RoomApiDto {
  id: string;
  name: string;
  nameAr: string;
  nameEn: string;
  capacity: number | null;
  floor: string | null;
  building: string | null;
  isActive: boolean;
}

export interface RoomsListResponse {
  items: RoomApiDto[];
}

export type RoomPayload = {
  nameAr?: string;
  nameEn?: string;
  name?: string;
  capacity?: number | null;
  floor?: string | null;
  building?: string | null;
  isActive?: boolean;
};

export type DeleteRoomResponse = {
  ok: boolean;
};

const mapRoom = (dto: RoomApiDto): Room => ({
  id: dto.id,
  schoolId: "",
  name: dto.name || dto.nameEn || dto.nameAr,
  nameAr: dto.nameAr,
  nameEn: dto.nameEn,
  capacity: dto.capacity ?? 0,
  floor: dto.floor ?? undefined,
  building: dto.building ?? undefined,
  isActive: dto.isActive,
});

const toRoomPayload = (room: Partial<Room>): RoomPayload => ({
  ...(typeof room.nameAr !== "undefined" ? { nameAr: room.nameAr } : {}),
  ...(typeof room.nameEn !== "undefined" ? { nameEn: room.nameEn } : {}),
  ...(typeof room.capacity !== "undefined" ? { capacity: room.capacity } : {}),
  ...(typeof room.floor !== "undefined" ? { floor: room.floor || null } : {}),
  ...(typeof room.building !== "undefined"
    ? { building: room.building || null }
    : {}),
  ...(typeof room.isActive !== "undefined" ? { isActive: room.isActive } : {}),
});

export const createRoomsApiAdapter = (
  basePath: string = "/academics/rooms",
): RoomsAdapter => ({
  async fetchRooms() {
    const res = await apiGet<RoomsListResponse | RoomApiDto[]>(basePath);
    const items = Array.isArray(res) ? res : res.items ?? [];
    return items.map(mapRoom);
  },

  async fetchRoomDefaultAssignments() {
    return [];
  },

  async createRoom(schoolId, room) {
    void schoolId;
    const payload = toRoomPayload(room);
    const created = await apiPost<RoomApiDto>(basePath, payload);
    return mapRoom(created);
  },

  async updateRoom(roomId, updates) {
    const payload = toRoomPayload(updates);
    const updated = await apiPatch<RoomApiDto>(`${basePath}/${roomId}`, payload);
    return mapRoom(updated);
  },

  async deleteRoom(roomId) {
    await apiDelete<DeleteRoomResponse>(`${basePath}/${roomId}`);
  },
});

export const roomsApiAdapter = createRoomsApiAdapter();
