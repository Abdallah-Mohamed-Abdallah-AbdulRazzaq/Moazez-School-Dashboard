import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiPatch } from "@/lib/api";
import { setSettingsUserStatus } from "../settingsUsersService";

vi.mock("@/lib/api", () => ({
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  apiPost: vi.fn(),
}));

describe("Settings users status contract", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the backend partial status response without mapping a full user", async () => {
    vi.mocked(apiPatch).mockResolvedValue({
      id: "user-1",
      status: "inactive",
    });

    await expect(
      setSettingsUserStatus("user-1", "inactive"),
    ).resolves.toEqual({
      id: "user-1",
      status: "inactive",
    });
    expect(apiPatch).toHaveBeenCalledWith("/settings/users/user-1/status", {
      status: "inactive",
    });
  });
});
