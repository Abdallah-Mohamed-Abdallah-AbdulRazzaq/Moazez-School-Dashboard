import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SetupGuide } from "../components/SetupGuide";
import type { SetupEvaluation, SetupStepId } from "../types";

const stepIds: SetupStepId[] = ["organization", "academicContext", "structure", "subjects", "rooms"];

const copy = {
  title: "Quick school setup",
  progressLabel: "Setup progress",
  progressText: (completed: number, total: number, percent: number) =>
    `${completed}/${total} complete (${percent}%)`,
  retry: "Retry",
  lockedPrefix: "Complete first",
  stepError: "Localized load failure",
  statuses: {
    complete: "Complete",
    available: "Available",
    locked: "Locked",
    loading: "Loading",
    error: "Needs attention",
  },
  steps: {
    organization: { title: "Organization", description: "Add school profile" },
    academicContext: { title: "Academic year", description: "Add year and terms" },
    structure: { title: "Structure", description: "Add stage, grade, section" },
    subjects: { title: "Subjects", description: "Add subjects and allocations" },
    rooms: { title: "Rooms", description: "Add rooms" },
  },
};

function makeEvaluation(): SetupEvaluation {
  return {
    completedCount: 1,
    totalCount: 5,
    progressPercent: 20,
    isComplete: false,
    steps: {
      organization: {
        id: "organization",
        status: "complete",
        isComplete: true,
        lockedBy: [],
      },
      academicContext: {
        id: "academicContext",
        status: "available",
        isComplete: false,
        lockedBy: [],
      },
      structure: {
        id: "structure",
        status: "error",
        isComplete: false,
        lockedBy: [],
        error: "Could not load structure",
      },
      subjects: {
        id: "subjects",
        status: "locked",
        isComplete: false,
        lockedBy: ["structure"],
      },
      rooms: {
        id: "rooms",
        status: "locked",
        isComplete: false,
        lockedBy: ["subjects"],
      },
    },
  };
}

describe("SetupGuide", () => {
  it("renders progress, selectable steps, status text, and selected panel content", () => {
    render(
      <SetupGuide
        copy={copy}
        evaluation={makeEvaluation()}
        selectedStepId="academicContext"
        onSelectStep={vi.fn()}
        onRetryStep={vi.fn()}
        stepContent={{
          organization: <p>Organization panel</p>,
          academicContext: <p>Academic panel</p>,
          structure: <p>Structure panel</p>,
          subjects: <p>Subjects panel</p>,
          rooms: <p>Rooms panel</p>,
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Quick school setup" })).toBeVisible();
    expect(screen.getByText("1/5 complete (20%)")).toBeVisible();
    expect(screen.getByRole("progressbar", { name: "Setup progress" })).toHaveAttribute("aria-valuenow", "20");
    expect(screen.getByRole("button", { name: /Organization.*Complete/s })).toBeVisible();
    expect(screen.getByRole("button", { name: /Structure.*Needs attention/s })).toBeVisible();
    expect(screen.getByText("Academic panel")).toBeVisible();
    expect(screen.queryByText("Rooms panel")).not.toBeInTheDocument();
  });

  it("remounts animated step content when the selected step changes", () => {
    const props = {
      copy,
      evaluation: makeEvaluation(),
      onSelectStep: vi.fn(),
      onRetryStep: vi.fn(),
      stepContent: Object.fromEntries(
        stepIds.map((id) => [id, <p key={id}>{id} panel</p>]),
      ) as never,
    };
    const { rerender } = render(
      <SetupGuide {...props} selectedStepId="academicContext" />,
    );
    const firstContent = screen.getByText("academicContext panel").parentElement;

    rerender(<SetupGuide {...props} selectedStepId="structure" />);

    const nextContent = screen.getByText("structure panel").parentElement;
    expect(nextContent).not.toBe(firstContent);
    expect(nextContent).toBeVisible();
  });

  it("uses buttons for keyboard-operable available and error steps", async () => {
    const user = userEvent.setup();
    const onSelectStep = vi.fn();

    render(
      <SetupGuide
        copy={copy}
        evaluation={makeEvaluation()}
        selectedStepId="academicContext"
        onSelectStep={onSelectStep}
        onRetryStep={vi.fn()}
        stepContent={Object.fromEntries(stepIds.map((id) => [id, <p key={id}>{id}</p>])) as never}
      />,
    );

    screen.getByRole("button", { name: /Structure.*Needs attention/s }).focus();
    await user.keyboard("{Enter}");

    expect(onSelectStep).toHaveBeenCalledWith("structure");
  });

  it("prevents locked steps from invoking selection and explains prerequisites", async () => {
    const user = userEvent.setup();
    const onSelectStep = vi.fn();

    render(
      <SetupGuide
        copy={copy}
        evaluation={makeEvaluation()}
        selectedStepId="academicContext"
        onSelectStep={onSelectStep}
        onRetryStep={vi.fn()}
        stepContent={Object.fromEntries(stepIds.map((id) => [id, <p key={id}>{id}</p>])) as never}
      />,
    );

    const lockedButton = screen.getByRole("button", { name: /Subjects.*Locked/s });
    expect(lockedButton).toHaveAttribute("aria-disabled", "true");
    expect(within(lockedButton).getByText("Complete first: Structure")).toBeVisible();

    await user.click(lockedButton);

    expect(onSelectStep).not.toHaveBeenCalled();
  });

  it("invokes scoped retry for an error step", async () => {
    const user = userEvent.setup();
    const onRetryStep = vi.fn();

    render(
      <SetupGuide
        copy={copy}
        evaluation={makeEvaluation()}
        selectedStepId="structure"
        onSelectStep={vi.fn()}
        onRetryStep={onRetryStep}
        stepContent={Object.fromEntries(stepIds.map((id) => [id, <p key={id}>{id}</p>])) as never}
      />,
    );

    expect(screen.getByText("Localized load failure")).toBeVisible();
    expect(screen.queryByText("Could not load structure")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(onRetryStep).toHaveBeenCalledWith("structure");
  });
});
