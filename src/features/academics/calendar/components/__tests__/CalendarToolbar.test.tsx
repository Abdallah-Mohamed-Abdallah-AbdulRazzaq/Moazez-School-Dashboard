import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CalendarToolbar from "../CalendarToolbar";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/components/ui/input/DatePicker", () => ({
  default: ({ onChange }: { onChange: (date: Date | null) => void }) => (
    <button type="button" onClick={() => onChange(new Date(2025, 0, 15))}>
      choose-date
    </button>
  ),
}));

vi.mock("@/components/ui/toast/Toast", () => ({
  useToast: () => ({ showWarning: vi.fn() }),
}));

vi.mock("@/features/academics/academic-structure-tree/services/structureService", () => ({
  fetchStructureTree: vi.fn(),
}));

describe("CalendarToolbar", () => {
  it("allows navigating to any selected date", () => {
    const onDateChange = vi.fn();

    render(
      <CalendarToolbar
        currentDate={new Date(2024, 5, 15)}
        onDateChange={onDateChange}
        typeFilters={["HOLIDAY", "EXAM", "ACTIVITY", "OTHER"]}
        onTypeFiltersChange={vi.fn()}
        scopeFilter="ALL"
        onScopeFilterChange={vi.fn()}
        onAddEvent={vi.fn()}
        isReadOnly={false}
        view="month"
        onViewChange={vi.fn()}
        displayMode="comfortable"
        onDisplayModeChange={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "choose-date" }));

    expect(onDateChange).toHaveBeenCalledWith(new Date(2025, 0, 15));
  });
});
