import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { LessonPlanItem } from "../../services/lessonPlansService";
import LessonPlanItemCard from "../LessonPlanItemCard";

const item: LessonPlanItem = {
  id: "item-1",
  planId: "plan-1",
  lessonId: "lesson-1",
  unitId: "unit-1",
  unitTitle: "Backend unit title",
  title: "Backend item title",
  lessonTitle: "Backend lesson title",
  status: "DONE",
  rawStatus: "done",
  order: 0,
  plannedDate: "2026-09-02",
  periodLabel: "Period 2",
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
};

describe("lesson plan item card", () => {
  it("renders backend item data when the curriculum lesson is unavailable", () => {
    render(
      <LessonPlanItemCard
        item={item}
        onDragStart={vi.fn()}
        onDragEnd={vi.fn()}
        onStatusChange={vi.fn()}
        onEditItem={vi.fn()}
        onRemove={vi.fn()}
        isReadOnly
        onReorder={vi.fn()}
        disableMoveUp
        disableMoveDown
      />,
    );

    expect(screen.getByText("Backend item title")).toBeInTheDocument();
    expect(screen.getByText(/2026-09-02/)).toBeInTheDocument();
    expect(screen.getByText(/Period 2/)).toBeInTheDocument();
  });

  it("hides backend-invalid transitions for a completed item", async () => {
    const user = userEvent.setup();
    const onEditItem = vi.fn();
    render(
      <LessonPlanItemCard
        item={item}
        onDragStart={vi.fn()}
        onDragEnd={vi.fn()}
        onStatusChange={vi.fn()}
        onEditItem={onEditItem}
        onRemove={vi.fn()}
        isReadOnly={false}
        onReorder={vi.fn()}
        disableMoveUp
        disableMoveDown
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "actions.lessonActions" }),
    );
    expect(screen.queryByText("actions.editNotes")).not.toBeInTheDocument();
    await user.click(screen.getByText("actions.editItem"));
    expect(onEditItem).toHaveBeenCalledWith("item-1");
    expect(screen.queryByText("actions.markInProgress")).not.toBeInTheDocument();
    expect(screen.queryByText("actions.markDone")).not.toBeInTheDocument();
    expect(screen.queryByText("actions.skip")).not.toBeInTheDocument();
    expect(screen.queryByText("actions.cancel")).not.toBeInTheDocument();
  });

  it("renders rescheduled as a terminal display-only status", async () => {
    const user = userEvent.setup();
    render(
      <LessonPlanItemCard
        item={{ ...item, status: "RESCHEDULED", rawStatus: "rescheduled" }}
        onDragStart={vi.fn()}
        onDragEnd={vi.fn()}
        onStatusChange={vi.fn()}
        onEditItem={vi.fn()}
        onRemove={vi.fn()}
        isReadOnly={false}
        onReorder={vi.fn()}
        disableMoveUp
        disableMoveDown
      />,
    );

    expect(screen.getByText("status.RESCHEDULED")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "actions.lessonActions" }),
    );
    expect(screen.queryByText("actions.markInProgress")).not.toBeInTheDocument();
    expect(screen.queryByText("actions.markDone")).not.toBeInTheDocument();
    expect(screen.queryByText("actions.skip")).not.toBeInTheDocument();
    expect(screen.queryByText("actions.cancel")).not.toBeInTheDocument();
  });
});
