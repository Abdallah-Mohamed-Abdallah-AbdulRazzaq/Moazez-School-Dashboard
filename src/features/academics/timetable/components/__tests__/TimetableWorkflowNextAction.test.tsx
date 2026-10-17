import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import TimetableWorkflowNextAction from "../TimetableWorkflowNextAction";
import type { TimetableCreationProgress } from "../../services/timetableCreationProgress";

describe("TimetableWorkflowNextAction", () => {
  it.each([
    { dirty: true, label: "steps.save.action", action: "save" },
    { dirty: false, label: "steps.validation.action", action: "validation" },
  ])(
    "offers $action when publication still needs a prerequisite",
    async ({ dirty, label, action }) => {
      const onSave = vi.fn();
      const onAction = vi.fn();
      const progress: TimetableCreationProgress = {
        state: "ready",
        steps: [
          { id: "schedule", status: "complete", actionable: true },
          {
            id: "publish",
            status: "blocked",
            actionable: false,
            prerequisiteKey: "resolveReviewIssues",
          },
        ],
      };
      render(
        <TimetableWorkflowNextAction
          progress={progress}
          isDirty={dirty}
          busy={false}
          canSave
          onSave={onSave}
          onAction={onAction}
        />,
      );
      await userEvent.click(screen.getByRole("button", { name: label }));
      if (action === "save") {
        expect(onSave).toHaveBeenCalledOnce();
        expect(onAction).not.toHaveBeenCalled();
      } else {
        expect(onAction).toHaveBeenCalledWith("validation");
        expect(onSave).not.toHaveBeenCalled();
      }
    },
  );

  it("shows the published outcome without inviting a duplicate publication", () => {
    render(
      <TimetableWorkflowNextAction
        progress={{
          state: "ready",
          steps: [
            { id: "validation", status: "current", actionable: true },
            { id: "publish", status: "published", actionable: false },
          ],
        }}
        isDirty={false}
        busy={false}
        canSave={false}
        onSave={vi.fn()}
        onAction={vi.fn()}
      />,
    );
    expect(screen.getByText("publishedTitle")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
