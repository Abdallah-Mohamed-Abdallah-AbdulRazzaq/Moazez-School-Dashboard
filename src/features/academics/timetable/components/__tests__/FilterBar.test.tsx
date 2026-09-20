import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import FilterBar from "@/features/academics/timetable/components/FilterBar";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

describe("FilterBar", () => {
  it("shows Term as a visible scope option and selects it", async () => {
    const user = userEvent.setup();
    const onScopeChange = vi.fn();

    render(
      <FilterBar
        stages={[]}
        grades={[]}
        sections={[]}
        classrooms={[]}
        selectedStageId="stage-1"
        selectedGradeId=""
        selectedSectionId=""
        selectedClassroomId=""
        selectedScopeType="STAGE"
        onScopeChange={onScopeChange}
        onStageChange={vi.fn()}
        onGradeChange={vi.fn()}
        onSectionChange={vi.fn()}
        onClassroomChange={vi.fn()}
        locale="en"
      />,
    );

    await user.click(screen.getByLabelText("selectScope"));
    await user.click(screen.getByRole("button", { name: "scopeTerm" }));

    expect(onScopeChange).toHaveBeenCalledWith("TERM");
  });
});
