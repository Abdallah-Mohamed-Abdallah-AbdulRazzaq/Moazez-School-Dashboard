import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AcademicContentLibraryItem } from "../../../types/contracts";
import GeneralResourceResults from "../GeneralResourceResults";

const resource: AcademicContentLibraryItem = {
  id: "resource-1",
  academicYearId: "year-1",
  termId: "term-1",
  type: "GENERAL_RESOURCE",
  audience: "INTERNAL_STAFF",
  title: "School assessment policy",
  description: "Guidance for assessment and moderation.",
  status: "PUBLISHED",
  archivedAt: null,
  createdAt: "2026-10-01T08:00:00.000Z",
  updatedAt: "2026-10-05T08:00:00.000Z",
  summary: null,
};

describe("general resources presentation", () => {
  it("renders only fields supplied by the general resource list contract", () => {
    render(
      <GeneralResourceResults
        items={[resource]}
        page={1}
        limit={10}
        total={1}
        search=""
        view="table"
        isLoading={false}
        error={null}
        hasFilters={false}
        onOpen={vi.fn()}
        onRetry={vi.fn()}
        onClearFilters={vi.fn()}
        onViewChange={vi.fn()}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />,
    );

    expect(
      screen.getAllByText("School assessment policy").length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Guidance for assessment and moderation.").length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("School staff").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Published").length).toBeGreaterThan(0);
  });
});
