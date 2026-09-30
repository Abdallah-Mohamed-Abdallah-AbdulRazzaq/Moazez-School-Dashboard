import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AcademicContentDetail } from "../../types/contracts";
import { AcademicContentEditorView } from "../AcademicContentEditorPage";

function detail(status: AcademicContentDetail["status"] = "DRAFT"): AcademicContentDetail {
  return {
    id: "content-1",
    academicYearId: "year-1",
    termId: "term-1",
    type: "GENERAL_RESOURCE",
    audience: "INTERNAL_STAFF",
    title: "Reference pack",
    description: "Useful references",
    status,
    archivedAt: status === "ARCHIVED" ? "2026-09-29T08:00:00.000Z" : null,
    createdAt: "2026-09-29T08:00:00.000Z",
    updatedAt: "2026-09-29T08:00:00.000Z",
    targets: [],
    assets: [],
    links: [],
    tags: [],
    details: null,
  };
}

function editorState(
  status: AcademicContentDetail["status"] = "DRAFT",
  metadataDirty = false,
) {
  return {
    content: detail(status),
    readiness: { canAdvance: true, blockingReasons: [] },
    isLoading: false,
    isReadOnly: status === "ARCHIVED",
    error: null,
    sections: {
      metadata: { dirty: metadataDirty, saving: false, error: null },
      targets: { dirty: false, saving: false, error: null },
      details: { dirty: false, saving: false, error: null },
      links: { dirty: false, saving: false, error: null },
      tags: { dirty: false, saving: false, error: null },
      files: { dirty: false, saving: false, error: null },
    },
    hasUnsavedChanges: false,
    markSectionDirty: vi.fn(),
    applyContentBase: vi.fn(),
    saveMetadata: vi.fn(async () => true),
    saveTargets: vi.fn(async () => true),
    saveLinks: vi.fn(async () => true),
    saveTags: vi.fn(async () => true),
    savePreparationDetails: vi.fn(async () => true),
    saveWeeklyPlanDetails: vi.fn(async () => true),
    saveGuardianNoteDetails: vi.fn(async () => true),
    saveSubjectResourceDetails: vi.fn(async () => true),
    saveOnlineSessionDetails: vi.fn(async () => true),
    reload: vi.fn(),
  } as const;
}

describe("AcademicContentEditorPage", () => {
  it("shows immutable context and saves metadata explicitly", async () => {
    const editor = editorState("DRAFT", true);
    render(<AcademicContentEditorView editor={editor} canManage />);

    expect(screen.getByText("General resource")).toBeInTheDocument();
    expect(screen.getByText("year-1")).toBeInTheDocument();
    expect(screen.getByText("term-1")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Updated title" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save basic information" }));

    expect(editor.markSectionDirty).toHaveBeenCalledWith("metadata", true);
    expect(editor.saveMetadata).toHaveBeenCalledWith({
      title: "Updated title",
      description: "Useful references",
      audience: "INTERNAL_STAFF",
    });
  });

  it("renders archived content as read-only", () => {
    render(<AcademicContentEditorView editor={editorState("ARCHIVED")} canManage />);

    expect(screen.getByRole("status")).toHaveTextContent("Archived content is read-only");
    expect(screen.getByLabelText("Title")).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Save basic information" })).not.toBeInTheDocument();
  });

  it("uses text and aria-current to identify the active responsive section", () => {
    render(<AcademicContentEditorView editor={editorState()} canManage />);

    const basicInformationTabs = screen.getAllByRole("button", {
      name: "Basic information",
    });
    expect(basicInformationTabs.some((tab) => tab.getAttribute("aria-current") === "true")).toBe(true);
  });
});
