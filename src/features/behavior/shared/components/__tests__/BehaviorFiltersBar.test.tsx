import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import BehaviorFiltersBar from "../BehaviorFiltersBar";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/components/ui/toast/Toast", () => ({
  useToast: () => ({ showError: vi.fn() }),
}));

describe("BehaviorFiltersBar", () => {
  it("offers cancelled as a record status filter", () => {
    render(
      <BehaviorFiltersBar
        filters={{ scopeType: "SCHOOL", scopeIds: {} }}
        onChange={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByLabelText("status"));
    expect(screen.getByRole("button", { name: "cancelled" })).toBeInTheDocument();
  });
});
