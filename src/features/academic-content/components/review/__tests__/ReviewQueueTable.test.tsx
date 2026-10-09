import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ReviewQueueTable from "../ReviewQueueTable";
import type { AcademicContentReviewQueueItem } from "../../../types/contracts";
import { academicContentBrowseOptionsFixture } from "../../../__tests__/academicContentBrowseOptionsFixture";

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
    submittedByUserId: "teacher-user-1",
    targets: [
      {
        scopeType: "GRADE",
        stageId: null,
        gradeId: "grade-1",
        sectionId: null,
        classroomId: null,
        subjectId: "subject-1",
        teacherSubjectAllocationId: null,
      },
    ],
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
        targetOptions={academicContentBrowseOptionsFixture.targetOptions}
        teachers={academicContentBrowseOptionsFixture.teachers}
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
    expect(screen.getAllByText("Mona Ali")).toHaveLength(2);
    expect(screen.getAllByText(/Grade 5.*Mathematics/)).toHaveLength(2);
    expect(screen.queryByText("teacher-user-1")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Newest submission"));
    expect(onOpen).toHaveBeenCalledWith(items[1]);
  });

  it("uses localized unavailable copy instead of unresolved identifiers", () => {
    render(
      <ReviewQueueTable
        items={[
          queueItem(
            "unresolved",
            "Unresolved submission",
            "2026-10-01T08:00:00.000Z",
          ),
        ]}
        page={1}
        limit={50}
        total={1}
        isLoading={false}
        searchQuery=""
        targetOptions={null}
        teachers={[]}
        onOpen={vi.fn()}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />,
    );

    expect(screen.getAllByText("Name unavailable")).not.toHaveLength(0);
    expect(screen.queryByText("teacher-user-1")).not.toBeInTheDocument();
    expect(screen.queryByText("grade-1")).not.toBeInTheDocument();
  });
});
