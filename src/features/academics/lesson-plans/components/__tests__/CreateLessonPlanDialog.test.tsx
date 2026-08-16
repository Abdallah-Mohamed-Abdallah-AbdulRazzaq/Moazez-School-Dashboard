import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import CreateLessonPlanDialog from "../CreateLessonPlanDialog";

const weeks = [
  { weekIndex: 1, startDate: "2026-09-01", endDate: "2026-09-07", instructionalDays: [], holidayDays: [], lostTeachingDays: 0, hasHolidays: false, plannedItemsCount: 0 },
  { weekIndex: 2, startDate: "2026-09-08", endDate: "2026-09-14", instructionalDays: [], holidayDays: [], lostTeachingDays: 0, hasHolidays: false, plannedItemsCount: 0 },
];
const plans = [{ id: "plan-1", weekIndex: 1, status: "DRAFT" as const, items: [] }];

describe("CreateLessonPlanDialog", () => {
  it("renders backend weeks and disables a week with a non-archived plan", async () => {
    const user = userEvent.setup();
    render(<CreateLessonPlanDialog isOpen weeks={weeks} plans={plans as never} onClose={vi.fn()} onSubmit={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "createPlan.weekLabel" }));
    expect(screen.getByRole("button", { name: /2026-09-01.*createPlan.alreadyHasPlan/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /2026-09-08/ })).toBeEnabled();
  });

  it("requires a week and title before submitting", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<CreateLessonPlanDialog isOpen weeks={weeks} plans={[]} onClose={vi.fn()} onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: "createPlan.submit" }));
    expect(screen.getByText("createPlan.validation.weekRequired")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits the selected backend week with trimmed fields", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<CreateLessonPlanDialog isOpen weeks={weeks} plans={[]} onClose={vi.fn()} onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: "createPlan.weekLabel" }));
    await user.click(screen.getByRole("button", { name: /2026-09-08/ }));
    const [title, description] = screen.getAllByRole("textbox");
    await user.clear(title);
    await user.type(title, "  Custom plan  ");
    await user.type(description, "  Description  ");
    await user.click(screen.getByRole("button", { name: "createPlan.submit" }));

    expect(onSubmit).toHaveBeenCalledWith({
      title: "Custom plan",
      description: "Description",
      weekStartDate: "2026-09-08",
      weekEndDate: "2026-09-14",
    });
  });
});
