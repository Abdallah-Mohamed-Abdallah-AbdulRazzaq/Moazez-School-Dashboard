import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import FilterBar from "../FilterBar";

describe("FilterBar", () => {
  it("describes classroom filters without offering an implicit editing-scope switch", () => {
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
    expect(screen.getByText("viewOnly")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "scopeConfiguration" }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("selectStage")).toBeInTheDocument();
    expect(screen.getByLabelText("selectGrade")).toBeDisabled();
  });
});
