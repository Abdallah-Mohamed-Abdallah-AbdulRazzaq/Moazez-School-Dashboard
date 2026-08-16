import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
}));

vi.mock("@/lib/api", () => apiMocks);

import {
  fetchMedicalProfile,
  upsertMedicalProfile,
} from "@/features/students-guardians/medical/services/medicalProfileApiService";

describe("medicalProfileApiService", () => {
  beforeEach(() => {
    apiMocks.apiGet.mockReset();
    apiMocks.apiPatch.mockReset();
  });

  it("returns null when the backend has no medical profile", async () => {
    apiMocks.apiGet.mockResolvedValue(null);

    await expect(fetchMedicalProfile("student-1")).resolves.toBeNull();
  });

  it.each([
    undefined,
    "",
    [],
    {},
    { data: null },
    { result: null },
    { payload: [] },
  ])(
    "returns null for an empty medical-profile response: %j",
    async (response) => {
      apiMocks.apiGet.mockResolvedValue(response);

      await expect(fetchMedicalProfile("student-1")).resolves.toBeNull();
    },
  );

  it("keeps rejecting a non-empty array response", async () => {
    apiMocks.apiGet.mockResolvedValue([{ studentId: "student-1" }]);

    await expect(fetchMedicalProfile("student-1")).rejects.toThrow(
      "Medical profile API response must be an object",
    );
  });

  it("maps the frontend medical form to the backend update DTO", async () => {
    apiMocks.apiPatch.mockResolvedValue({
      id: "medical-1",
      studentId: "student-1",
      bloodType: "O+",
      allergies: "Peanuts",
      notes: "Use inhaler during emergency",
      conditions: ["Asthma", "Diabetes"],
      medications: ["Inhaler", "Insulin"],
    });

    const savedProfile = await upsertMedicalProfile("student-1", {
      studentId: "student-1",
      blood_type: " O+ ",
      allergies: " Peanuts ",
      notes: " Use inhaler during emergency ",
      conditions: [" Asthma ", "Diabetes"],
      medications: [" Inhaler ", "Insulin"],
    });

    expect(apiMocks.apiPatch).toHaveBeenCalledWith(
      "/students-guardians/students/student-1/medical-profile",
      {
        bloodType: "O+",
        allergies: "Peanuts",
        notes: "Use inhaler during emergency",
        conditions: ["Asthma", "Diabetes"],
        medications: ["Inhaler", "Insulin"],
      },
    );
    expect(apiMocks.apiPatch.mock.calls[0][1]).not.toHaveProperty("studentId");
    expect(apiMocks.apiPatch.mock.calls[0][1]).not.toHaveProperty(
      "blood_type",
    );
    expect(apiMocks.apiPatch.mock.calls[0][1]).not.toHaveProperty(
      "emergency_plan",
    );
    expect(savedProfile.conditions).toEqual(["Asthma", "Diabetes"]);
    expect(savedProfile.medications).toEqual(["Inhaler", "Insulin"]);
  });
});
