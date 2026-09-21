import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import Modal from "../../modal/Modal";
import DateTimePicker from "../DateTimePicker";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("DateTimePicker", () => {
  const getBoundingClientRect = vi.spyOn(
    HTMLElement.prototype,
    "getBoundingClientRect",
  );

  beforeAll(() => {
    getBoundingClientRect.mockReturnValue(
      DOMRect.fromRect({ x: 1, y: 1, width: 1, height: 1 }),
    );
  });

  afterAll(() => getBoundingClientRect.mockRestore());

  it("keeps the date-time panel above a modal overlay", async () => {
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
        <DateTimePicker label="Effective at" />
      </Modal>,
    );

    await user.click(screen.getByRole("button", { name: /choose date/i }));

    const dateTimePanel = document.querySelector(".MuiPickerPopper-root");
    expect(dateTimePanel).not.toBeNull();
    expect(
      Number(getComputedStyle(dateTimePanel as Element).zIndex),
    ).toBeGreaterThan(1400);
  });

  it("keeps the mobile date-time dialog above a modal overlay", async () => {
    const user = userEvent.setup();

    render(
      <Modal isOpen onClose={vi.fn()} title="Schedule">
        <DateTimePicker label="Effective at" />
      </Modal>,
    );

    await user.click(screen.getByRole("button", { name: /choose date/i }));

    const dateTimeDialog = document.querySelector(".MuiDialog-root");
    expect(dateTimeDialog).not.toBeNull();
    expect(
      Number(getComputedStyle(dateTimeDialog as Element).zIndex),
    ).toBeGreaterThan(1400);
  });
});
