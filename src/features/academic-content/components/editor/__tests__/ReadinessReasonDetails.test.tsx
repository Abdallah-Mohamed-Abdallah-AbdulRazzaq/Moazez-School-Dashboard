import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ReadinessReasonDetails from "../ReadinessReasonDetails";

describe("ReadinessReasonDetails", () => {
  it("localizes useful metadata without exposing identifiers or nested objects", () => {
    render(
      <ReadinessReasonDetails
        details={{
          missingCount: 2,
          fields: ["subjectId", "title"],
          retryable: false,
          emptyValue: null,
          targetId: "target-1",
          internal: { id: "secret" },
        }}
      />,
    );

    expect(screen.getByText("Missing information count")).toBeVisible();
    expect(screen.getByText("2")).toBeVisible();
    expect(screen.getByText("Subject and Title")).toBeVisible();
    expect(screen.getByText("No")).toBeVisible();
    expect(
      screen.queryByText(/subjectId|target-1|false/),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/secret/)).not.toBeInTheDocument();
  });

  it("renders nothing when no safe entries are available", () => {
    const { container } = render(
      <ReadinessReasonDetails details={{ internal: { id: "secret" } }} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
