import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import FilterBar from "@/features/academics/timetable/components/FilterBar";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

describe("FilterBar", () => {
  it("renders academic filters without a configuration scope selector", () => {
    render(
      <FilterBar
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
      />,
    );

    expect(screen.queryByLabelText("selectScope")).not.toBeInTheDocument();
    expect(screen.getByLabelText("selectStage")).toBeInTheDocument();
    expect(screen.getByLabelText("selectGrade")).toBeInTheDocument();
    expect(screen.getByLabelText("selectSection")).toBeInTheDocument();
    expect(screen.getByLabelText("selectClassroom")).toBeInTheDocument();
  });
});
