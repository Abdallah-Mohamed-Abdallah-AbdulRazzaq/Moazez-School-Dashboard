import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import LessonPlansPageHeader from "../LessonPlansPageHeader";

const props = {
  scopeLabels: [],
  autoPlanDisabled: false,
  createPlanDisabled: false,
  exportDisabled: false,
  refreshing: false,
  onAutoPlan: vi.fn(),
  onCreatePlan: vi.fn(),
  onRefresh: vi.fn(),
  onExport: vi.fn(),
};

describe("LessonPlansPageHeader", () => {
  it("opens create plan from the standalone writable action", async () => {
    const onCreatePlan = vi.fn();
    const user = userEvent.setup();
    render(<LessonPlansPageHeader {...props} onCreatePlan={onCreatePlan} />);

    await user.click(screen.getByRole("button", { name: "actions.createPlan" }));
    expect(onCreatePlan).toHaveBeenCalledOnce();
  });

  it("disables create plan when the scope is not writable", () => {
    render(<LessonPlansPageHeader {...props} createPlanDisabled />);
    expect(screen.getByRole("button", { name: "actions.createPlan" })).toBeDisabled();
  });
});
