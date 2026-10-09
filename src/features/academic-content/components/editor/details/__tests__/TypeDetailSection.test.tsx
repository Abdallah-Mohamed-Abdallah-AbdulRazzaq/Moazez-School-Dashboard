import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AcademicContentDetail } from "../../../../types/contracts";
import TypeDetailSection from "../TypeDetailSection";

const handlers = {
  onDirty: vi.fn(),
  onSavePreparation: vi.fn(),
  onSaveWeeklyPlan: vi.fn(),
  onSaveGuardianNote: vi.fn(),
  onSaveSubjectResource: vi.fn(),
  onSaveOnlineSession: vi.fn(),
};

function generalResource(): AcademicContentDetail {
  return {
    id: "content-1",
    academicYearId: "year-1",
    termId: "term-1",
    type: "GENERAL_RESOURCE",
    audience: "INTERNAL_STAFF",
    title: "Pack",
    description: null,
    status: "DRAFT",
    archivedAt: null,
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
    targets: [],
    assets: [],
    links: [],
    tags: [],
    details: null,
  };
}

describe("TypeDetailSection", () => {
  it("renders no fake detail form for a general resource", () => {
    render(
      <TypeDetailSection
        content={generalResource()}
        disabled={false}
        sectionState={{ dirty: false, saving: false, error: null }}
        {...handlers}
      />,
    );

    expect(
      screen.getByText("Complete the resource information and scope,", {
        exact: false,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Save type details" }),
    ).not.toBeInTheDocument();
  });

  it("routes guardian notes without loading unrelated reference sources", () => {
    const loadOptions = vi.fn();
    const content = {
      ...generalResource(),
      type: "GUARDIAN_WEEKLY_NOTE" as const,
      audience: "GUARDIANS" as const,
      details: {
        body: "Note",
        priority: "NORMAL" as const,
        requiresAcknowledgement: false,
      },
    } satisfies AcademicContentDetail;
    render(
      <TypeDetailSection
        content={content}
        disabled={false}
        sectionState={{ dirty: false, saving: false, error: null }}
        loadOptions={loadOptions}
        {...handlers}
      />,
    );

    expect(screen.getByText("Guardian weekly note")).toBeInTheDocument();
    expect(loadOptions).not.toHaveBeenCalled();
  });
});
