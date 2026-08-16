import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import { createRoomsApiAdapter } from "@/features/academics/rooms/services/roomsApiAdapter";

vi.mock("@/lib/api", () => ({
  apiDelete: vi.fn(),
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  apiPost: vi.fn(),
}));

const mockedApiDelete = vi.mocked(apiDelete);
const mockedApiGet = vi.mocked(apiGet);
const mockedApiPatch = vi.mocked(apiPatch);
const mockedApiPost = vi.mocked(apiPost);

describe("roomsApiAdapter", () => {
  const adapter = createRoomsApiAdapter();

  beforeEach(() => {
    mockedApiDelete.mockReset();
    mockedApiGet.mockReset();
    mockedApiPatch.mockReset();
    mockedApiPost.mockReset();
  });

  it("unwraps rooms from the API list envelope", async () => {
    mockedApiGet.mockResolvedValue({
      items: [
        {
          id: "room-1",
          name: "Science Lab",
          nameAr: "معمل العلوم",
          nameEn: "Science Lab",
          capacity: null,
          floor: null,
          building: "Block A",
          isActive: true,
        },
      ],
    });

    await expect(adapter.fetchRooms("school-1")).resolves.toEqual([
      {
        id: "room-1",
        schoolId: "",
        name: "Science Lab",
        nameAr: "معمل العلوم",
        nameEn: "Science Lab",
        capacity: 0,
        floor: undefined,
        building: "Block A",
        isActive: true,
      },
    ]);
    expect(mockedApiGet).toHaveBeenCalledWith("/academics/rooms");
  });

  it("returns no room defaults without calling an unsupported endpoint", async () => {
    await expect(
      adapter.fetchRoomDefaultAssignments("school-1"),
    ).resolves.toEqual([]);
    expect(mockedApiGet).not.toHaveBeenCalled();
  });

  it("creates rooms with only backend-supported payload fields", async () => {
    mockedApiPost.mockResolvedValue({
      id: "room-2",
      name: "Room 201",
      nameAr: "غرفة 201",
      nameEn: "Room 201",
      capacity: 25,
      floor: null,
      building: null,
      isActive: true,
    });

    await adapter.createRoom("school-1", {
      id: "client-only",
      schoolId: "school-1",
      nameAr: "غرفة 201",
      nameEn: "Room 201",
      capacity: 25,
      floor: "",
      building: "",
      isActive: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });

    expect(mockedApiPost).toHaveBeenCalledWith("/academics/rooms", {
      nameAr: "غرفة 201",
      nameEn: "Room 201",
      capacity: 25,
      floor: null,
      building: null,
      isActive: true,
    });
  });

  it("updates rooms with only changed supported payload fields", async () => {
    mockedApiPatch.mockResolvedValue({
      id: "room-3",
      name: "Updated Lab",
      nameAr: "المعمل المحدث",
      nameEn: "Updated Lab",
      capacity: null,
      floor: "2",
      building: "Block B",
      isActive: false,
    });

    await adapter.updateRoom("room-3", {
      capacity: null,
      floor: "2",
      building: "Block B",
      isActive: false,
    });

    expect(mockedApiPatch).toHaveBeenCalledWith("/academics/rooms/room-3", {
      capacity: null,
      floor: "2",
      building: "Block B",
      isActive: false,
    });
  });

  it("accepts successful delete responses", async () => {
    mockedApiDelete.mockResolvedValue({ ok: true });

    await expect(adapter.deleteRoom("room-4")).resolves.toBeUndefined();

    expect(mockedApiDelete).toHaveBeenCalledWith("/academics/rooms/room-4");
  });
});
