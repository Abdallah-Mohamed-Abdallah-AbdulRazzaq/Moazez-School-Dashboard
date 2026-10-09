import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RevisionDetailModal from "../RevisionDetailModal";

const api = vi.hoisted(() => ({ getAcademicContentRevision: vi.fn() }));
vi.mock("../../../services/academicContentApi", () => api);

function revision(overrides: Record<string, unknown> = {}) {
  return {
    id: "revision-1",
    revisionNumber: 1,
    snapshotContractVersion: 1,
    sourceStatus: "DRAFT",
    title: "Historical title",
    capturedAt: "2026-09-30T00:00:00.000Z",
    academicContentId: "content-1",
    academicYearId: "year-1",
    termId: "term-1",
    type: "GENERAL_RESOURCE",
    audience: "INTERNAL_STAFF",
    description: null,
    targets: [],
    assets: [
      {
        fileId: "file-1",
        sortOrder: 0,
        originalName: "historical.pdf",
        mimeType: "application/pdf",
        sizeBytes: "20",
      },
    ],
    links: [
      {
        id: "link-1",
        label: "Historical link",
        url: "https://example.com",
        sortOrder: 0,
      },
    ],
    tags: [{ id: "tag-1", value: "historical-tag", sortOrder: 0 }],
    details: null,
    ...overrides,
  };
}

describe("RevisionDetailModal", () => {
  beforeEach(() => api.getAcademicContentRevision.mockReset());

  it("renders an immutable V1 snapshot including historical collections", async () => {
    api.getAcademicContentRevision.mockResolvedValue(
      revision({
        targets: [
          {
            id: "target-1",
            scopeType: "GRADE",
            stageId: null,
            gradeId: "grade-1",
            sectionId: null,
            classroomId: null,
            subjectId: "subject-1",
            teacherSubjectAllocationId: null,
          },
        ],
      }),
    );
    render(
      <RevisionDetailModal
        contentId="content-1"
        revisionId="revision-1"
        isOpen
        onClose={vi.fn()}
      />,
    );

    expect(await screen.findByText("Historical title")).toBeInTheDocument();
    expect(screen.getByText(/Save format v1/)).toBeInTheDocument();
    expect(screen.getByText("historical.pdf")).toBeInTheDocument();
    expect(screen.getByText("Historical link")).toBeInTheDocument();
    expect(screen.getByText("historical-tag")).toBeInTheDocument();
    expect(
      screen.getByText("No additional details in this version."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Some scope names are currently unavailable. The original selections are still saved in this version.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Loading content scope names…"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("grade-1")).not.toBeInTheDocument();
    expect(screen.queryByText("subject-1")).not.toBeInTheDocument();
  });

  it("renders the V2 type detail returned by the revision endpoint", async () => {
    api.getAcademicContentRevision.mockResolvedValue(
      revision({
        id: "revision-2",
        snapshotContractVersion: 2,
        type: "GUARDIAN_WEEKLY_NOTE",
        details: {
          body: "Historical guardian note",
          priority: "IMPORTANT",
          requiresAcknowledgement: true,
        },
      }),
    );
    render(
      <RevisionDetailModal
        contentId="content-1"
        revisionId="revision-2"
        isOpen
        onClose={vi.fn()}
      />,
    );

    expect(await screen.findByText(/Save format v2/)).toBeInTheDocument();
    expect(screen.getByText(/Historical guardian note/)).toBeInTheDocument();
  });

  it("rejects a revision payload that does not match the requested id", async () => {
    api.getAcademicContentRevision.mockResolvedValue(
      revision({ id: "different-revision" }),
    );
    render(
      <RevisionDetailModal
        contentId="content-1"
        revisionId="revision-1"
        isOpen
        onClose={vi.fn()}
      />,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The requested version could not be displayed. Refresh the page and try again.",
    );
    expect(screen.queryByText("Historical title")).not.toBeInTheDocument();
  });
});
