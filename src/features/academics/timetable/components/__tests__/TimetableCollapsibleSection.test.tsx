import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import TimetableCollapsibleSection from "@/features/academics/timetable/components/TimetableCollapsibleSection";

describe("TimetableCollapsibleSection", () => {
  it("collapses and restores its content independently", async () => {
    const user = userEvent.setup();
    render(<CollapsibleSectionHarness />);

    const collapseButton = screen.getByRole("button", {
      name: "Collapse: Academic filters",
    });
    expect(collapseButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Filter controls")).toBeInTheDocument();

    await user.click(collapseButton);

    expect(screen.queryByText("Filter controls")).not.toBeInTheDocument();
    expect(screen.getByText("Secondary · Grade 1")).toBeInTheDocument();
    expect(screen.getByText("Progress controls")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Expand: Academic filters" }),
    );

    expect(screen.getByText("Filter controls")).toBeInTheDocument();
  });
});

function CollapsibleSectionHarness() {
  const [filtersExpanded, setFiltersExpanded] = useState(true);
  const [progressExpanded, setProgressExpanded] = useState(true);
  return (
    <>
      <TimetableCollapsibleSection
        id="academic-filters"
        title="Academic filters"
        summary="Secondary · Grade 1"
        expanded={filtersExpanded}
        expandLabel="Expand"
        collapseLabel="Collapse"
        onExpandedChange={setFiltersExpanded}
      >
        <p>Filter controls</p>
      </TimetableCollapsibleSection>
      <TimetableCollapsibleSection
        id="creation-progress"
        title="Creation progress"
        expanded={progressExpanded}
        expandLabel="Expand"
        collapseLabel="Collapse"
        onExpandedChange={setProgressExpanded}
      >
        <p>Progress controls</p>
      </TimetableCollapsibleSection>
    </>
  );
}
