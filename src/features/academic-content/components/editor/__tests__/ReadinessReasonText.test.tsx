import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ReadinessReasonText from "../ReadinessReasonText";

describe("ReadinessReasonText", () => {
  it("localizes a supported backend readiness code", () => {
    render(
      <ReadinessReasonText
        reason={{
          code: "academic_content.readiness.read_only",
          message: "Academic content is read-only",
        }}
      />,
    );

    expect(screen.getByText("This content is read-only.")).toBeInTheDocument();
    expect(
      screen.queryByText("Academic content is read-only"),
    ).not.toBeInTheDocument();
  });

  it("shows a localized recovery hint for an unknown future code", () => {
    render(
      <ReadinessReasonText
        reason={{ code: "future.readiness.rule", message: "Future rule" }}
      />,
    );

    expect(
      screen.getByText(
        "Content readiness could not be confirmed. Refresh the data; contact support if the problem continues.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("Future rule")).not.toBeInTheDocument();
  });
});
