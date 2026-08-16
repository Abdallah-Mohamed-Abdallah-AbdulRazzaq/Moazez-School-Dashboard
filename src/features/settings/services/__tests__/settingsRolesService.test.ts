import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet } from "@/lib/api";
import { fetchAllSettingsRoles } from "../settingsRolesService";

vi.mock("@/lib/api", () => ({
  apiDelete: vi.fn(),
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
}));

describe("Settings roles exhaustive loading", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the only role page without an extra request", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      items: [{ id: "role-1", name: "Admin", permissions: [] }],
      pagination: { page: 1, limit: 100, total: 1 },
    });

    await expect(fetchAllSettingsRoles()).resolves.toEqual([
      expect.objectContaining({ id: "role-1", name: "Admin" }),
    ]);
    expect(apiGet).toHaveBeenCalledTimes(1);
  });

  it("marks role keys derived from names as non-authoritative", async () => {
    vi.mocked(apiGet).mockResolvedValue([
      {
        id: "role-1",
        name: "School Admin",
        description: null,
        isSystem: true,
        memberCount: 1,
        permissions: [],
      },
      {
        id: "role-2",
        key: "explicit_key",
        name: "Renamed Role",
        description: null,
        isSystem: false,
        memberCount: 0,
        permissions: [],
      },
    ]);

    await expect(fetchAllSettingsRoles()).resolves.toEqual([
      expect.objectContaining({
        id: "role-1",
        key: "school_admin",
        isKeyDerived: true,
      }),
      expect.objectContaining({
        id: "role-2",
        key: "explicit_key",
        isKeyDerived: false,
      }),
    ]);
  });

  it("loads every role page described by pagination", async () => {
    vi.mocked(apiGet)
      .mockResolvedValueOnce({
        items: [{ id: "role-1", name: "Admin", permissions: [] }],
        pagination: { page: 1, limit: 100, total: 101 },
      })
      .mockResolvedValueOnce({
        items: [{ id: "role-101", name: "Custom", permissions: [] }],
        pagination: { page: 2, limit: 100, total: 101 },
      });

    await expect(fetchAllSettingsRoles()).resolves.toEqual([
      expect.objectContaining({ id: "role-1" }),
      expect.objectContaining({ id: "role-101" }),
    ]);
    expect(apiGet).toHaveBeenNthCalledWith(2, "/settings/roles?page=2&limit=100");
  });
});
