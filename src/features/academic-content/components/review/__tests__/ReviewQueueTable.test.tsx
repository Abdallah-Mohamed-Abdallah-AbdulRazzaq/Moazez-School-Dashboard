import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ReviewQueueTable from "../ReviewQueueTable";
import type { AcademicContentReviewQueueItem } from "../../../types/contracts";

function queueItem(
  contentId: string,
  title: string,
  submittedAt: string,
): AcademicContentReviewQueueItem {
  return {
    contentId,
    title,
    academicYearId: "year-1",
    termId: "term-1",
    approvalId: `approval-${contentId}`,
    submittedRevisionId: `revision-${contentId}`,
    roundNumber: 1,
    submittedAt,
    submittedByUserId: "teacher-1",
    targets: [],
  };
}

describe("ReviewQueueTable", () => {
  it("preserves the backend oldest-first order and opens the selected revision", () => {
    const onOpen = vi.fn();
    const items = [
      queueItem("oldest", "Oldest submission", "2026-10-01T08:00:00.000Z"),
      queueItem("newest", "Newest submission", "2026-10-02T08:00:00.000Z"),
    ];

    render(
      <ReviewQueueTable
        items={items}
        page={1}
        limit={50}
        total={2}
        isLoading={false}
        searchQuery=""
        onOpen={onOpen}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />,
    );

    const titles = screen.getAllByText(/submission$/);
    expect(titles.map((node) => node.textContent)).toEqual([
      "Oldest submission",
      "Newest submission",
    ]);

    fireEvent.click(screen.getByText("Newest submission"));
    expect(onOpen).toHaveBeenCalledWith(items[1]);
  });
});
