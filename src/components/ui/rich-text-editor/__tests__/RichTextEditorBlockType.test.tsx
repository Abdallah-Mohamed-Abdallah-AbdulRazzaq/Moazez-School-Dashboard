import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RichTextEditorCore } from "../RichTextEditorCore";

Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
  configurable: true,
  value: vi.fn(),
});
Object.defineProperties(HTMLElement.prototype, {
  hasPointerCapture: { configurable: true, value: () => false },
  releasePointerCapture: { configurable: true, value: vi.fn() },
  setPointerCapture: { configurable: true, value: vi.fn() },
});
Object.defineProperties(Range.prototype, {
  getBoundingClientRect: { configurable: true, value: () => new DOMRect() },
  getClientRects: { configurable: true, value: () => [] },
});

describe("RichTextEditor formatting tools", () => {
  it("converts a paragraph to a heading", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <RichTextEditorCore
        label="Description"
        value="Lesson overview"
        maxLength={4000}
        disabled={false}
        onChange={onChange}
      />,
    );

    await user.click(await screen.findByRole("textbox", { name: "Description" }));
    await user.click(screen.getByRole("combobox", { name: "Block type" }));
    await user.click(await screen.findByRole("option", { name: "Heading 2" }));

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith("## Lesson overview");
    });
    expect(screen.getByRole("heading", { level: 2, name: "Lesson overview" })).toBeVisible();
  });

  it("creates a link without requiring prior editor focus", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <RichTextEditorCore
        label="Description"
        value=""
        maxLength={4000}
        disabled={false}
        onChange={onChange}
      />,
    );

    await user.click(
      await screen.findByRole("button", { name: "Create link" }),
    );

    expect(await screen.findByRole("dialog", { name: "Create link" })).toBeVisible();
    await user.type(screen.getByRole("textbox", { name: "Link text" }), "OpenAI");
    await user.type(screen.getByRole("textbox", { name: /^URL/ }), "https://openai.com");
    await user.click(screen.getByRole("button", { name: "Insert link" }));

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith("[OpenAI](https://openai.com)");
    });
    expect(screen.queryByRole("dialog", { name: "Create link" })).not.toBeInTheDocument();
  });
});
