import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import LateEarlyFiltersBar from "../LateEarlyFiltersBar";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/components/ui/input/Input", () => ({
  default: ({ label, placeholder }: { label?: string; placeholder?: string }) => (
    <input aria-label={label} placeholder={placeholder} />
  ),
}));

vi.mock("@/components/ui/input/DatePicker", () => ({
  default: ({ label }: { label?: string }) => <input aria-label={label} />,
}));

vi.mock("@/components/ui/input/Select", () => ({
  default: ({ label }: { label?: string }) => <select aria-label={label} />,
}));

vi.mock("@/components/ui/button/Button", () => ({
  default: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
}));

vi.mock("@/features/attendance/policies/components/ScopePicker", () => ({
  default: () => <div aria-label="scope picker" />,
}));

describe("LateEarlyFiltersBar", () => {
  it("exposes labels for every filter control", () => {
    render(
      <LateEarlyFiltersBar
        filters={{
          search: "",
          dateFrom: undefined,
          dateTo: undefined,
          scopeType: "SCHOOL",
          scopeIds: {},
          type: "ALL",
          sessionStatus: "ALL",
          minutesMin: undefined,
          minutesMax: undefined,
          onlyViolations: false,
        }}
        stages={[]}
        grades={[]}
        sections={[]}
        classrooms={[]}
        onFiltersChange={vi.fn()}
        onResetFilters={vi.fn()}
        onOpenExport={vi.fn()}
      />,
    );

    for (const label of [
      "search",
      "dateFrom",
      "dateTo",
      "type",
      "sessionStatus",
      "minutesMin",
      "minutesMax",
    ]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
  });
});
