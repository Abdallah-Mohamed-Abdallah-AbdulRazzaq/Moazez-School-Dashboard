import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMocks = vi.hoisted(() => ({
  apiPost: vi.fn(),
}));

vi.mock("@/lib/api", () => apiMocks);

import { authService } from "@/services/auth-service";

describe("auth endpoint contracts", () => {
  beforeEach(() => {
    apiMocks.apiPost.mockReset().mockResolvedValue({});
  });

  it("posts change password payload to /auth/change-password", async () => {
    await authService.changePassword({
      currentPassword: "old-password",
      newPassword: "new-password",
    });

    expect(apiMocks.apiPost).toHaveBeenCalledWith("/auth/change-password", {
      currentPassword: "old-password",
      newPassword: "new-password",
    });
  });
});
