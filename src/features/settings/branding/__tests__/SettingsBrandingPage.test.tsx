import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SettingsBrandingPage from "../pages/SettingsBrandingPage";
import type { SchoolProfileSettings } from "../../types";

const mocks = vi.hoisted(() => ({
  fetchBrandingProfile: vi.fn(),
  updateBrandingProfile: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () =>
    (key: string, values?: Record<string, string>) =>
      values ? `${key}:${Object.values(values).join(",")}` : key,
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({ hasPermission: () => true }),
}));

vi.mock("@/hooks/useDirtyKey", () => ({
  useDirtyKey: () => ({
    markDirty: vi.fn(),
    clearDirty: vi.fn(),
    isDirty: false,
  }),
}));

vi.mock("@/components/ui/toast/Toast", () => ({
  useToast: () => ({ showSuccess: vi.fn(), showError: vi.fn() }),
}));

vi.mock("../../components/SettingsAccessGuard", () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("../../components/SettingsPageHeader", () => ({
  default: ({ title, actions }: { title: string; actions: React.ReactNode }) => (
    <header>
      <h1>{title}</h1>
      {actions}
    </header>
  ),
}));

vi.mock("../../components/SettingsSectionCard", () => ({
  default: ({ children }: { children: React.ReactNode }) => <section>{children}</section>,
}));

vi.mock("../../components/SchoolLocationPickerModal", () => ({
  default: () => null,
}));

vi.mock("../../shared/components/export/SettingsGlobalExportModal", () => ({
  default: () => null,
}));

vi.mock("../../services/brandingService", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../services/brandingService")>();
  return {
    ...actual,
    fetchBrandingProfile: mocks.fetchBrandingProfile,
    updateBrandingProfile: mocks.updateBrandingProfile,
  };
});

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

describe("SettingsBrandingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.fetchBrandingProfile.mockResolvedValue(profile);
  });

  it("loads and renders the complete saved branding profile", async () => {
    render(<SettingsBrandingPage />);

    await waitFor(() =>
      expect(screen.getByLabelText("school_name")).toHaveValue(profile.schoolName),
    );
    expect(screen.getByLabelText("short_name")).toHaveValue(profile.shortName);
    expect(screen.getByLabelText("address")).toHaveValue(profile.addressLine);
    expect(screen.getByLabelText("footer_signature")).toHaveValue(
      profile.footerSignature,
    );
    expect(screen.getByAltText(profile.schoolName)).toHaveAttribute(
      "src",
      profile.logoUrl,
    );
    expect(screen.getByText(/30\.04440.*31\.23570/)).toBeVisible();
    expect(mocks.fetchBrandingProfile).toHaveBeenCalledWith({ force: true });
  });
});
