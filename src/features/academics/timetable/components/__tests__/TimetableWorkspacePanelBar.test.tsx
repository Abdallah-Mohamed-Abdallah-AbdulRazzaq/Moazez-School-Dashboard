import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import TimetableWorkspacePanelBar from "@/features/academics/timetable/components/TimetableWorkspacePanelBar";

describe("TimetableWorkspacePanelBar", () => {
  it("keeps collapsed panel controls in one bar and toggles them independently", async () => {
    const user = userEvent.setup();
    render(<PanelBarHarness />);

    await user.click(screen.getByRole("button", { name: /Academic filters/ }));

    expect(screen.queryByText("Filter controls")).not.toBeInTheDocument();
    expect(screen.getByText("Progress controls")).toBeInTheDocument();
    expect(screen.getByText("Secondary · Grade 1")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Academic filters/ }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.getByRole("button", { name: /Creation progress/ }),
    ).toHaveAttribute("aria-expanded", "true");
  });
});

function PanelBarHarness() {
  const [filtersExpanded, setFiltersExpanded] = useState(true);
  const [progressExpanded, setProgressExpanded] = useState(true);
  return (
    <>
      <TimetableWorkspacePanelBar
        label="Timetable panels"
        panels={[
          {
            id: "academic-filters",
            title: "Academic filters",
            summary: "Secondary · Grade 1",
            expanded: filtersExpanded,
            onExpandedChange: setFiltersExpanded,
          },
          {
            id: "creation-progress",
            title: "Creation progress",
            expanded: progressExpanded,
            onExpandedChange: setProgressExpanded,
          },
        ]}
      />
      {filtersExpanded && <p id="academic-filters">Filter controls</p>}
      {progressExpanded && <p id="creation-progress">Progress controls</p>}
    </>
  );
}
