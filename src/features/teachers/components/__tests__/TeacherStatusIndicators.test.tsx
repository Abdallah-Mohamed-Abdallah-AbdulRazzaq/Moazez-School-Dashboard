import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TeacherCredentialIndicator from "../TeacherCredentialIndicator";
import TeacherProfileCompleteness from "../TeacherProfileCompleteness";
import TeacherStatusBadge from "../TeacherStatusBadge";

describe("teacher status indicators", () => {
  it.each([
    ["ACTIVE", "Active"],
    ["TERMINATED", "Terminated"],
    ["TRANSFERRED", "Transferred"],
  ] as const)("renders the %s status distinctly", (status, label) => {
    render(<TeacherStatusBadge status={status} label={label} />);
    expect(screen.getByText(label)).toBeVisible();
  });

  it("shows credential and incomplete-profile states", () => {
    render(
      <>
        <TeacherCredentialIndicator
          credential={{ hasPassword: false, status: "missing", mustChangePassword: false, passwordProvisionedAt: null, passwordChangedAt: null, credentialVersion: 0 }}
          label="Credentials required"
        />
        <TeacherProfileCompleteness
          completeness={{ isComplete: false, missingFields: ["gender"] }}
          completeLabel="Complete"
          incompleteLabel="Incomplete"
        />
      </>,
    );
    expect(screen.getByText("Credentials required")).toBeVisible();
    expect(screen.getByText("Incomplete")).toBeVisible();
  });
});
