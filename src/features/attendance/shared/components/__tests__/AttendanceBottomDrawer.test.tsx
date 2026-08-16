import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AttendanceBottomDrawer from "../AttendanceBottomDrawer";

vi.mock("@mui/material", () => ({
  Drawer: ({ children, ModalProps }: { children: React.ReactNode; ModalProps?: { disableEnforceFocus?: boolean } }) => (
    <div data-disable-enforce-focus={String(ModalProps?.disableEnforceFocus)}>{children}</div>
  ),
}));

describe("AttendanceBottomDrawer", () => {
  it("releases focus enforcement while a nested preview is open", () => {
    render(
      <AttendanceBottomDrawer
        isOpen
        onClose={vi.fn()}
        disableEnforceFocus
      >
        <span>Details</span>
      </AttendanceBottomDrawer>,
    );

    expect(screen.getByText("Details").parentElement?.parentElement).toHaveAttribute(
      "data-disable-enforce-focus",
      "true",
    );
  });
});
