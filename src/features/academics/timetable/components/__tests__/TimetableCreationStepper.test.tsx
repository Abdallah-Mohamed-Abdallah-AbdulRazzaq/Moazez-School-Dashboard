import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import TimetableCreationStepper from "@/features/academics/timetable/components/TimetableCreationStepper";
import type {
  TimetableCreationProgress,
  TimetableCreationStep,
} from "@/features/academics/timetable/services/timetableCreationProgress";

const copy = {
  navigationLabel: "Timetable creation progress",
  checking: "Checking progress",
  steps: {
    scope: "Select scope",
    configuration: "Configure timetable",
    periods: "Add periods",
    schedule: "Build schedule",
    validation: "Review and validate",
    publish: "Publish",
  },
  status: {
    complete: "Complete",
    current: "Current step",
    blocked: "Blocked",
    published: "Published",
  },
  prerequisites: {
    configureTimetable: "Configure the timetable first",
    addInstructionalPeriod: "Add an instructional period first",
    saveSchedule: "Save the schedule first",
    resolveReviewIssues: "Resolve validation issues and conflicts first",
    publicationNotReady: "This timetable is not ready to publish",
  },
};

describe("TimetableCreationStepper", () => {
  it("announces the current actionable step and invokes its action", async () => {
    const onAction = vi.fn();
    const user = userEvent.setup();

    render(
      <TimetableCreationStepper
        progress={progressWith(currentStep("validation"))}
        copy={copy}
        onAction={onAction}
      />,
    );

    const validationButton = screen.getByRole("button", {
      name: /review and validate/i,
    });
    expect(validationButton).toHaveAttribute("aria-current", "step");

    await user.click(validationButton);

    expect(onAction).toHaveBeenCalledWith("validation");
  });

  it("explains a blocked prerequisite without rendering an action button", () => {
    render(
      <TimetableCreationStepper
        progress={progressWith(blockedStep("publish", "saveSchedule"))}
        copy={copy}
        onAction={vi.fn()}
      />,
    );

    expect(screen.getByText("Save the schedule first")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^publish/i }),
    ).not.toBeInTheDocument();
  });

  it("shows a shared prerequisite only on the first blocked step", () => {
    render(
      <TimetableCreationStepper
        progress={{
          state: "ready",
          steps: [
            completeStep("scope"),
            completeStep("configuration"),
            currentStep("periods"),
            blockedStep("schedule", "addInstructionalPeriod"),
            blockedStep("validation", "addInstructionalPeriod"),
            blockedStep("publish", "addInstructionalPeriod"),
          ],
        }}
        copy={copy}
        onAction={vi.fn()}
      />,
    );

    expect(
      screen.getAllByText("Add an instructional period first"),
    ).toHaveLength(1);
  });

  it("shows the backend publication reason before the generic prerequisite", () => {
    render(
      <TimetableCreationStepper
        progress={progressWith({
          ...blockedStep("publish", "publicationNotReady"),
          prerequisiteMessage: "Add a second period",
        })}
        copy={copy}
        onAction={vi.fn()}
      />,
    );

    expect(screen.getByText("Add a second period")).toBeInTheDocument();
  });

  it("announces that progress is being checked", () => {
    render(
      <TimetableCreationStepper
        progress={{ state: "checking", steps: [] }}
        copy={copy}
        onAction={vi.fn()}
      />,
    );

    expect(screen.getByText("Checking progress")).toHaveAttribute(
      "aria-busy",
      "true",
    );
  });
});

function progressWith(replacement: TimetableCreationStep): TimetableCreationProgress {
  return {
    state: "ready",
    steps: [
      completeStep("scope"),
      completeStep("configuration"),
      completeStep("periods"),
      completeStep("schedule"),
      completeStep("validation"),
      completeStep("publish"),
    ].map((step) => (step.id === replacement.id ? replacement : step)),
  };
}

function completeStep(id: TimetableCreationStep["id"]): TimetableCreationStep {
  return { id, status: "complete", actionable: true };
}

function currentStep(id: TimetableCreationStep["id"]): TimetableCreationStep {
  return { id, status: "current", actionable: true };
}

function blockedStep(
  id: TimetableCreationStep["id"],
  prerequisiteKey: NonNullable<TimetableCreationStep["prerequisiteKey"]>,
): TimetableCreationStep {
  return { id, status: "blocked", actionable: false, prerequisiteKey };
}
