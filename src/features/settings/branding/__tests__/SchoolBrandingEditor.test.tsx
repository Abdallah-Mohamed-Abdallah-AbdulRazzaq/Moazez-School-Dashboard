import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  SchoolBrandingEditor,
  type SchoolBrandingFormCopy,
} from "../components/SchoolBrandingEditor";
import { useSchoolBrandingEditor } from "../hooks/useSchoolBrandingEditor";
import type { SchoolProfileSettings } from "../../types";

vi.mock("../../components/SchoolLocationPickerModal", () => ({
  default: () => null,
}));

const profile: SchoolProfileSettings = {
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

const copy: SchoolBrandingFormCopy = {
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
  locationStale: "Select the edited address on the map",
  coordinates: (lat, lng) => `${lat}, ${lng}`,
  logoUploadFailed: "Logo failed",
  validation: {},
};

function TestEditor() {
  const editor = useSchoolBrandingEditor({
    initialProfile: profile,
    copy,
    onSave: vi.fn(),
  });
  return <SchoolBrandingEditor copy={copy} editor={editor} />;
}

describe("SchoolBrandingEditor", () => {
  it("renders the complete saved branding profile", () => {
    render(<TestEditor />);

    expect(screen.getByLabelText(copy.schoolName)).toHaveValue(profile.schoolName);
    expect(screen.getByLabelText(copy.shortName)).toHaveValue(profile.shortName);
    expect(screen.getByLabelText(copy.timezone)).toHaveTextContent(profile.timezone);
    expect(screen.getByLabelText(copy.address)).toHaveValue(profile.addressLine);
    expect(screen.getByLabelText(copy.city)).toHaveValue(profile.city);
    expect(screen.getByLabelText(copy.country)).toHaveValue(profile.country);
    expect(screen.getByLabelText(copy.footerSignature)).toHaveValue(
      profile.footerSignature,
    );
    expect(screen.getByAltText(profile.schoolName)).toHaveAttribute(
      "src",
      profile.logoUrl,
    );
    expect(screen.getByText("30.04440, 31.23570")).toBeVisible();
  });

  it("allows editing fields and clearing the selected location", async () => {
    const user = userEvent.setup();
    render(<TestEditor />);

    await user.clear(screen.getByLabelText(copy.schoolName));
    await user.type(screen.getByLabelText(copy.schoolName), "Updated School");
    expect(screen.getByLabelText(copy.schoolName)).toHaveValue("Updated School");

    await user.click(screen.getByRole("button", { name: copy.clearLocation }));
    expect(screen.getByText(copy.noLocation)).toBeVisible();
  });
});
