import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchGuardians,
  updateStudentGuardianLink,
} from "@/features/students-guardians/guardians/services/guardiansApiService";

const apiMocks = vi.hoisted(() => ({
  apiPatch: vi.fn(),
  apiGet: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  apiDelete: vi.fn(),
  apiGet: apiMocks.apiGet,
  apiPatch: apiMocks.apiPatch,
  apiPost: vi.fn(),
}));

describe("guardiansApiService", () => {
  beforeEach(() => {
    const guardianResponse = {
      guardianId: "guardian-1",
      full_name: "Guardian One",
      relation: "father",
      phone_primary: "+201001112233",
      phone_secondary: null,
      email: "guardian@example.com",
      national_id: null,
      job_title: null,
      workplace: null,
      is_primary: true,
      can_pickup: true,
      can_receive_notifications: true,
    };
    apiMocks.apiPatch.mockReset().mockResolvedValue(guardianResponse);
    apiMocks.apiGet.mockReset().mockResolvedValue([guardianResponse]);
  });

  it("updates the student-guardian relationship through the backend PATCH contract", async () => {
    const guardian = await updateStudentGuardianLink(
      "student-1",
      "guardian-1",
      {
        is_primary: true,
      },
    );

    expect(apiMocks.apiPatch).toHaveBeenCalledWith(
      "/students-guardians/students/student-1/guardians/guardian-1",
      { is_primary: true },
    );
    expect(guardian).toMatchObject({
      guardianId: "guardian-1",
      is_primary: true,
    });
  });

  it("sends search and relation filters to the guardians collection endpoint", async () => {
    await fetchGuardians({ search: "Ahmed 5551", relation: "father" });

    expect(apiMocks.apiGet).toHaveBeenCalledWith(
      "/students-guardians/guardians?search=Ahmed+5551&relation=father",
    );
  });
});
