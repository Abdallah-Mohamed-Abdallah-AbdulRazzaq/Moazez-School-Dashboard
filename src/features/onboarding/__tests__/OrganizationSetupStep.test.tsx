import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { updateBrandingProfile } from "@/features/settings/services/brandingService";
import { OrganizationSetupStep } from "../components/steps/OrganizationSetupStep";

vi.mock("@/features/settings/components/SchoolLocationPickerModal", () => ({
  default: () => null,
}));

vi.mock("@/features/settings/services/brandingService", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/settings/services/brandingService")>();
  return {
    ...actual,
    updateBrandingProfile: vi.fn(),
  };
});

const profile = {
  schoolName: "Old School",
  shortName: "OS",
  timezone: "Africa/Cairo",
  addressLine: "Old address",
  formattedAddress: "Old formatted address",
  city: "Cairo",
  country: "Egypt",
  footerSignature: "Regards",
  logoUrl: "https://example.test/logo.png",
  latitude: 30,
  longitude: 31,
  mapPlaceLabel: "Old place",
};

const copy = {
  summary: "Complete the school profile used across the dashboard.",
  savedData: "Saved school branding",
  editBranding: "Edit branding",
  cancel: "Cancel",
  save: "Save profile",
  saving: "Saving",
  completeness: (percent: number) => `Branding completeness: ${percent}%`,
  noLogo: "No logo uploaded",
  noLocation: "No location selected",
  editor: {
    schoolName: "School name",
    shortName: "Short name",
    timezone: "Timezone",
    address: "Address",
    city: "City",
    country: "Country",
    footerSignature: "Footer signature",
    uploadLogo: "Upload logo",
    uploadHint: "PNG or JPG, up to 2 MB",
    pickFromMap: "Pick from map",
    clearLocation: "Clear location",
    selectedLocation: "Selected location",
    noLocation: "No location selected",
    locationStale: "Pick the school location again after editing the address.",
    coordinates: (lat: string, lng: string) => `${lat}, ${lng}`,
    logoUploadFailed: "Could not read the selected logo",
    validation: {
      schoolName: "School name is required",
      shortName: "Short name is required",
      timezone: "Timezone is required",
      addressLine: "Select a valid school location",
      city: "City is required",
      country: "Country is required",
      footerSignature: "Footer signature is required",
      logoUrl: "School logo is required",
    },
  },
};

describe("OrganizationSetupStep", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows saved branding data before editing", () => {
    render(<OrganizationSetupStep copy={copy} profile={profile} refreshStep={vi.fn()} />);

    expect(screen.getByRole("heading", { name: copy.savedData })).toBeVisible();
    expect(screen.getByText(copy.completeness(100))).toBeVisible();
    expect(screen.getByAltText(profile.schoolName)).toHaveAttribute("src", profile.logoUrl);
    expect(screen.getAllByText(profile.shortName).length).toBeGreaterThan(0);
    expect(screen.getByText(profile.footerSignature)).toBeVisible();
    expect(screen.getByText(profile.formattedAddress)).toBeVisible();
    expect(screen.getByText("30.00000, 31.00000")).toBeVisible();
  });

  it("opens the complete editor and returns to the saved summary on cancel", async () => {
    const user = userEvent.setup();

    render(<OrganizationSetupStep copy={copy} profile={profile} refreshStep={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: copy.editBranding }));

    expect(screen.getByLabelText(copy.editor.schoolName)).toHaveValue(profile.schoolName);
    expect(screen.getByLabelText(copy.editor.footerSignature)).toHaveValue(
      profile.footerSignature,
    );

    await user.click(screen.getByRole("button", { name: copy.cancel }));

    expect(screen.getByRole("heading", { name: copy.savedData })).toBeVisible();
  });

  it("saves all branding fields, refreshes setup status, and shows the updated summary", async () => {
    const user = userEvent.setup();
    const refreshStep = vi.fn();
    const savedProfile = { ...profile, schoolName: "New School", city: "Giza" };
    vi.mocked(updateBrandingProfile).mockResolvedValue(savedProfile);

    render(<OrganizationSetupStep copy={copy} profile={profile} refreshStep={refreshStep} />);

    await user.click(screen.getByRole("button", { name: copy.editBranding }));
    await user.clear(screen.getByRole("textbox", { name: copy.editor.schoolName }));
    await user.type(screen.getByRole("textbox", { name: copy.editor.schoolName }), "New School");
    await user.clear(screen.getByRole("textbox", { name: copy.editor.city }));
    await user.type(screen.getByRole("textbox", { name: copy.editor.city }), "Giza");
    await user.click(screen.getByRole("button", { name: copy.save }));

    expect(updateBrandingProfile).toHaveBeenCalledWith({
      ...profile,
      schoolName: "New School",
      city: "Giza",
    });
    await waitFor(() => expect(refreshStep).toHaveBeenCalledWith("organization"));
    expect(await screen.findByRole("heading", { name: copy.savedData })).toBeVisible();
    expect(screen.getAllByText("New School").length).toBeGreaterThan(0);
    expect(screen.getByText("Giza")).toBeVisible();
  });

  it("opens edit mode directly when no branding profile was loaded", () => {
    render(<OrganizationSetupStep copy={copy} profile={null} refreshStep={vi.fn()} />);

    expect(screen.getByText(copy.summary)).toBeVisible();
    expect(screen.getByLabelText(copy.editor.schoolName)).toHaveValue("");
    expect(screen.queryByRole("heading", { name: copy.savedData })).not.toBeInTheDocument();
  });
});
