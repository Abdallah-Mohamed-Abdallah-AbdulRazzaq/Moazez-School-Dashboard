import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import FilterBar from "@/features/academics/timetable/components/FilterBar";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

describe("FilterBar", () => {
  it("lets users explicitly switch configuration alongside academic filters", () => {
    const onConfigurationModeChange = vi.fn();
    const filterBar = (configurationMode: "term" | "scope") => (
      <FilterBar
        configurationMode={configurationMode}
        onConfigurationModeChange={onConfigurationModeChange}
        stages={[]}
        grades={[]}
        sections={[]}
        classrooms={[]}
        selectedStageId=""
        selectedGradeId=""
        selectedSectionId=""
        selectedClassroomId=""
        onStageChange={vi.fn()}
        onGradeChange={vi.fn()}
        onSectionChange={vi.fn()}
        onClassroomChange={vi.fn()}
        locale="en"
      />
    );
    const { rerender } = render(filterBar("scope"));

    expect(screen.getByRole("button", { name: "scopeConfiguration" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "termConfiguration" }));
    expect(onConfigurationModeChange).toHaveBeenLastCalledWith("term");
    rerender(filterBar("term"));
    expect(screen.getByRole("button", { name: "termConfiguration" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "scopeConfiguration" }));
    expect(onConfigurationModeChange).toHaveBeenLastCalledWith("scope");

    expect(screen.queryByLabelText("selectScope")).not.toBeInTheDocument();
    expect(screen.getByLabelText("selectStage")).toBeInTheDocument();
    expect(screen.getByLabelText("selectGrade")).toBeInTheDocument();
    expect(screen.getByLabelText("selectSection")).toBeInTheDocument();
    expect(screen.getByLabelText("selectClassroom")).toBeInTheDocument();
  });
});
