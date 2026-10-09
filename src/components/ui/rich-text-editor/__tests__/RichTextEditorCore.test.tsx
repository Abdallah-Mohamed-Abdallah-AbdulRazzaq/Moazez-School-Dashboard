import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RichTextEditorCore } from "../RichTextEditorCore";

vi.mock("@mdxeditor/editor", async () => {
  const { forwardRef, useImperativeHandle } = await import("react");
  return {
    BlockTypeSelect: () => null,
    ButtonWithTooltip: () => null,
    BoldItalicUnderlineToggles: () => null,
    CreateLink: () => null,
    ListsToggle: () => null,
    Separator: () => null,
    headingsPlugin: () => ({}),
    linkDialogPlugin: () => ({}),
    linkPlugin: () => ({}),
    listsPlugin: () => ({}),
    markdownShortcutPlugin: () => ({}),
    toolbarPlugin: () => ({}),
    MDXEditor: forwardRef<
      {
        getMarkdown: () => string;
        insertMarkdown: (markdown: string) => void;
        setMarkdown: (markdown: string) => void;
      },
      {
        markdown: string;
        onChange: (markdown: string, initialMarkdownNormalize: boolean) => void;
        readOnly: boolean;
        placeholder?: string;
      }
    >(function MockMarkdownEditor({ markdown, onChange, readOnly, placeholder }, ref) {
      useImperativeHandle(ref, () => ({
        getMarkdown: () => markdown,
        insertMarkdown: () => undefined,
        setMarkdown: () => undefined,
      }));

      return (
        <textarea
          role="textbox"
          value={markdown}
          readOnly={readOnly}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value, false)}
        />
      );
    }),
  };
});

describe("RichTextEditorCore", () => {
  it("keeps markdown changes inside the backend character limit", () => {
    const onChange = vi.fn();
    render(
      <RichTextEditorCore
        label="Teacher notes"
        value="Pair"
        maxLength={5}
        disabled={false}
        onChange={onChange}
      />,
    );

    const editor = screen.getByRole("textbox", { name: "Teacher notes" });
    fireEvent.change(editor, { target: { value: "Pairs" } });
    fireEvent.change(editor, { target: { value: "Groups" } });

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith("Pairs");
    expect(screen.getByText("4/5")).toBeVisible();
  });
});
