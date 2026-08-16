import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import Modal from "../../modal/Modal";
import DatePicker from "../DatePicker";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("DatePicker", () => {
  it("keeps the calendar above a modal overlay", async () => {
    // Regression: the modal layer was raised to 1400, hiding MUI's default 1300 popper.
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query: string) => ({
        matches: query.includes("pointer: fine"),
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );
    const user = userEvent.setup();

    render(
      <Modal isOpen onClose={vi.fn()} title="Schedule">
        <DatePicker label="Start date" />
      </Modal>,
    );

    await user.click(screen.getByRole("button", { name: /choose date/i }));

    const calendar = document.querySelector(".MuiPickerPopper-root");
    expect(calendar).not.toBeNull();
    expect(Number(getComputedStyle(calendar as Element).zIndex)).toBeGreaterThan(
      1400,
    );
  });
});
