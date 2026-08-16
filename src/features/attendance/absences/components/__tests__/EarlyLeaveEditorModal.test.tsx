import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import EarlyLeaveEditorModal from "../EarlyLeaveEditorModal";

vi.mock("next-intl", () => ({
  useLocale: () => "ar",
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/components/ui/modal/Modal", () => ({
  default: ({
    children,
    showCloseButton,
    closeOnOverlayClick,
  }: {
    children: React.ReactNode;
    showCloseButton?: boolean;
    closeOnOverlayClick?: boolean;
  }) => (
    <div
      data-testid="modal"
      data-show-close-button={String(showCloseButton)}
      data-close-on-overlay-click={String(closeOnOverlayClick)}
    >
      {children}
    </div>
  ),
}));

vi.mock("@/components/ui/button/Button", () => ({
  default: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
}));

vi.mock("@/components/ui/input/Input", () => ({
  default: ({ label }: { label?: string }) => <input aria-label={label} />,
}));

describe("EarlyLeaveEditorModal", () => {
  it("uses only its own header and footer chrome", () => {
    render(
      <EarlyLeaveEditorModal
        isOpen
        onClose={vi.fn()}
        onSave={vi.fn().mockResolvedValue(undefined)}
        isReadOnly={false}
      />,
    );

    const modal = screen.getByTestId("modal");
    expect(modal).toHaveAttribute("data-show-close-button", "false");
    expect(modal).toHaveAttribute("data-close-on-overlay-click", "false");
  });
});
