import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import {
  calculateBrandingProfileCompleteness,
  deleteBrandingLogo,
  fetchBrandingProfile,
  updateBrandingProfile,
  uploadBrandingLogo,
} from "../brandingService";
import type { SchoolProfileSettings } from "../../types";

vi.mock("@/lib/api", () => ({
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  apiPost: vi.fn(),
  apiDelete: vi.fn(),
}));

const mockedApiGet = vi.mocked(apiGet);
const mockedApiDelete = vi.mocked(apiDelete);
const mockedApiPatch = vi.mocked(apiPatch);
const mockedApiPost = vi.mocked(apiPost);

const completeProfile: SchoolProfileSettings = {
  schoolName: "Al Noor School",
  shortName: "ANS",
  timezone: "Africa/Cairo",
  addressLine: "1 School Street",
  formattedAddress: "1 School Street, Cairo, Egypt",
  city: "Cairo",
  country: "Egypt",
  footerSignature: "Al Noor School",
  logoUrl: "data:image/png;base64,logo",
  latitude: 30.0444,
  longitude: 31.2357,
  mapPlaceLabel: "Al Noor School",
};

describe("calculateBrandingProfileCompleteness", () => {
  beforeEach(() => {
    mockedApiGet.mockReset();
    mockedApiDelete.mockReset();
    mockedApiPatch.mockReset();
    mockedApiPost.mockReset();
  });

  it("requires the full approved branding profile for 100 percent", () => {
    expect(calculateBrandingProfileCompleteness(completeProfile)).toBe(100);
    expect(
      calculateBrandingProfileCompleteness({
        ...completeProfile,
        latitude: null,
      }),
    ).toBeLessThan(100);
    expect(
      calculateBrandingProfileCompleteness({
        ...completeProfile,
        longitude: null,
      }),
    ).toBeLessThan(100);
  });

  it("shares concurrent branding profile requests", async () => {
    let resolveProfile: (profile: SchoolProfileSettings) => void = () => undefined;
    mockedApiGet.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveProfile = resolve;
      }),
    );

    const firstRequest = fetchBrandingProfile({ force: true });
    const secondRequest = fetchBrandingProfile({ force: true });

    expect(mockedApiGet).toHaveBeenCalledTimes(1);

    resolveProfile(completeProfile);

    await expect(firstRequest).resolves.toEqual(completeProfile);
    await expect(secondRequest).resolves.toEqual(completeProfile);
  });

  it("keeps the managed logo URL out of branding updates", async () => {
    mockedApiPatch.mockResolvedValue(completeProfile);

    await updateBrandingProfile(completeProfile);

    expect(mockedApiPatch).toHaveBeenCalledWith(
      "/settings/branding",
      expect.not.objectContaining({ logoUrl: expect.anything() }),
    );
  });

  it("uploads the logo through the branding endpoint and returns its profile", async () => {
    mockedApiPost.mockResolvedValue(completeProfile);
    const file = new File(["logo"], "logo.png", { type: "image/png" });

    await expect(uploadBrandingLogo(file)).resolves.toEqual(completeProfile);

    expect(mockedApiPost).toHaveBeenCalledWith(
      "/settings/branding/logo",
      expect.any(FormData),
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    expect((mockedApiPost.mock.calls[0][1] as FormData).get("file")).toBe(file);
  });

  it("removes the managed logo through the branding endpoint", async () => {
    mockedApiDelete.mockResolvedValue(undefined);

    await deleteBrandingLogo();

    expect(mockedApiDelete).toHaveBeenCalledWith("/settings/branding/logo");
  });
});
