import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RichTextContent from "../RichTextContent";

describe("RichTextContent", () => {
  it("renders supported formatting while removing unsafe markup", () => {
    const { container } = render(
      <RichTextContent value={'Read **carefully**, <u>practice</u>, and [open](https://example.com).<script>alert("unsafe")</script>'} />,
    );

    expect(screen.getByText("carefully").tagName).toBe("STRONG");
    expect(screen.getByText("practice").tagName).toBe("U");
    expect(screen.getByRole("link", { name: "open" })).toHaveAttribute(
      "rel",
      "noopener noreferrer",
    );
    expect(container.querySelector("script")).not.toBeInTheDocument();
    expect(screen.queryByText("unsafe", { exact: false })).not.toBeInTheDocument();
  });
});
