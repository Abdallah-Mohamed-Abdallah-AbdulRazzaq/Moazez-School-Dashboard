import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AcademicContentDetail } from "../../../types/contracts";
import GuardianNoteHeader from "../GuardianNoteHeader";
import GuardianNoteSectionNav from "../GuardianNoteSectionNav";

function content(): Extract<
  AcademicContentDetail,
  { type: "GUARDIAN_WEEKLY_NOTE" }
> {
  return {
    id: "note-1",
    academicYearId: "year-1",
    termId: "term-1",
    type: "GUARDIAN_WEEKLY_NOTE",
    audience: "GUARDIANS",
    title: "Science fair reminder",
    description: null,
    status: "DRAFT",
    archivedAt: null,
    createdAt: "2026-10-05T08:00:00.000Z",
    updatedAt: "2026-10-05T09:00:00.000Z",
    latestPublicationId: null,
    publicationStatus: null,
    publishAt: null,
    visibleFrom: null,
    visibleUntil: null,
    targets: [],
    assets: [],
    links: [],
    tags: [],
    details: {
      body: "Bring the project materials.",
      priority: "IMPORTANT",
      requiresAcknowledgement: true,
    },
  };
}

describe("Guardian note detail chrome", () => {
  it("presents Guardian-specific contract values in the header", () => {
    render(
      <GuardianNoteHeader
        content={content()}
        locale="en"
        targets={[]}
      />,
    );

    expect(screen.getByRole("heading", { name: "Science fair reminder" })).toBeVisible();
    expect(screen.getByText("Important")).toBeVisible();
    expect(screen.getByText("Acknowledgement required")).toBeVisible();
    expect(screen.getByRole("link", { name: "Back to Guardian Notes" })).toHaveAttribute(
      "href",
      "/en/academic-content-hub/guardian-notes?year=year-1&term=term-1",
    );
  });

  it("keeps publication navigation contract-aware", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <GuardianNoteSectionNav
        activePanel="details"
        variant="mobile"
        showPublication={false}
        indicators={{}}
        onChange={onChange}
      />,
    );

    expect(screen.queryByRole("button", { name: "Publication" })).toBeNull();
    rerender(
      <GuardianNoteSectionNav
        activePanel="details"
        variant="mobile"
        showPublication
        indicators={{}}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Resources" }));
    expect(onChange).toHaveBeenCalledWith("resources");
  });
});
