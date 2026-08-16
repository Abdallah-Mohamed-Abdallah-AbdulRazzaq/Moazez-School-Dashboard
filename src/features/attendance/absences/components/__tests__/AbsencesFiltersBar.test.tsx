import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AbsencesFiltersBar from "../AbsencesFiltersBar";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/features/attendance/policies/components/ScopePicker", () => ({
  default: ({
    onScopeTypeChange,
    onScopeIdsChange,
  }: {
    onScopeTypeChange: (scopeType: "STAGE") => void;
    onScopeIdsChange: (scopeIds: object) => void;
  }) => (
    <button
      type="button"
      onClick={() => {
        onScopeTypeChange("STAGE");
        onScopeIdsChange({});
      }}
    >
      Change scope
    </button>
  ),
}));

describe("AbsencesFiltersBar", () => {
  it("does not restore stale descendant IDs after changing scope type", () => {
    const onFiltersChange = vi.fn();

    render(
      <AbsencesFiltersBar
        filters={{
          scopeType: "GRADE",
          scopeIds: { stageId: "stage-1", gradeId: "grade-1" },
          status: "ALL",
          granularities: ["DAILY", "PERIOD"],
          onlyUnexcused: false,
          search: "",
        }}
        onFiltersChange={onFiltersChange}
        onClearFilters={vi.fn()}
        onExport={vi.fn()}
        isReadOnly={false}
        structureTree={null}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Change scope" }));

    expect(onFiltersChange).toHaveBeenLastCalledWith({ scopeIds: {} });
  });
});
