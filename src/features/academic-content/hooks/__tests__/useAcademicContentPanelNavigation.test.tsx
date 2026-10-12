import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useAcademicContentPanelNavigation } from "../useAcademicContentPanelNavigation";

function EditorTabs() {
  const [dirty, setDirty] = useState(false);
  const { activePanel, requestPanelChange, navigationDialog } =
    useAcademicContentPanelNavigation<"details" | "targets">("details", dirty);
  return (
    <>
      <button onClick={() => requestPanelChange("details")}>Details</button>
      <button onClick={() => requestPanelChange("targets")}>Targets</button>
      {activePanel === "details" ? (
        <section aria-label="Details panel">
          <input aria-label="Title" onChange={() => setDirty(true)} />
          <button onClick={() => setDirty(false)}>Save</button>
        </section>
      ) : <section aria-label="Targets panel" />}
      {navigationDialog}
    </>
  );
}

describe("academic content tab navigation with unsaved edits", () => {
  it.each(["Stay on this tab", "Escape"])(
    "keeps the form and its unsaved edits when dismissed using %s",
    (dismissal) => {
      render(<EditorTabs />);
      fireEvent.change(screen.getByRole("textbox", { name: "Title" }), {
        target: { value: "Unsaved title" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Targets" }));
      expect(screen.getByRole("dialog", { name: "Unsaved changes" })).toBeVisible();
      expect(screen.queryByRole("region", { name: "Targets panel" })).not.toBeInTheDocument();
      if (dismissal === "Escape") fireEvent.keyDown(document, { key: "Escape" });
      else fireEvent.click(screen.getByRole("button", { name: dismissal }));
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(screen.getByRole("textbox", { name: "Title" })).toHaveValue("Unsaved title");
      fireEvent.click(screen.getByRole("button", { name: "Targets" }));
      expect(screen.getByRole("dialog", { name: "Unsaved changes" })).toBeVisible();
    },
  );

  it("switches to the requested tab only after confirming unsaved changes", () => {
    render(<EditorTabs />);
    fireEvent.change(screen.getByRole("textbox", { name: "Title" }), {
      target: { value: "Unsaved title" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Details" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Targets" }));
    fireEvent.click(screen.getByRole("button", { name: "Leave without saving" }));
    expect(screen.getByRole("region", { name: "Targets panel" })).toBeVisible();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it.each([false, true])("switches without prompting after edits are saved: %s", (editFirst) => {
    render(<EditorTabs />);
    if (editFirst) {
      fireEvent.change(screen.getByRole("textbox", { name: "Title" }), {
        target: { value: "Saved title" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Save" }));
    }
    fireEvent.click(screen.getByRole("button", { name: "Targets" }));
    expect(screen.getByRole("region", { name: "Targets panel" })).toBeVisible();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
