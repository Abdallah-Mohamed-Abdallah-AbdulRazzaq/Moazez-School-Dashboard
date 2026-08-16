import { BookOpen } from "lucide-react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AcademicModuleEmptyState from "../AcademicModuleEmptyState";

describe("AcademicModuleEmptyState", () => {
  it("renders the localized title, description, icon, and CTA", () => {
    const onAction = vi.fn();

    render(
      <AcademicModuleEmptyState
        icon={BookOpen}
        title="No subjects yet"
        description="Create subjects before assigning weekly hours."
        ctaLabel="Create subject"
        onCtaClick={onAction}
      />,
    );

    expect(screen.getByText("No subjects yet")).toBeInTheDocument();
    expect(
      screen.getByText("Create subjects before assigning weekly hours."),
    ).toBeInTheDocument();
    expect(screen.getByTestId("academic-empty-state-icon")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Create subject" }));

    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("omits the CTA when no action is provided", () => {
    render(
      <AcademicModuleEmptyState
        icon={BookOpen}
        title="No grades yet"
        description="Create grades before continuing."
      />,
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
