import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RevisionHistoryPanel from "../RevisionHistoryPanel";

const api = vi.hoisted(() => ({
  getAcademicContentRevision: vi.fn(),
  listAcademicContentRevisions: vi.fn(),
}));
vi.mock("../../../services/academicContentApi", () => api);

const summary = {
  id: "revision-1",
  revisionNumber: 3,
  snapshotContractVersion: 2,
  sourceStatus: "DRAFT" as const,
  title: "Revision three",
  capturedAt: "2026-09-30T00:00:00.000Z",
};

describe("RevisionHistoryPanel", () => {
  beforeEach(() => {
    api.listAcademicContentRevisions.mockReset().mockResolvedValue({
      items: [summary],
      page: 1,
      limit: 10,
      total: 11,
    });
    api.getAcademicContentRevision.mockReset().mockResolvedValue({
      ...summary,
      academicContentId: "content-1",
      academicYearId: "year-1",
      termId: "term-1",
      type: "GENERAL_RESOURCE",
      audience: "INTERNAL_STAFF",
      description: null,
      targets: [],
      assets: [],
      links: [],
      tags: [],
      details: null,
    });
  });

  it("paginates summaries and fetches detail only after opening a revision", async () => {
    render(<RevisionHistoryPanel contentId="content-1" />);

    expect(await screen.findByText("Revision three")).toBeInTheDocument();
    expect(screen.queryByText(summary.capturedAt)).not.toBeInTheDocument();
    expect(screen.getByText(/Sep 30, 2026/)).toBeInTheDocument();
    expect(screen.getByText(/Sep 30, 2026/).closest("time")).toHaveAttribute(
      "datetime",
      summary.capturedAt,
    );
    expect(api.listAcademicContentRevisions).toHaveBeenCalledWith("content-1", {
      page: 1,
      limit: 10,
    });
    expect(api.getAcademicContentRevision).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Open version 3" }));
    await waitFor(() =>
      expect(api.getAcademicContentRevision).toHaveBeenCalledWith(
        "content-1",
        "revision-1",
      ),
    );

    fireEvent.click(screen.getByRole("button", { name: "Next versions page" }));
    await waitFor(() =>
      expect(api.listAcademicContentRevisions).toHaveBeenLastCalledWith(
        "content-1",
        {
          page: 2,
          limit: 10,
        },
      ),
    );
  });
});
