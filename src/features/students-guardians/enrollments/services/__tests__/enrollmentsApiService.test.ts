import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchCurrentEnrollment } from "@/features/students-guardians/enrollments/services/enrollmentsApiService";

const apiMocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  apiGet: apiMocks.apiGet,
  apiPost: vi.fn(),
}));

describe("enrollmentsApiService", () => {
  beforeEach(() => {
    apiMocks.apiGet.mockReset();
  });

  it("returns null when the current-enrollment response is null", async () => {
    apiMocks.apiGet.mockResolvedValue(null);

    await expect(
      fetchCurrentEnrollment({ studentId: "student-1" }),
    ).resolves.toBeNull();
  });
});
