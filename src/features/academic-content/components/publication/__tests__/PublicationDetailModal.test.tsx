import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AcademicContentPublication } from "../../../types/contracts";
import PublicationDetailModal from "../PublicationDetailModal";

const detail: AcademicContentPublication = {
  publicationId: "publication-1",
  revisionId: "revision-1",
  status: "PUBLISHED",
  sourceContentStatus: "DRAFT",
  publishAt: "2026-10-05T08:00:00.000Z",
  visibleFrom: "2026-10-05T09:00:00.000Z",
  visibleUntil: "2026-10-06T09:00:00.000Z",
  publishedAt: "2026-10-05T08:00:05.000Z",
  expiredAt: null,
  cancelledAt: null,
  studentRecipientCount: 12,
  guardianRecipientContextCount: 8,
  createdByUserId: "user-1",
  createdAt: "2026-10-05T07:59:00.000Z",
};

describe("PublicationDetailModal", () => {
  it("loads endpoint-backed detail and displays every safe field", async () => {
    const onLoad = vi.fn().mockResolvedValue(detail);
    render(
      <PublicationDetailModal
        isOpen
        publicationId="publication-1"
        detail={detail}
        error={null}
        isLoading={false}
        onLoad={onLoad}
        onClose={vi.fn()}
      />,
    );

    await waitFor(() => expect(onLoad).toHaveBeenCalledWith("publication-1"));
    expect(screen.getByText("publication-1")).toBeInTheDocument();
    expect(screen.getByText("revision-1")).toBeInTheDocument();
    expect(screen.getByText("Published")).toBeInTheDocument();
    expect(screen.getByText("Draft")).toBeInTheDocument();
    expect(screen.getByText("user-1")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getAllByRole("time")).toHaveLength(5);
    expect(screen.getByText(/fixed historical counts/i)).toBeInTheDocument();
    expect(screen.queryByText(/recipient identities:/i)).toBeNull();
  });

  it("shows a loader while endpoint detail is pending", () => {
    render(
      <PublicationDetailModal
        isOpen
        publicationId="publication-1"
        detail={null}
        error={null}
        isLoading
        onLoad={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });
});
