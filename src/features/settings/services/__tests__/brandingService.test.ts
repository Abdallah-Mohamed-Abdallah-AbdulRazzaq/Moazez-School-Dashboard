import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import {
  calculateBrandingProfileCompleteness,
  deleteBrandingLogo,
  fetchBrandingProfile,
  updateBrandingProfile,
  uploadBrandingLogo,
  getCachedBrandingProfile,
  setBrandingScope,
  BRANDING_UPDATED_EVENT,
} from "../brandingService";
import type { SchoolProfileSettings } from "../../types";
import type { MeResponse } from "@/types/user";

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

const schoolUser: MeResponse = {
  id: "admin-1", email: "admin@example.test", firstName: "QA", lastName: "Admin",
  userType: "SCHOOL_USER", status: "ACTIVE",
  activeMembership: {
    membershipId: "membership-1", organizationId: "organization-1", schoolId: "school-a",
    roleId: "admin-role", roleKey: "school_admin", permissions: [],
  },
};

const otherSchoolUser: MeResponse = {
  ...schoolUser,
  activeMembership: { ...schoolUser.activeMembership!, schoolId: "school-b" },
};

const otherProfile = { ...completeProfile, schoolName: "School B", logoUrl: "/school-b.png" };

describe("calculateBrandingProfileCompleteness", () => {
  beforeEach(() => {
    setBrandingScope(null);
    setBrandingScope(schoolUser);
    mockedApiGet.mockReset();
    mockedApiDelete.mockReset();
    mockedApiPatch.mockReset();
    mockedApiPost.mockReset();
  });

  afterEach(() => setBrandingScope(null));

  it("does not reuse branding after switching schools or signing out", async () => {
    mockedApiGet.mockResolvedValueOnce(completeProfile).mockResolvedValueOnce(otherProfile);
    await fetchBrandingProfile();
    expect(getCachedBrandingProfile()).toEqual(completeProfile);
    setBrandingScope(otherSchoolUser);
    expect(getCachedBrandingProfile()).toBeNull();
    await expect(fetchBrandingProfile()).resolves.toEqual(otherProfile);
    setBrandingScope(null);
    expect(getCachedBrandingProfile()).toBeNull();
    await expect(fetchBrandingProfile()).rejects.toThrow("active school session");
  });

  it("keeps the new school's pending request when an older read finishes", async () => {
    let finishOld!: (profile: SchoolProfileSettings) => void;
    let finishNew!: (profile: SchoolProfileSettings) => void;
    mockedApiGet.mockReturnValueOnce(new Promise(resolve => { finishOld = resolve; }));
    const oldRequest = fetchBrandingProfile().catch(error => error);
    setBrandingScope(otherSchoolUser);
    mockedApiGet.mockReturnValueOnce(new Promise(resolve => { finishNew = resolve; }));
    const newRequest = fetchBrandingProfile();
    finishOld(completeProfile);
    expect(await oldRequest).toBeInstanceOf(Error);
    expect(getCachedBrandingProfile()).toBeNull();
    const sharedRequest = fetchBrandingProfile();
    expect(mockedApiGet).toHaveBeenCalledTimes(2);
    finishNew(otherProfile);
    await expect(newRequest).resolves.toEqual(otherProfile);
    await expect(sharedRequest).resolves.toEqual(otherProfile);
  });

  it("rejects an earlier login's read even after returning to the same school", async () => {
    let finishOld!: (profile: SchoolProfileSettings) => void;
    mockedApiGet.mockReturnValueOnce(new Promise(resolve => { finishOld = resolve; }));
    const oldRequest = fetchBrandingProfile().catch(error => error);
    setBrandingScope(null);
    setBrandingScope(schoolUser);
    finishOld(completeProfile);
    expect(await oldRequest).toBeInstanceOf(Error);
    expect(getCachedBrandingProfile()).toBeNull();
  });

  it.each(["update", "upload", "delete"] as const)("ignores late %s results from a previous school", async operation => {
    let finishOld!: (profile: SchoolProfileSettings) => void;
    const oldResponse = new Promise<SchoolProfileSettings>(resolve => { finishOld = resolve; });
    mockedApiPatch.mockReturnValueOnce(oldResponse);
    mockedApiPost.mockReturnValueOnce(oldResponse);
    mockedApiDelete.mockReturnValueOnce(oldResponse);
    const oldRequest = (operation === "update" ? updateBrandingProfile(completeProfile)
      : operation === "upload" ? uploadBrandingLogo(new File(["logo"], "logo.png"))
      : deleteBrandingLogo()).catch(error => error);
    setBrandingScope(otherSchoolUser);
    mockedApiGet.mockResolvedValueOnce(otherProfile);
    await fetchBrandingProfile();
    const brandingListener = vi.fn();
    window.addEventListener(BRANDING_UPDATED_EVENT, brandingListener);
    try {
      finishOld(completeProfile);
      expect(await oldRequest).toBeInstanceOf(Error);
      expect(getCachedBrandingProfile()).toEqual(otherProfile);
      expect(brandingListener).not.toHaveBeenCalled();
    } finally {
      window.removeEventListener(BRANDING_UPDATED_EVENT, brandingListener);
    }
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
