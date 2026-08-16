import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SettingsWorkflowErrorAlert from "../SettingsWorkflowErrorAlert";

describe("SettingsWorkflowErrorAlert", () => {
  it("presents an accessible teacher recovery path with support metadata", () => {
    render(
      <SettingsWorkflowErrorAlert
        error={{ kind: "teacher-directory", traceId: "trace-123" }}
      />,
    );

    expect(screen.getByRole("alert")).toBeVisible();
    expect(
      screen.getByRole("link", { name: /teacher-directory.action/ }),
    ).toHaveAttribute("href", "/en/teachers");
    expect(screen.getByText("trace-123")).toBeVisible();
  });
});
