import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useWeeklyPlanDetailDraft } from "../../../hooks/useWeeklyPlanDetailDraft";
import { emptyWeeklyPlanDetail } from "../../../model/weeklyPlanDetail";
import WeeklyPlanOrderedListPanel from "../WeeklyPlanOrderedListPanel";

function OrderedPanelHarness({ onSave }: { onSave: ReturnType<typeof vi.fn> }) {
  const controller = useWeeklyPlanDetailDraft({
    initial: emptyWeeklyPlanDetail("2026-10-05"),
    contentVersion: "content-1:v1",
    sectionState: { dirty: true, saving: false, error: null },
    termBounds: { startDate: "2026-09-01", endDate: "2026-12-31" },
    onDirty: vi.fn(),
    onSave,
  });
  return (
    <WeeklyPlanOrderedListPanel
      title="Topics"
      description="Ordered topics"
      saveLabel="Save topics"
      emptyItemError="Empty rows are not allowed"
      field="topics"
      controller={controller}
      sectionState={{ dirty: true, saving: false, error: null }}
      disabled={false}
    />
  );
}

describe("weekly plan authoring panels", () => {
  it("edits an ordered panel through the shared complete-detail controller", async () => {
    const onSave = vi.fn().mockResolvedValue(true);
    render(<OrderedPanelHarness onSave={onSave} />);

    fireEvent.click(screen.getByRole("button", { name: "Add topic" }));
    fireEvent.change(screen.getByLabelText("Topics 1"), {
      target: { value: "Planets" },
    });
    await act(async () =>
      fireEvent.click(screen.getByRole("button", { name: "Save topics" })),
    );

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          weekStartDate: "2026-10-05",
          weekEndDate: "2026-10-05",
          topics: ["Planets"],
          objectives: [],
          homeworkAssignmentIds: [],
          gradeAssessmentIds: [],
        }),
      ),
    );
  });
});
