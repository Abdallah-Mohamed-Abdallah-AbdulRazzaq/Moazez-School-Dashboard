import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AcademicContentLibraryItem } from "../../../types/contracts";
import OnlineSessionResults from "../OnlineSessionResults";

const session: AcademicContentLibraryItem = {
  id: "session-1",
  academicYearId: "year-1",
  termId: "term-1",
  type: "ONLINE_SESSION",
  audience: "STUDENTS",
  title: "Fractions review",
  description: "Interactive practice",
  status: "SCHEDULED",
  archivedAt: null,
  createdAt: "2026-10-01T08:00:00.000Z",
  updatedAt: "2026-10-05T08:00:00.000Z",
  summary: {
    type: "ONLINE_SESSION",
    platform: "GOOGLE_MEET",
    startAt: "2026-10-06T10:00:00.000Z",
    endAt: "2026-10-06T10:45:00.000Z",
  },
};

describe("online sessions presentation", () => {
  it("renders list-contract fields with the matching platform icon and derived timing", () => {
    const { container } = render(
      <OnlineSessionResults
        items={[session]}
        page={1}
        limit={10}
        total={1}
        search=""
        isLoading={false}
        error={null}
        hasFilters={false}
        now={new Date("2026-10-06T10:15:00.000Z")}
        onOpen={vi.fn()}
        onRetry={vi.fn()}
        onClearFilters={vi.fn()}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />,
    );

    expect(screen.getAllByText("Fractions review").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Google Meet").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Live now").length).toBeGreaterThan(0);
    expect(screen.getAllByText("45 min").length).toBeGreaterThan(0);
    expect(
      container.querySelector('img[src*="google-meet.png"]'),
    ).toBeInTheDocument();
    expect(screen.queryByText("Join session")).not.toBeInTheDocument();
  });
});
