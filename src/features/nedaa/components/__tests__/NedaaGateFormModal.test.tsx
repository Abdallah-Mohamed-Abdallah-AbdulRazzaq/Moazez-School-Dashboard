import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import NedaaGateFormModal from "../NedaaGateFormModal";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/components/ui/toast/Toast", () => ({
  useToast: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
  }),
}));

vi.mock("@/features/nedaa/services/dismissalApiService", () => ({
  updateDismissalGate: vi.fn(),
}));

vi.mock("@/components/ui/google-location-picker", () => ({
  GoogleLocationPicker: ({
    onChange,
    onValidityChange,
  }: {
    onChange: (value: {
      latitude: number;
      longitude: number;
      label: string;
      formattedAddress: string;
    }) => void;
    onValidityChange: (valid: boolean) => void;
  }) => (
    <div>
      <button
        type="button"
        onClick={() =>
          onChange({
            latitude: 24.7136,
            longitude: 46.6753,
            label: "North Gate",
            formattedAddress: "Riyadh",
          })
        }
      >
        select-test-location
      </button>
      <button type="button" onClick={() => onValidityChange(false)}>
        invalidate-test-location
      </button>
    </div>
  ),
}));

function renderModal(onSubmit = vi.fn()) {
  render(
    <NedaaGateFormModal
      isOpen
      mode="create"
      existingGateIds={[]}
      onClose={vi.fn()}
      onSubmit={onSubmit}
    />,
  );
  return onSubmit;
}

describe("NedaaGateFormModal location", () => {
  it("submits coordinates selected in the location picker", async () => {
    const user = userEvent.setup();
    const onSubmit = renderModal();
    await user.type(
      screen.getByLabelText("settings.gate_form.name_en"),
      "North Gate",
    );
    await user.click(
      screen.getByRole("button", { name: "select-test-location" }),
    );
    await user.click(
      screen.getByRole("button", {
        name: "settings.gate_form.create_action",
      }),
    );

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ latitude: 24.7136, longitude: 46.6753 }),
    );
  });

  it("blocks submission while coordinates are invalid", async () => {
    const user = userEvent.setup();
    renderModal();
    await user.type(
      screen.getByLabelText("settings.gate_form.name_en"),
      "North Gate",
    );
    await user.click(
      screen.getByRole("button", { name: "invalidate-test-location" }),
    );

    expect(
      screen.getByRole("button", {
        name: "settings.gate_form.create_action",
      }),
    ).toBeDisabled();
  });

  it("allows adding and removing waiting zones locally in create mode", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <NedaaGateFormModal
        isOpen
        mode="create"
        existingGateIds={[]}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    expect(
      screen.getByText("settings.gate_form.no_waiting_zones"),
    ).toBeInTheDocument();

    const input = screen.getByPlaceholderText(
      "settings.gate_form.waiting_zones_placeholder",
    );
    await user.type(input, "Zone A");
    await user.click(screen.getByRole("button", { name: "add" }));

    expect(
      screen.queryByText("settings.gate_form.no_waiting_zones"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Zone A")).toBeInTheDocument();

    // Add another one
    await user.type(input, "Zone B");
    await user.click(screen.getByRole("button", { name: "add" }));
    expect(screen.getByText("Zone B")).toBeInTheDocument();

    // Remove Zone A
    await user.click(screen.getByRole("button", { name: "Remove Zone A" }));
    expect(screen.queryByText("Zone A")).not.toBeInTheDocument();
    expect(screen.getByText("Zone B")).toBeInTheDocument();

    // Submit form
    await user.type(
      screen.getByLabelText("settings.gate_form.name_en"),
      "North Gate",
    );
    await user.click(
      screen.getByRole("button", {
        name: "settings.gate_form.create_action",
      }),
    );

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        waitingZones: ["Zone B"],
      }),
    );
  });

  it("generates the gate ID from an Arabic name successfully", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <NedaaGateFormModal
        isOpen
        mode="create"
        existingGateIds={[]}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    await user.type(
      screen.getByLabelText("settings.gate_form.name_en"),
      "بوابة الشمال",
    );

    const idInput = screen.getByLabelText(
      "settings.gate_form.generated_id",
    ) as HTMLInputElement;
    expect(idInput.value).toBe("بوابة-الشمال");

    await user.click(
      screen.getByRole("button", {
        name: "settings.gate_form.create_action",
      }),
    );

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "بوابة-الشمال",
        name: "بوابة الشمال",
      }),
    );
  });
});

