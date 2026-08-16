import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { NedaaSettings } from "@/features/nedaa/types/nedaa";
import NedaaSettingsView from "../NedaaSettingsView";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/components/ui/google-location-picker", () => ({
  GoogleLocationPicker: ({
    radiusMeters,
    onChange,
  }: {
    radiusMeters?: number;
    onChange: (value: {
      latitude: number;
      longitude: number;
      label: string;
      formattedAddress: string;
    }) => void;
  }) => (
    <button
      type="button"
      data-testid="google-location-picker"
      data-radius={radiusMeters}
      onClick={() =>
        onChange({
          latitude: 24.7136,
          longitude: 46.6753,
          label: "School",
          formattedAddress: "Riyadh",
        })
      }
    >
      select-test-location
    </button>
  ),
}));

vi.mock("@/features/nedaa/components/NedaaGateFormModal", () => ({
  default: () => null,
}));

const settings: NedaaSettings = {
  settings: {
    enabled: true,
    timezone: "Asia/Riyadh",
    schoolZone: {
      latitude: 24.7,
      longitude: 46.6,
      label: "Current school",
      source: "settings",
    },
    allowedRadiusMeters: 250,
    requestWindow: { startLocal: "12:00", endLocal: "15:00" },
    thresholds: { delayMinutes: 5, urgentMinutes: 15, expiryMinutes: 30 },
    policies: {
      requirePickupCode: true,
      allowDelegatePickup: true,
      allowParentCancelBeforeCalled: true,
    },
    defaultGate: null,
    configured: true,
    updatedAt: null,
  },
  gates: [],
};

function renderView(onChange = vi.fn()) {
  render(
    <NedaaSettingsView
      settings={settings}
      initialSettings={settings}
      isGateModalOpen={false}
      gateModalMode="create"
      onChange={onChange}
      onReset={vi.fn()}
      onSave={vi.fn()}
      onOpenExport={vi.fn()}
      onOpenCreateGate={vi.fn()}
      onOpenEditGate={vi.fn()}
      onCloseGateModal={vi.fn()}
      onSubmitGate={vi.fn()}
      onToggleGateActive={vi.fn()}
    />,
  );
  return onChange;
}

describe("NedaaSettingsView school location", () => {
  it("maps a selected location to the dismissal settings patch", async () => {
    const user = userEvent.setup();
    const onChange = renderView();

    await user.click(
      screen.getByRole("button", { name: "select-test-location" }),
    );

    expect(onChange).toHaveBeenCalledWith({
      schoolLatitude: 24.7136,
      schoolLongitude: 46.6753,
      schoolZoneLabel: "School",
    });
  });

  it("passes the configured allowed radius to the map", () => {
    renderView();
    expect(screen.getByTestId("google-location-picker")).toHaveAttribute(
      "data-radius",
      "250",
    );
  });

  it("updates the pickup-code policy when its switch is turned off", async () => {
    const user = userEvent.setup();
    const onChange = renderView();

    await user.click(
      screen.getByRole("switch", { name: /settings\.require_pickup_code/ }),
    );

    expect(onChange).toHaveBeenCalledWith({ requirePickupCode: false });
  });
});
