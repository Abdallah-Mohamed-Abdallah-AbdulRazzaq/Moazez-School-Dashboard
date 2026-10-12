import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useAcademicContentPanelNavigation } from "../useAcademicContentPanelNavigation";
import type { AcademicContentEditorSection } from "../useAcademicContentEditor";

function EditorTabs({ dirtyTargets = false }: { dirtyTargets?: boolean }) {
  const clean = { dirty: false, saving: false, error: null };
  const [sections, setSections] = useState({
    metadata: clean, details: clean, tags: clean, links: clean, files: clean,
    targets: { ...clean, dirty: dirtyTargets },
  });
  const markSectionDirty = (section: AcademicContentEditorSection, dirty: boolean) => {
    setSections((current) => ({ ...current, [section]: { ...current[section], dirty } }));
  };
  const { activePanel, requestPanelChange, navigationDialog } =
    useAcademicContentPanelNavigation<"details" | "targets" | "readiness">("details", {
      content: { type: "GUARDIAN_WEEKLY_NOTE" }, sections, markSectionDirty,
    });
  return (
    <>
      <button onClick={() => requestPanelChange("details")}>Details</button>
      <button onClick={() => requestPanelChange("targets")}>Targets</button>
      <button onClick={() => requestPanelChange("readiness")}>Readiness</button>
      {activePanel === "details" ? (
        <section aria-label="Details panel">
          <input aria-label="Title" onChange={() => markSectionDirty("metadata", true)} />
          <button onClick={() => markSectionDirty("metadata", false)}>Save</button>
        </section>
      ) : <section aria-label={activePanel === "targets" ? "Targets panel" : "Readiness panel"} />}
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
    fireEvent.click(screen.getByRole("button", { name: "Details" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Targets" }));
    expect(screen.getByRole("region", { name: "Targets panel" })).toBeVisible();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Details" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Title" }), {
      target: { value: "New unsaved title" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Targets" }));
    expect(screen.getByRole("dialog", { name: "Unsaved changes" })).toBeVisible();
  });

  it("does not prompt on clean or read-only tabs because another tab is dirty", () => {
    render(<EditorTabs dirtyTargets />);
    fireEvent.click(screen.getByRole("button", { name: "Readiness" }));
    expect(screen.getByRole("region", { name: "Readiness panel" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Targets" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Details" }));
    expect(screen.getByRole("dialog", { name: "Unsaved changes" })).toBeVisible();
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
